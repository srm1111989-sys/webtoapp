import sys
sys.path.insert(0, '/opt/webtoapp/backend')
import os
os.environ.pop('DATABASE_URL', None)
os.environ.pop('DATABASE_URL_SYNC', None)
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
os.environ['DATABASE_URL_SYNC'] = 'postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
from app.utils.email import send_email

apk_url = 'https://websitetoapp.app/api/artifacts/builds/cb69709c-4199-42cf-be2f-45d2c942db36/ee3aa262-585a-408d-8cac-c6192aea2bdb.apk'
aab_url = 'https://websitetoapp.app/api/artifacts/builds/cb69709c-4199-42cf-be2f-45d2c942db36/74984fa6-36c0-4144-b894-db1023e45c82.aab'

html = """<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Build v25 Ready - Version Code 25</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Ali,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Thank you for confirming Google Sign-In works. Here is the new AAB with the correct version code.</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>What changed:</strong></p>
    <ul style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Version code bumped from 22 to 25 (Play Console accepts higher version codes)</li>
      <li>Keystore: same as before (SHA-1 matches Play Console)</li>
      <li>Google Sign-In fix retained</li>
    </ul>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Download links:</strong></p>
    <div style="text-align: center; margin: 16px 0;">
      <a href="{apk}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#059669;">Download APK v25</a><br>
      <a href="{aab}" style="display:inline-block; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin:4px; background:#2563eb;">Download AAB v25</a>
    </div>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">You can now upload the AAB to Google Play Console.</p>
    <p style="font-size: 14px; color: #111827;">Best regards,<br>Website To App Support</p>
  </div>
</div>""".format(apk=apk_url, aab=aab_url)

result = send_email('lovasecond931@gmail.com', 'Build v25 Ready - Version Code 25 AAB for Play Store', html)
print('Email sent:', result)
