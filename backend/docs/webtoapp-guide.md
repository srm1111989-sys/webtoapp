# WebToApp Platform Guide

WebToApp (websitetoapp.app) converts any website URL into a native Android app (.apk / .aab) or a Windows desktop app (.exe installer). No coding required.

---

## Pricing Plans & Limits

| Plan | Price | Builds |
|------|-------|--------|
| Free (Android or Desktop) | $0 | 2 builds total (lifetime), watermark banner + 3-day trial |
| Premium Android App | $25 one-time | 5 builds total (lifetime) per order |
| Premium Desktop App | $25 one-time | 5 builds total (lifetime) per order |
| Play Store Listing Add-on | $15 one-time | We publish your app to Google Play |
| Android App + Play Store Bundle | $40 one-time | Premium Android + Play Store listing |

* All paid plans are **one-time payments** — no subscriptions, no renewals, no hidden charges.
* Indian users pay in INR (₹2075 for $25 equivalent plans).
* Promo/discount codes can be applied at checkout.
* **APK and AAB files are included on ALL plans, including Free.** The AAB (Android App Bundle) is the format Google Play requires. Download buttons for APK, AAB and the signing keystore appear on the Orders page once a build completes, and the links are also in the build-complete email.

---

## Full Feature List (50+ Features)

### App Platforms
* **Android App** — Native Android app (.apk for direct install, .aab for Play Store)
* **Windows Desktop App** — Windows .exe installer with system tray, native window controls

### Branding & Appearance
* Custom app name and package name (bundle ID)
* Custom launcher icon (uploaded by user)
* Custom splash screen with animation
* Custom loading indicator / progress bar
* Custom primary color / theme
* Custom fonts
* Full-screen / immersive mode
* Orientation lock (portrait or landscape)
* Keep screen on option

### Navigation & UI
* Bottom navigation bar (tabs with icons)
* Side drawer / hamburger menu
* Custom navigation items (label + URL)
* Pull-to-refresh gesture
* In-app browser (for external links)
* Exit confirmation dialog

### Security & Access
* **Custom Keystore (.JKS) Upload** — Upload your own .jks or .keystore file with alias and passwords. Required for updating an existing Play Store app without signature mismatch. Available in Advanced Settings on paid plans.
* Biometric authentication (fingerprint / face unlock) for app launch
* Passcode / PIN lock
* Screenshot block (prevents screen capture)
* SSL pinning
* WebView fallback

### Integrations & APIs
* **Push Notifications** — Firebase Cloud Messaging (FCM). Requires `google-services.json` from Firebase.
* **AdMob Ads** — Banner, interstitial, and rewarded ads. Requires AdMob App ID and Ad Unit IDs.
* **Firebase Configuration** — Server key and google-services.json for FCM.
* Camera access
* Location services (GPS)
* File upload chooser
* File download manager
* QR code scanner
* NFC support
* Bluetooth access
* Deep linking (custom URL scheme / intent filters)
* JavaScript Bridge (call native Android functions from web JS)
* Social sharing
* Rate app prompt
* Analytics integration
* Crash reports
* Device info access
* Battery status
* Vibration API

### Offline & Caching
* Offline mode / local caching
* Cache manager (control cache behavior)
* Cookie control

### Advanced Settings
* Custom User-Agent string
* Custom HTTP headers
* Hardware acceleration toggle
* Auto updates (in-app)
* Media playback (video/audio)
* Audio focus handling
* Multi-language support

### Desktop-Specific Features (Windows)
* Configurable window width, height, min-width, min-height
* Show/hide native title bar
* Show/hide menu bar
* System tray (minimize to tray on close)
* Start maximized or fullscreen
* Native desktop notifications
* Auto-updater (Squirrel-based)
* Kiosk mode
* Custom title bar

---

## How It Works (5-Step Wizard)

1. **Basic Info** — Enter your website URL, app name, package name (e.g. com.yourcompany.appname), and description.
2. **Visuals** — Upload app icon, configure splash screen, set theme color.
3. **Features** — Enable/disable features: push notifications, AdMob, biometric auth, QR scanner, navigation menus, etc.
4. **Advanced** — Configure Firebase, AdMob IDs, custom keystore (.JKS), User-Agent, navigation items, desktop window settings.
5. **Plan & Review** — Select Free or Premium plan, apply promo code, pay via Razorpay (INR/USD) or Stripe (USD).

After payment the build is triggered automatically. Users receive an email with the download link when ready.

### Editing an Existing App

1. Go to **My Apps** and click the pencil icon on any app card.
2. The wizard pre-loads all your existing settings (URL, icon, colors, features, etc.).
3. Make your changes and click through the steps.
4. On the final step, paid users see a **Rebuild App** button — click it to trigger a new build with the updated settings. No additional payment required (uses one of your 5 lifetime builds).

---

## Custom Keystore (.JKS) — Details

If you already have an app on Google Play Store and want to update it using WebToApp:

1. Export your original keystore from Android Studio or Median.co (or wherever you originally built the app).
2. In the wizard's Advanced Settings step, upload the `.jks` or `.keystore` file.
3. Enter the keystore password, key alias, and key password.
4. Build your app — it will be signed with your original keystore, maintaining the same APK signature as your Play Store version.
5. Upload the generated `.aab` to Google Play Console as an update.

Without this, Google Play will reject updates due to signature mismatch (different certificate fingerprint).

---

## Play Store Listing Add-on

* Our team publishes your app to Google Play Store on your behalf.
* You need a Google Play Developer account ($25 one-time Google fee if you don't have one).
* You must add **support@websitetoapp.app** to your Play Console with **Release Manager** permissions.
* Our team contacts you within 24 hours after payment to collect store listing details (description, screenshots, category).

---

## Build Limits & Rebuilds

* **Free plan**: 2 builds total (lifetime, across all free apps on your account).
* **Paid plans**: 5 builds total (lifetime) per order — use them to update your app URL, icon, or settings anytime.
* Each rebuild generates a freshly signed APK/AAB with your latest settings.
* Need more than 5 builds? Contact support@websitetoapp.app to purchase additional builds.

### My Apps Dashboard

The **My Apps** page shows each app with:
* **Plan badge** — "Free Plan" or "Paid Plan" so you know which plan is active for that app.
* **Remaining builds** — e.g. "3 builds remaining of 5" so you always know how many rebuilds you have left.
* Clicking a card opens the order detail page (or the edit page if no order exists yet).

---

## Support & Contact

* **Email**: support@websitetoapp.app
* **WhatsApp**: Available for paid plan users
* **Refund policy**: Case-by-case. Contact support within 7 days of purchase.
* For billing issues, order status, or technical problems — email support@websitetoapp.app with your order number.

## Firebase Push Notifications — Server Key setup

To enable push notifications you need two things from the [Firebase Console](https://console.firebase.google.com):

1. **google-services.json** — Project Settings → Your apps → Android app → download `google-services.json`. Upload it in step 4 (Advanced) of the wizard. The package name in Firebase must exactly match your app's package name.
2. **Service account / API credentials** — the legacy "Cloud Messaging Server Key" is deprecated by Google and hidden by default. In Project Settings → Cloud Messaging: if you see "Cloud Messaging API (Legacy)" as disabled, click the three-dot menu → "Manage API in Google Cloud Console" → Enable. After enabling, the Server Key appears under Project Settings → Cloud Messaging. New Firebase projects should prefer the **FCM HTTP v1 API** with a service-account JSON (Project Settings → Service accounts → Generate new private key).

Common issues:
* "Server key not visible" — the legacy API is disabled; enable it via the three-dot menu as above.
* Notifications not arriving — check the package name matches and the device has notification permission (Android 13+ prompts at first app launch).

## Splash Screen configuration

* Upload the splash image in step 2 (Visuals) of the wizard. Any common image format works (PNG/JPG/WebP) — it is converted automatically.
* Recommended size: **1080×1920 px (portrait)**. Very large images are resized automatically; extremely wide/landscape images may be cropped on phones.
* The splash background color comes from your app's primary color setting.
* Free plan builds show a small watermark banner; paid builds are watermark-free.
* To change the splash later: edit the app in the dashboard, upload a new image, and rebuild.

## Live App Preview (simulator)

WebToApp includes a **live phone-frame preview** — no install needed:

* Open the app wizard (Create App or edit an existing app). On desktop, the preview panel is pinned on the right; on mobile, tap the **Preview** button in the bottom corner.
* The simulator shows your website inside a phone frame with your configured app name, status-bar color, icon, and bottom navigation — it updates live as you change settings in the wizard.
* Some websites block being embedded (X-Frame-Options); in that case the preview shows the app chrome with a placeholder instead of the page — your real app is NOT affected by this, it always loads your site.
* This is a preview of the app shell before building. To test the real thing, build the free APK and install it on a device.

## iOS support

iOS is **not available yet**. Reasons: Apple requires each publisher to have their own Apple Developer account ($99/year), and Apple's App Store review (guideline 4.2) rejects simple website-wrapper apps, so an iOS product needs a richer native shell. An **iOS waitlist** is available in the app wizard — joining it helps us prioritize. Alternatives today: your website can be installed as a PWA on iPhone (Share → Add to Home Screen), and Android + Desktop apps are fully supported.
