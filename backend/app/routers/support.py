import re
import time
from collections import defaultdict, deque
from html import escape
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from app.utils.email import send_email

router = APIRouter(prefix="/api/support", tags=["support"])

SUPPORT_EMAIL = "support@websitetoapp.app"

# Per-IP rate limit: 5 messages / 10 min
_RATE_WINDOW = 600
_RATE_LIMIT = 5
_buckets: dict[str, deque[float]] = defaultdict(deque)


def _ip_allowed(ip: str) -> bool:
    now = time.time()
    bucket = _buckets[ip]
    while bucket and now - bucket[0] > _RATE_WINDOW:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT:
        return False
    bucket.append(now)
    return True


class SupportRequest(BaseModel):
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    pageUrl: Optional[str] = Field(default=None, max_length=500)
    userAgent: Optional[str] = Field(default=None, max_length=500)
    userId: Optional[int] = None
    userEmail: Optional[str] = None


@router.post("")
async def submit_support(payload: SupportRequest, request: Request):
    ip = (request.headers.get("x-forwarded-for") or request.client.host or "unknown").split(",")[0].strip()
    if not _ip_allowed(ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")

    reporter = payload.userEmail or payload.email

    rows = [
        ("From", f"<strong>{escape(reporter)}</strong>"),
    ]
    if payload.userId:
        rows.append(("User ID", f"#{payload.userId}"))
    rows.append(("Subject", f"<strong>{escape(payload.subject)}</strong>"))
    if payload.pageUrl:
        rows.append(("Page", f'<a href="{escape(payload.pageUrl)}">{escape(payload.pageUrl)}</a>'))
    rows.append(("IP", f'<span style="color:#888">{escape(ip)}</span>'))
    if payload.userAgent:
        rows.append(("User Agent", f'<span style="color:#888;font-size:12px">{escape(payload.userAgent[:200])}</span>'))

    rows_html = "".join(
        f'<tr><td style="padding:6px 0;color:#666;width:120px">{label}</td><td style="padding:6px 0">{value}</td></tr>'
        for label, value in rows
    )

    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#2563eb;margin:0 0 16px">WebToApp Support Request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">{rows_html}</table>
      <div style="border-top:1px solid #ddd;padding-top:16px">
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.5">{escape(payload.message)}</div>
      </div>
    </div>
    """

    ok = send_email(SUPPORT_EMAIL, f"[Support] {payload.subject[:150]}", html)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send email")
    return {"ok": True}
