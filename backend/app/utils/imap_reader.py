"""
Standalone IMAP inbox reader for support@websitetoapp.app (Zoho).
Run from anywhere — no local name conflicts.

Usage:
  python3 imap_reader.py              # list last 20 inbox messages
  python3 imap_reader.py 50           # list last 50
  python3 imap_reader.py read 42      # read full body of message #42
"""

import imaplib
import email
from email.header import decode_header
import sys
import os

IMAP_HOST = "imappro.zoho.in"
IMAP_PORT = 993

# Load .env from webtoapp/backend/
_env_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".env"))
_creds = {}
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                _creds[k.strip()] = v.strip().strip('"').strip("'")

IMAP_USER = _creds.get("SMTP_USER", "")
IMAP_PASS = _creds.get("SMTP_PASSWORD", "")


def decode_mime_header(raw):
    if not raw:
        return ""
    parts = decode_header(raw)
    decoded = []
    for part, charset in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(part)
    return "".join(decoded)


def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                payload = part.get_payload(decode=True)
                charset = part.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
    else:
        if msg.get_content_type() == "text/plain":
            payload = msg.get_payload(decode=True)
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    return "(no plain-text body)"


def read_inbox(limit=20):
    conn = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    conn.login(IMAP_USER, IMAP_PASS)
    conn.select("INBOX")

    status, data = conn.search(None, "ALL")
    ids = data[0].split()
    total = len(ids)
    print(f"Inbox has {total} messages\n")

    recent = ids[-limit:] if total > limit else ids
    recent.reverse()

    messages = []
    for mid in recent:
        status, msg_data = conn.fetch(mid, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subject = decode_mime_header(msg["Subject"])
        frm = decode_mime_header(msg["From"])
        date = msg["Date"]

        print(f"--- #{mid.decode()} ---")
        print(f"Date:    {date}")
        print(f"From:    {frm}")
        print(f"Subject: {subject}")
        print()
        messages.append((mid, msg, subject, frm, date))

    conn.logout()
    return messages


def read_message(mid):
    conn = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    conn.login(IMAP_USER, IMAP_PASS)
    conn.select("INBOX")
    status, msg_data = conn.fetch(mid, "(RFC822)")
    raw = msg_data[0][1]
    msg = email.message_from_bytes(raw)
    body = get_body(msg)
    subject = decode_mime_header(msg["Subject"])
    frm = decode_mime_header(msg["From"])
    date = msg["Date"]
    conn.logout()
    return subject, frm, date, body


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "read":
        mid = sys.argv[2].encode() if len(sys.argv) > 2 else None
        if mid:
            s, f, d, b = read_message(mid)
            print(f"From:    {f}")
            print(f"Date:    {d}")
            print(f"Subject: {s}")
            print(f"\n--- Body ---\n{b}")
        else:
            print("Usage: imap_reader.py read <message-id>")
    else:
        n = int(sys.argv[1]) if len(sys.argv) > 1 else 20
        read_inbox(n)
