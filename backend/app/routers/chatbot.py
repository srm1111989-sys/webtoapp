import os
import json
import uuid
import google.auth
from google.oauth2 import service_account
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from fastapi.security import HTTPBearer
from app.database import get_db
from app.models.user import User
from app.models.app_config import AppConfig
from app.models.build import Build
from app.models.order import Order
from app.utils.security import decode_token
from app.utils.email import send_email

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

SUPPORT_EMAIL = "support@websitetoapp.app"

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
def init_google_auth():
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
            
    genai.configure(credentials=credentials)

# ── Tool Definitions ──

get_user_apps_decl = FunctionDeclaration(
    name="get_user_apps",
    description="List all apps and websites configured by the user. Use this when they ask about their apps or want to see what they have built.",
    parameters={"type": "OBJECT", "properties": {}}
)

get_build_status_decl = FunctionDeclaration(
    name="get_build_status",
    description="Get the status of the most recent app builds for the user (Android APK, iOS, etc.). Use this when the user asks about build progress or downloads.",
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

# ── Router endpoint ──

@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON"):
        raise HTTPException(status_code=500, detail="Gemini service credentials not configured.")

    try:
        init_google_auth()

        documentation_context = load_docs_context()
        system_instruction = (
            "You are WebToApp AI Assistant, a helpful support copilot for the WebToApp platform. "
            "Help users answer questions about converting websites into Android & iOS apps. "
            "WebToApp details:\n"
            "- Website: https://websitetoapp.app\n"
            "- Features: Push notifications, Splash screen, custom color styling, offline support, file uploads/downloads, Google Play/App Store publishing help.\n"
            "- Pricing: Basic Plan ($19) offers 1 build/month, Pro Plan ($49) offers unlimited builds, custom branding, and push notifications. Agency Plan ($99) includes Play Store upload assistance.\n"
            "- Support: support@websitetoapp.app.\n\n"
            "If the user is logged in, you can look up their apps using 'get_user_apps' or check build progress with 'get_build_status'. "
            "You can also submit support requests for them using 'send_support_email'. "
            "If they ask for user-specific data but are not logged in (user is None), politely ask them to login first.\n\n"
            "Format your answers beautifully using Markdown. Make sure any links you return are clickable using standard markdown: [Link Text](URL). "
            "Be precise, friendly, and direct.\n\n"
            "Use the following official product documentation to answer the user's questions:\n"
            f"{documentation_context}"
        )

        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            tools=[chatbot_tools],
            system_instruction=system_instruction
        )

        chat = model.start_chat()
        response = chat.send_message(req.question.strip())

        for turn in range(5):
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
                                f"- **{app.app_name}** ({app.platform}): URL={app.web_url}, Package={app.package_name}, Created={app.created_at.strftime('%Y-%m-%d')}"
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
                                f"- Build #{b.id[:8]} ({b.platform}): Status={b.status}, Created={b.created_at.strftime('%Y-%m-%d %H:%M')}"
                                + (f", Error={b.error_message}" if b.error_message else "")
                                + (f", Download={b.output_url}" if b.output_url else "")
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
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")
