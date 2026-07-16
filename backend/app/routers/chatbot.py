import os
import json
import uuid
import time
import google.auth
from google.oauth2 import service_account
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional, List

from fastapi.security import HTTPBearer
from app.database import get_db
from app.models.user import User
from app.models.app_config import AppConfig
from app.models.build import Build
from app.models.order import Order
from app.utils.security import decode_token
from app.utils.email import send_email
from app.services.guardrails import IntentClassifier

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

SUPPORT_EMAIL = "support@websitetoapp.app"


def is_chatbot_enabled() -> bool:
    return os.environ.get("ASK_AI_ENABLED", "false").lower() == "true"

def load_docs_context() -> str:
    paths_to_try = [
        os.path.join(os.path.dirname(__file__), "..", "docs"),
        os.path.join(os.path.dirname(__file__), "..", "..", "docs"),
        os.path.join(os.getcwd(), "docs"),
        os.path.join(os.getcwd(), "backend", "app", "docs"),
        "/app/docs",
    ]
    docs_content = ""
    for docs_dir in paths_to_try:
        if os.path.exists(docs_dir) and os.path.isdir(docs_dir):
            found = False
            for filename in os.listdir(docs_dir):
                if filename.endswith(".md"):
                    file_path = os.path.join(docs_dir, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            docs_content += f"\n\n--- Document: {filename} ---\n{f.read()}"
                            found = True
                    except Exception:
                        pass
            if found:
                break
    return docs_content

optional_security = HTTPBearer(auto_error=False)

# Helper to resolve optional user from token
async def get_optional_user(
    credentials: Optional[any] = Depends(optional_security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        return result.scalar_one_or_none()
    except Exception:
        return None

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

# ── Gemini Auth helper ──
def init_gemini_auth():
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
        return

    g_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    credentials = None
    if g_json:
        try:
            info = json.loads(g_json)
            credentials = service_account.Credentials.from_service_account_info(
                info,
                scopes=['https://www.googleapis.com/auth/generative-language']
            )
        except Exception as e:
            print(f"Error parsing service account JSON: {e}")

    if not credentials:
        try:
            credentials, _ = google.auth.default(
                scopes=['https://www.googleapis.com/auth/generative-language']
            )
        except Exception as e:
            print(f"ADC failed: {e}")

    if credentials:
        genai.configure(credentials=credentials)

# ── Tool Definitions ──

get_user_apps_decl = FunctionDeclaration(
    name="get_user_apps",
    description="List all apps and websites configured by the user. Use this when they ask about their apps or want to see what they have built.",
    parameters={"type": "OBJECT", "properties": {}}
)

get_build_status_decl = FunctionDeclaration(
    name="get_build_status",
    description="Get the status of the most recent app builds for the user (Android APK, Windows Desktop, etc.). Use this when the user asks about build progress or downloads.",
    parameters={"type": "OBJECT", "properties": {}}
)

send_support_email_decl = FunctionDeclaration(
    name="send_support_email",
    description="Create a support ticket or contact WebToApp support on behalf of the user.",
    parameters={
        "type": "OBJECT",
        "properties": {
            "email": {
                "type": "STRING",
                "description": "The user's email address for replies."
            },
            "subject": {
                "type": "STRING",
                "description": "Concise subject line of the support ticket."
            },
            "message": {
                "type": "STRING",
                "description": "Detailed support description/body."
            }
        },
        "required": ["email", "subject", "message"]
    }
)

chatbot_tools = Tool(
    function_declarations=[
        get_user_apps_decl,
        get_build_status_decl,
        send_support_email_decl
    ]
)

# ── Observability & Telemetry database helpers ──

async def ensure_telemetry_table(db: AsyncSession):
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS chatbot_logs (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                latency_ms INTEGER NOT NULL,
                is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """))
        await db.execute(text("ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS user_key TEXT"))
        await db.execute(text("ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS total_tokens INTEGER NOT NULL DEFAULT 0"))
        await db.execute(text("ALTER TABLE chatbot_logs ADD COLUMN IF NOT EXISTS est_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0"))
        await db.execute(text("CREATE INDEX IF NOT EXISTS idx_chatbot_logs_ratelimit ON chatbot_logs (user_key, created_at)"))
        await db.commit()
    except Exception as e:
        print(f"Failed to ensure chatbot telemetry table: {e}")


# gemini-flash-latest blended $/token — conservative single rate for cost tracking.
COST_PER_TOKEN_USD = 0.60 / 1_000_000
def est_cost_usd(tokens: int) -> float:
    return round(tokens * COST_PER_TOKEN_USD, 6)

# Per-key rate limits, counted from chatbot_logs (durable, shared across workers).
RL_PER_HOUR = 30
RL_PER_DAY = 150
async def check_rate_limit(db: AsyncSession, user_key: str) -> Optional[str]:
    """Returns None if allowed, else a 'hour'/'day' scope string."""
    try:
        await ensure_telemetry_table(db)
        row = (await db.execute(
            text("""SELECT
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS hour,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')  AS day
              FROM chatbot_logs WHERE user_key = :k"""),
            {"k": user_key}
        )).first()
        if row and row.hour >= RL_PER_HOUR:
            return "hour"
        if row and row.day >= RL_PER_DAY:
            return "day"
        return None
    except Exception as e:
        print(f"Rate-limit check failed (allowing): {e}")
        return None  # fail open



# Central chatbot feedback reporting (admin.modbussimulator.com AI Chatbot tab)
import asyncio as _asyncio
import httpx as _httpx

async def report_feedback_central(question: str, answer: str, user_email: str = ""):
    token = os.environ.get("FEEDBACK_INGEST_TOKEN", "")
    if not token:
        return
    try:
        async with _httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://modbussimulator.com/api/chatbot-feedback",
                headers={"x-feedback-token": token},
                json={"site": "websitetoapp.app", "question": question, "answer": answer, "user_email": user_email},
            )
    except Exception as e:
        print(f"[chatbot] central feedback report failed: {e}")

async def log_interaction(db: AsyncSession, question: str, answer: str, latency_ms: int, is_blocked: bool,
                          user_key: str = "anon", total_tokens: int = 0):
    try:
        await ensure_telemetry_table(db)
        await db.execute(
            text("""INSERT INTO chatbot_logs (question, answer, latency_ms, is_blocked, user_key, total_tokens, est_cost_usd)
                    VALUES (:q, :a, :l, :b, :k, :t, :c)"""),
            {"q": question, "a": answer, "l": latency_ms, "b": is_blocked,
             "k": user_key, "t": total_tokens, "c": est_cost_usd(total_tokens)}
        )
        await db.commit()
    except Exception as e:
        print(f"Failed to log chatbot interaction: {e}")

# ── Router endpoint ──

@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    if not is_chatbot_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    # Require login to use the AI assistant.
    if user is None:
        return ChatResponse(answer="Please [sign in](https://websitetoapp.app/login) to chat with the AI assistant.")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    start_time = time.time()
    user_key = f"email:{user.email.lower()}"
    total_tokens = 0

    # Rate limit before spending any Gemini tokens.
    rl_scope = await check_rate_limit(db, user_key)
    if rl_scope:
        msg = ("You have reached the hourly message limit for the AI assistant. Please try again later."
               if rl_scope == "hour"
               else "You have reached the daily message limit for the AI assistant. Please try again tomorrow.")
        latency_ms = int((time.time() - start_time) * 1000)
        await log_interaction(db, req.question.strip(), msg, latency_ms, True, user_key, 0)
        return ChatResponse(answer=msg)

    # Run input guardrails
    blocked, reason = IntentClassifier().is_blocked_question(req.question)
    if blocked:
        latency_ms = int((time.time() - start_time) * 1000)
        await log_interaction(db, req.question.strip(), reason, latency_ms, True, user_key, 0)
        return ChatResponse(answer=reason)

    try:
        init_gemini_auth()
        if not (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")):
            raise HTTPException(status_code=500, detail="Gemini credentials not configured.")

        documentation_context = load_docs_context()
        system_instruction = (
            "You are WebToApp AI Assistant, a helpful support copilot for the WebToApp platform. "
            "Help users answer questions about converting websites into Android apps. "
            "WebToApp details:\n"
            "- Website: https://websitetoapp.app\n"
            "- Features: Push notifications, Splash screen, custom color styling, offline support, file uploads/downloads, Google Play publishing help, live phone-frame app preview in the wizard (the 'simulator').\n"
            "- iOS is not available yet (Apple review rejects plain webview wrappers); there is an iOS waitlist in the wizard. iPhones can use the website as a PWA meanwhile.\n"
            "- Pricing (all one-time, no subscription): Free (watermarked, 15-day trial, 2 builds), Android App $25, Desktop App $25, Play Store Listing add-on $15, Android App + Play Store bundle $40. Indian users pay INR equivalent. Both APK and AAB files are provided on ALL plans, including free.\n"
            "- Support: support@websitetoapp.app.\n\n"
            "If the user is logged in, you can look up their apps using 'get_user_apps' or check build progress with 'get_build_status'. "
            "You can also submit support requests for them using 'send_support_email'. "
            "If they ask for user-specific data but are not logged in (user is None), politely ask them to login first.\n\n"
            "Never add a 'Sources', 'References', or citations section — just answer directly. "
            "Format your answers beautifully using Markdown. Make sure any links you return are clickable using standard markdown: [Link Text](URL). "
            "Be precise, friendly, and direct.\n\n"
            "Use the following official product documentation to answer the user's questions:\n"
            f"{documentation_context}"
        )

        model = genai.GenerativeModel(
            "gemini-flash-latest",
            tools=[chatbot_tools],
            system_instruction=system_instruction,
            # Cap output — support answers should be short; output tokens are the
            # most expensive part of the bill. Keeps replies tight and cheap.
            generation_config={"max_output_tokens": 600, "temperature": 0.4},
        )

        chat = model.start_chat()
        response = chat.send_message(req.question.strip())

        for turn in range(5):
            try:
                total_tokens += getattr(response, "usage_metadata", None) and response.usage_metadata.total_token_count or 0
            except Exception:
                pass
            candidate = response.candidates[0]
            if candidate.content.parts and candidate.content.parts[0].function_call:
                function_call = candidate.content.parts[0].function_call
                name = function_call.name
                args = function_call.args

                result = ""
                if name == "get_user_apps":
                    if not user:
                        result = "Error: User is not authenticated. Please log in first."
                    else:
                        db_result = await db.execute(
                            select(AppConfig).where(AppConfig.user_id == user.id).order_by(AppConfig.created_at.desc())
                        )
                        apps = db_result.scalars().all()
                        if not apps:
                            result = "No apps found. You can create a new app in the dashboard."
                        else:
                            result = "Your configured apps:\n" + "\n".join(
                                f"- **{app.name}** ({', '.join(app.selected_platforms or ['android'])}): URL={app.url}, Package={app.package_name}, Created={app.created_at.strftime('%Y-%m-%d')}"
                                for app in apps
                            )
                elif name == "get_build_status":
                    if not user:
                        result = "Error: User is not authenticated. Please log in first."
                    else:
                        db_result = await db.execute(
                            select(Build)
                            .join(Order, Build.order_id == Order.id)
                            .where(Order.user_id == user.id)
                            .order_by(Build.created_at.desc())
                            .limit(5)
                        )
                        builds = db_result.scalars().all()
                        if not builds:
                            result = "No builds found for your account yet."
                        else:
                            result = "Your recent build attempts:\n" + "\n".join(
                                f"- Build #{str(b.id)[:8]} ({b.platform}/{b.build_type}): Status={b.status}, Created={b.created_at.strftime('%Y-%m-%d %H:%M')}"
                                + (f", Error={b.error_message}" if b.error_message else "")
                                + (f", APK={b.apk_url}" if b.apk_url else "")
                                + (f", AAB={b.aab_url}" if b.aab_url else "")
                                + (f", EXE={b.exe_url}" if b.exe_url else "")
                                + (f", Keystore={b.keystore_url}" if b.keystore_url else "")
                                for b in builds
                            )
                elif name == "send_support_email":
                    html_content = f"""
                    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
                      <h2 style="color:#2563eb;margin:0 0 16px">WebToApp Support Ticket (AI Chatbot)</h2>
                      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
                        <tr><td style="padding:6px 0;color:#666;width:120px">From</td><td style="padding:6px 0"><strong>{args.get('email')}</strong></td></tr>
                        <tr><td style="padding:6px 0;color:#666;width:120px">Subject</td><td style="padding:6px 0"><strong>{args.get('subject')}</strong></td></tr>
                      </table>
                      <div style="border-top:1px solid #ddd;padding-top:16px">
                        <div style="white-space:pre-wrap;font-size:14px;line-height:1.5">{args.get('message')}</div>
                      </div>
                    </div>
                    """
                    ok = send_email(SUPPORT_EMAIL, f"[Support AI] {args.get('subject')[:150]}", html_content)
                    if ok:
                        result = "Support ticket sent successfully. Our support team will reply within 24 hours."
                    else:
                        result = "Failed to send email via SMTP."
                else:
                    result = f"Error: Unknown tool '{name}'"

                # Send response back to Gemini
                response = chat.send_message(
                    genai.types.Part.from_function_response(
                        name=name,
                        response={"result": result}
                    )
                )
            else:
                break

        answer = response.text if response.text else "I could not formulate an answer."
        latency_ms = int((time.time() - start_time) * 1000)
        await log_interaction(db, req.question.strip(), answer, latency_ms, False, user_key, total_tokens)
        _asyncio.create_task(report_feedback_central(req.question.strip(), answer, user.email or ""))
        return ChatResponse(answer=answer)
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        print(f"[chatbot] agent error: {e}")
        await log_interaction(db, req.question.strip(), "AI assistant temporarily unavailable.", latency_ms, False, user_key, total_tokens)
        raise HTTPException(status_code=500, detail="AI assistant temporarily unavailable. Please try again or contact support@websitetoapp.app.")

@router.get("/metrics")
async def chat_metrics(db: AsyncSession = Depends(get_db)):
    if not is_chatbot_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    try:
        await ensure_telemetry_table(db)
        
        # 1. Total Queries
        res_count = await db.execute(text("SELECT COUNT(*) FROM chatbot_logs"))
        total_queries = res_count.scalar() or 0

        # 2. Avg Latency
        res_latency = await db.execute(text("SELECT COALESCE(AVG(latency_ms), 0.0)::float FROM chatbot_logs"))
        avg_latency = res_latency.scalar() or 0.0
        average_latency_seconds = round(avg_latency / 1000.0, 3)

        # 3. Blocked queries
        res_blocked = await db.execute(text("SELECT COUNT(*) FROM chatbot_logs WHERE is_blocked = True"))
        blocked_queries_count = res_blocked.scalar() or 0

        # 4. Common questions
        res_common = await db.execute(text("""
            SELECT question, COUNT(*) as count 
            FROM chatbot_logs 
            GROUP BY question 
            ORDER BY count DESC 
            LIMIT 5
        """))
        most_common_questions = [
            {"question": row[0], "count": row[1]} for row in res_common.fetchall()
        ]

        # 5. Cost/usage
        res_cost = await db.execute(text("""
            SELECT
                COALESCE(SUM(total_tokens) FILTER (WHERE created_at::date = CURRENT_DATE), 0) AS tokens_today,
                COALESCE(SUM(est_cost_usd) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::float AS cost_today,
                COALESCE(SUM(est_cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::float AS cost_30d
            FROM chatbot_logs
        """))
        cost = res_cost.first()
        res_top = await db.execute(text("""
            SELECT user_key, COUNT(*) AS queries, SUM(total_tokens) AS tokens, SUM(est_cost_usd)::float AS cost
            FROM chatbot_logs WHERE created_at > NOW() - INTERVAL '1 day' AND user_key IS NOT NULL
            GROUP BY user_key ORDER BY cost DESC LIMIT 5
        """))
        top_spenders = [{"user_key": r[0], "queries": r[1], "tokens": int(r[2] or 0), "cost": round(r[3] or 0, 4)} for r in res_top.fetchall()]

        return {
            "total_queries": total_queries,
            "average_latency_seconds": average_latency_seconds,
            "blocked_queries_count": blocked_queries_count,
            "most_common_questions": most_common_questions,
            "tokens_today": int(cost.tokens_today or 0),
            "cost_today_usd": round(cost.cost_today or 0, 4),
            "cost_30d_usd": round(cost.cost_30d or 0, 4),
            "top_spenders_24h": top_spenders,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve metrics: {str(e)}")
