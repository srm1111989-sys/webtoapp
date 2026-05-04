import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel

logger = logging.getLogger("client_errors")
router = APIRouter(prefix="/api/client-errors", tags=["client-errors"])


class ClientError(BaseModel):
    type: str = "js_error"           # js_error | unhandled_promise | network_error
    message: str = ""
    source: str | None = None        # script file URL
    line: int | None = None
    col: int | None = None
    stack: str | None = None
    url: str | None = None           # page URL where error occurred
    userAgent: str | None = None


@router.post("/")
async def log_client_error(error: ClientError, request: Request):
    ip = request.client.host if request.client else "unknown"
    logger.error(
        "[BROWSER] type=%s url=%s message=%s source=%s line=%s stack=%s ip=%s ua=%s",
        error.type,
        error.url or "-",
        error.message[:200] if error.message else "-",
        error.source or "-",
        error.line or "-",
        (error.stack or "")[:300] or "-",
        ip,
        (error.userAgent or "")[:80],
    )
    return {"ok": True}
