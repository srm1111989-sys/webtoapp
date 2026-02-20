import emails
from app.config import get_settings

settings = get_settings()


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.smtp_host:
        return False

    message = emails.html(
        html=html,
        subject=subject,
        mail_from=(settings.smtp_from_name, settings.smtp_from_email),
    )
    response = message.send(
        to=to,
        smtp={
            "host": settings.smtp_host,
            "port": settings.smtp_port,
            "user": settings.smtp_user,
            "password": settings.smtp_password,
            "tls": True,
        },
    )
    return response.status_code == 250


def send_verification_email(to: str, token: str) -> bool:
    link = f"{settings.app_url}/auth/verify?token={token}"
    html = f"""
    <h2>Verify your email</h2>
    <p>Click the link below to verify your email address:</p>
    <a href="{link}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    """
    return send_email(to, f"Verify your email - {settings.app_name}", html)


def send_reset_email(to: str, token: str) -> bool:
    link = f"{settings.app_url}/auth/reset-password?token={token}"
    html = f"""
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="{link}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    """
    return send_email(to, f"Reset your password - {settings.app_name}", html)
