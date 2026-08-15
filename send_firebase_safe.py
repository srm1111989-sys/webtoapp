import sys
sys.path.insert(0, '/opt/webtoapp/backend')
import os
os.environ.pop('DATABASE_URL', None)
os.environ.pop('DATABASE_URL_SYNC', None)
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
os.environ['DATABASE_URL_SYNC'] = 'postgresql://webtoapp:webtoapp@127.0.0.1:5434/webtoapp'
from app.utils.email import send_email

html = """<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Re: google-services.json - Data Is Safe</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Ali,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">I have verified your project data directly in the database:</p>
    <ul style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li><strong>Firebase config:</strong> Present (2488 bytes)</li>
      <li><strong>Project ID:</strong> gen-lang-client-0849524349</li>
      <li><strong>Web OAuth client ID:</strong> 584835953487-802jr0spe03ms2qsc40am5qcga0uubbq.apps.googleusercontent.com</li>
      <li><strong>Package name:</strong> a.academic.fresh</li>
      <li><strong>Keystore:</strong> Present and correct</li>
    </ul>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Your <code>google-services.json</code> data is <strong>not removed</strong>. It appears to be a dashboard display issue where the file is not visible in the UI, but it is still present in the backend and included in all builds.</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">This is likely a frontend rendering bug. I will investigate the dashboard code to ensure the Firebase config section always displays the uploaded file.</p>
    <p style="font-size: 14px; color: #dc2626; line-height: 1.6;"><strong>Your build v25 AAB (version code 25) is ready for Play Console upload:</strong></p>
    <p style="font-size: 14px; color: #374151;"><a href="https://websitetoapp.app/api/artifacts/builds/cb69709c-4199-42cf-be2f-45d2c942db36/74984fa6-36c0-4144-b894-db1023e45c82.aab" style="color: #059669;">Download AAB v25</a></p>
    <p style="font-size: 14px; color: #111827;">Best regards,<br>Website To App Support</p>
  </div>
</div>"""

result = send_email('lovasecond931@gmail.com', 'Re: google-services.json - Data Is Safe', html)
print('Email sent:', result)