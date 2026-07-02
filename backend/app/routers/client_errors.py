import json
import logging
import os
import threading
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from pydantic import BaseModel

logger = logging.getLogger("client_errors")
router = APIRouter(prefix="/api/client-errors", tags=["client-errors"])

_LOG_FILE = "/opt/webtoapp/logs/frontend-errors.log"
_LOG_MAX_BYTES = 10 * 1024 * 1024
_log_lock = threading.Lock()


def _write_fe_log(entry: dict):
    try:
        os.makedirs(os.path.dirname(_LOG_FILE), exist_ok=True)
        line = json.dumps(entry, ensure_ascii=False) + "\n"
        with _log_lock:
            if os.path.exists(_LOG_FILE) and os.path.getsize(_LOG_FILE) >= _LOG_MAX_BYTES:
                with open(_LOG_FILE) as f:
                    lines = f.readlines()
                with open(_LOG_FILE, "w") as f:
                    f.writelines(lines[len(lines) // 2:])
            with open(_LOG_FILE, "a") as f:
                f.write(line)
    except Exception:
        pass


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
    _write_fe_log({
        "ts": datetime.now(timezone.utc).isoformat(),
        "site": "webtoapp",
        "type": error.type,
        "message": error.message[:500] if error.message else "",
        "url": error.url,
        "source": error.source,
        "line": error.line,
        "stack": (error.stack or "")[:1000] or None,
        "ip": ip,
        "ua": (error.userAgent or "")[:120] or None,
    })
    return {"ok": True}
