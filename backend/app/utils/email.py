import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings

settings = get_settings()


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.smtp_host:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        if settings.smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from_email, to, msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.smtp_user, settings.smtp_password)
                server.sendmail(settings.smtp_from_email, to, msg.as_string())
        return True
    except Exception as e:
        import logging
        logging.getLogger("webtoapp.email").error(f"Failed to send email to {to}: {e}")
        return False


def send_verification_email(to: str, token: str) -> bool:
    link = f"{settings.app_url}/auth/verify?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4f46e5; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Verify Your Email</h1>
        <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">WebToApp — Website to Native App Converter</p>
      </div>
      <div style="padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">Thanks for signing up! Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{link}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Verify My Email</a>
        </div>
        <p style="font-size: 13px; color: #6b7280;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">{link}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      </div>
    </div>
    """
    return send_email(to, f"Verify your email — {settings.app_name}", html)


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


ADMIN_NOTIFY_EMAIL = "mokashiswapnil11@gmail.com"


def send_admin_payment_notification(
    order_number: str,
    customer_email: str,
    app_name: str,
    plan_name: str,
    amount: int,
    currency: str,
    order_id: str,
) -> bool:
    """Notify admin (mokashiswapnil11@gmail.com) on every new paid order."""
    if amount == 0:
        return True  # Skip free plan notifications
    if currency == "INR":
        amount_display = f"₹{amount / 100:,.0f}"
    else:
        amount_display = f"${amount / 100:,.2f}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                border: 2px solid #16a34a; border-radius: 8px; overflow: hidden;">
      <div style="background: #16a34a; padding: 16px 24px; display: flex; align-items: center;">
        <h2 style="color: white; margin: 0; font-size: 20px;">💰 New Payment — WebToApp</h2>
      </div>
      <div style="padding: 20px 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="color: #6b7280; padding: 6px 0;">Order</td>
              <td style="font-weight: 700; text-align: right;">{order_number}</td></tr>
          <tr><td style="color: #6b7280; padding: 6px 0;">Customer</td>
              <td style="text-align: right;">{customer_email}</td></tr>
          <tr><td style="color: #6b7280; padding: 6px 0;">App</td>
              <td style="text-align: right;">{app_name}</td></tr>
          <tr><td style="color: #6b7280; padding: 6px 0;">Plan</td>
              <td style="text-align: right;">{plan_name}</td></tr>
          <tr style="border-top: 2px solid #16a34a;">
            <td style="padding: 10px 0; font-size: 18px; font-weight: 700; color: #16a34a;">Amount</td>
            <td style="text-align: right; font-size: 18px; font-weight: 700; color: #16a34a;">{amount_display}</td>
          </tr>
        </table>
        <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">
          Order ID: {order_id} &nbsp;|&nbsp;
          <a href="https://websitetoapp.app/admin/orders" style="color: #4f46e5;">View in Admin</a>
        </p>
      </div>
    </div>
    """
    return send_email(
        ADMIN_NOTIFY_EMAIL,
        f"💰 New WebToApp Payment: {amount_display} — {order_number}",
        html,
    )


def send_build_complete_email(
    to: str,
    app_name: str,
    order_number: str,
    download_url: str,
    platform: str = "Android",
) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your App Is Ready!</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">Great news! Your {platform} app has been built successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">App Name</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{app_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{order_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Platform</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{platform} APK</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{download_url}" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Download APK</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">You can also download your app from your <a href="{settings.app_url}/apps" style="color: #4f46e5;">dashboard</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 13px; color: #6b7280;"><strong>Next steps:</strong></p>
        <ul style="font-size: 13px; color: #6b7280; padding-left: 20px;">
          <li>Install the APK on your Android device to test</li>
          <li>Upload to Google Play Store using the AAB format (available in your dashboard)</li>
          <li>Share with your users!</li>
        </ul>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Questions? Reply to this email or contact support@websitetoapp.app</p>
      </div>
    </div>
    """
    return send_email(to, f"Your app \"{app_name}\" is ready to download!", html)


def send_build_failed_email(
    to: str,
    app_name: str,
    order_number: str,
    error_message: str = "",
) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Build Failed</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827;">Unfortunately, the build for <strong>{app_name}</strong> failed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">{order_number}</td>
          </tr>
        </table>
        {f'<p style="font-size: 14px; color: #dc2626; background: #fef2f2; padding: 12px; border-radius: 6px;">{error_message}</p>' if error_message else ''}
        <p style="font-size: 14px; color: #6b7280;">Our team has been notified and will look into it. You can also try rebuilding from your <a href="{settings.app_url}/apps" style="color: #4f46e5;">dashboard</a>.</p>
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">Need help? Reply to this email or contact support@websitetoapp.app</p>
      </div>
    </div>
    """
    return send_email(to, f"Build failed for \"{app_name}\" - {settings.app_name}", html)


def send_playstore_announcement(
    to: str,
    user_name: str,
    recent_app_name: str | None = None,
    recent_apk_url: str | None = None,
) -> bool:
    publish_url = f"{settings.app_url}/publish-app"
    app_section = ""
    if recent_app_name and recent_apk_url:
        app_section = f"""
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
          <p style="font-size: 13px; color: #166534; font-weight: 600; margin: 0 0 6px;">Your recent build is ready:</p>
          <p style="font-size: 14px; color: #15803d; margin: 0 0 4px;">App: <strong>{recent_app_name}</strong></p>
          <p style="font-size: 13px; margin: 0;">
            <a href="{recent_apk_url}" style="color: #16a34a; font-weight: 600;">Download APK</a>
          </p>
        </div>
        """

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0 0 6px; font-size: 22px;">New Plan: Assisted Play Store Publishing</h1>
        <p style="color: #c7d2fe; margin: 0; font-size: 14px;">We publish your Android app for you — just $15</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #111827;">Hi {user_name},</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.6;">
          We just launched our <strong>Assisted Google Play Store Publishing</strong> service.
          Skip the confusing Play Console setup — our experts handle your entire app submission for a one-time <strong>$15 flat fee</strong>.
        </p>
        {app_section}
        <div style="background: #f5f3ff; border: 1px solid #e0d9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 13px; color: #5b21b6; font-weight: 600; margin: 0 0 8px;">What's included:</p>
          <ul style="font-size: 13px; color: #4c1d95; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Full Play Store listing setup (title, description, keywords)</li>
            <li>Store screenshots & feature graphic</li>
            <li>App category, content rating & metadata</li>
            <li>Final review & submission to Google Play</li>
            <li>Post-publish confirmation</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{publish_url}" style="background: #4f46e5; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
            Publish My App — $15
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">One-time payment. No subscription. You keep full ownership.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Questions? Reply to this email or contact <a href="mailto:support@websitetoapp.app" style="color: #4f46e5;">support@websitetoapp.app</a></p>
      </div>
    </div>
    """
    return send_email(to, "New: We'll Publish Your App on Google Play Store — $15 Flat", html)


def send_reset_email(to: str, token: str) -> bool:
    link = f"{settings.app_url}/auth/reset-password?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Reset Your Password</h1>
      </div>
      <div style="padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px;">We received a request to reset your password for your WebToApp account.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{link}" style="background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #6b7280;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #dc2626; word-break: break-all;">{link}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </div>
    """
    return send_email(to, f"Reset your password — {settings.app_name}", html)
