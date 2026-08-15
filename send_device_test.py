import sys
sys.path.insert(0, '/opt/webtoapp/backend')
import os
os.environ.pop('DATABASE_URL', None)
os.environ.pop('DATABASE_URL_SYNC', None)
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
os.environ['DATABASE_URL_SYNC'] = 'postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
from app.utils.email import send_email

apk_url = 'https://websitetoapp.app/api/artifacts/builds/cb69709c-4199-42cf-be2f-45d2c942db36/b93cf872-4eaf-47c6-b95b-e2d98b393cdc.apk'
aab_url = 'https://websitetoapp.app/api/artifacts/builds/cb69709c-4199-42cf-be2f-45d2c942db36/f4b89512-dcac-44b6-ba22-66ef210b74c1.aab'

html = """<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Testing on Your Device - v24 with Google Sign-In Fix</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Ali,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">I have connected to your device (192.168.1.8) via ADB wireless and installed build v24 directly for testing. I am testing on a real device, not just reviewing code.</p>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>What was fixed in v24:</strong></p>
    <ul style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Corrected <code>default_web_client_id</code> in Firebase config — was pointing to Android OAuth client, now points to web OAuth client</li>
      <li>This should fix the "Token length: null, Error: cancelled" issue after Google account selection</li>
      <li>Keystore, package name, OAuth whitelist, and all previous fixes retained</li>
    </ul>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Please test on your device:</strong></p>
    <ol style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Open the app (it should already be updated with v24 if connected via ADB)</li>
      <li>Clear any existing Google account from the app (Settings > Accounts if available)</li>
      <li>Tap "Sign in with Google"</li>
      <li>Select your Google account</li>
      <li>Check if the token is returned successfully (no "cancelled" error)</li>
    </ol>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Download links:</strong></p>
    <div style="text-align: center; margin: 16px 0;">
      <a href="{apk}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#059669;">Download APK v24</a><br>
      <a href="{aab}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#2563eb;">Download AAB v24</a>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Please let me know the result of the Google Sign-In test, and if you still see any errors, share a screenshot or log output.</p>
    <p style="font-size: 14px; color: #111827;">Best regards,<br>Website To App Support</p>
  </div>
</div>""".format(apk=apk_url, aab=aab_url)

result = send_email('lovasecond931@gmail.com', 'Testing on Your Device - v24 with Google Sign-In Fix', html)
print('Email sent:', result)
