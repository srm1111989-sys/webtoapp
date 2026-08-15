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
    <h1 style="color: white; margin: 0; font-size: 22px;">Root Cause Found: Play App Signing SHA-1</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Hi Ali,</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">I have identified the root cause of the <strong>signin_failed_8</strong> error.</p>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>The problem:</strong></p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">Your APK is signed with your upload key (SHA-1: F0:1A:63:83:...), which is registered in Firebase. That is why the APK works.</p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">However, when you upload an AAB to Google Play, Google Play re-signs the APK with its own <strong>App Signing key</strong>. This App Signing key has a <strong>different SHA-1 fingerprint</strong> that is NOT registered in your Firebase OAuth clients. Google Sign-In checks the SHA-1, and when it does not match, it returns <code>signin_failed_8</code>.</p>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>To fix this, please follow these steps:</strong></p>
    <ol style="font-size: 14px; color: #374151; line-height: 1.8; padding-left: 20px;">
      <li>Open <a href="https://play.google.com/console" style="color:#059669;">Google Play Console</a></li>
      <li>Select your app <strong>Academic Fresh</strong></li>
      <li>Go to <strong>Setup &gt; App integrity</strong> (or "App signing")</li>
      <li>Under <strong>App signing key certificate</strong>, copy the <strong>SHA-1</strong> fingerprint (it will be different from your upload key)</li>
      <li>Open <a href="https://console.firebase.google.com" style="color:#059669;">Firebase Console</a> &gt; your project &gt; <strong>Project settings</strong></li>
      <li>Go to <strong>Your apps</strong> &gt; select your Android app</li>
      <li>Under <strong>SHA certificate fingerprints</strong>, click <strong>Add fingerprint</strong></li>
      <li>Paste the SHA-1 from Play Console App Signing</li>
      <li>Save</li>
      <li>Download the updated <code>google-services.json</code> from Firebase</li>
      <li>Re-upload it to your WebToApp dashboard</li>
      <li>Trigger a new build and upload the AAB to Google Play</li>
    </ol>

    <p style="font-size: 14px; color: #374151; line-height: 1.6;"><strong>Why this is not our code bug:</strong></p>
    <p style="font-size: 14px; color: #374151; line-height: 1.6;">The APK works perfectly, which proves the app code and Firebase configuration are correct. The issue is specifically in the Google Play signing process, which replaces your signing certificate. This is a standard requirement for all Android apps on Google Play that use Google Sign-In.</p>

    <p style="font-size: 14px; color: #111827;">Best regards,<br>Website To App Support</p>
  </div>
</div>"""

result = send_email('lovasecond931@gmail.com', 'Root Cause Found - Google Play App Signing SHA-1', html)
print('Email sent:', result)