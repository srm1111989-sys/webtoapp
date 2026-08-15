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
    <h1 style="color: white; margin: 0; font-size: 22px;">Build v24 Ready - Google Sign-In Should Now Work</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Ali,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Build v24 is ready with the corrected <code>default_web_client_id</code> that points to the web OAuth client. The Google Sign-In should now return a valid ID token instead of null.</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>What was fixed:</strong></p>
    <ul style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Firebase config: client_info.client_id changed from Android OAuth client (msv3r8tp1bf...) to web OAuth client (802jr0spe03...) - this fixes the "Token length: null, Error: cancelled" issue</li>
      <li>All previous fixes retained (keystore, package, OAuth whitelist)</li>
    </ul>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Download links:</strong></p>
    <div style="text-align: center; margin: 16px 0;">
      <a href="{apk}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#059669;">Download APK v24</a><br>
      <a href="{aab}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#2563eb;">Download AAB v24</a>
    </div>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Testing instructions:</strong></p>
    <ol style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Uninstall the previous APK from your device</li>
      <li>Install v24 APK from the link above (or via Play Store AAB)</li>
      <li>Open the app and tap "Sign in with Google"</li>
      <li>Select your Google account - you should now see your account signed in successfully</li>
    </ol>
    <p style="font-size: 14px; color: #111827;">Best regards,<br>Website To App Support</p>
  </div>
</div>""".format(apk=apk_url, aab=aab_url)

result = send_email('lovasecond931@gmail.com', 'Build v24 Ready - Google Sign-In Fix', html)
print('Email sent:', result)