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


def send_order_confirmation_email(
    to: str,
    order_number: str,
    app_name: str,
    plan_name: str,
    amount: int,
    currency: str,
    order_id: str,
) -> bool:
    if amount == 0:
        amount_display = "Free"
    elif currency == "INR":
        amount_display = f"₹{amount / 100:,.0f}"
    else:
        amount_display = f"${amount / 100:,.2f}"

    order_link = f"{settings.app_url}/orders/{order_id}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4f46e5; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">Thank you for your order!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{order_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">App</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{app_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{plan_name}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Amount</td>
            <td style="padding: 12px 0; text-align: right; font-size: 16px; font-weight: 700; color: #4f46e5;">{amount_display}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #6b7280;">Your app build has been triggered and will be ready shortly.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{order_link}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Order Details</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you have any questions, reply to this email or contact support@websitetoapp.app</p>
      </div>
    </div>
    """
    return send_email(to, f"Order Confirmed: {order_number} - {settings.app_name}", html)


def send_reset_email(to: str, token: str) -> bool:
    link = f"{settings.app_url}/auth/reset-password?token={token}"
    html = f"""
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="{link}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    """
    return send_email(to, f"Reset your password - {settings.app_name}", html)
