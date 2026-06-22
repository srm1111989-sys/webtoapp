# WebToApp Platform Guide

WebToApp (websitetoapp.app) converts any website URL into a native Android app (.apk / .aab) or a Windows desktop app (.exe installer). No coding required.

---

## Pricing Plans & Limits

| Plan | Price | Builds |
|------|-------|--------|
| Free (Android or Desktop) | $0 | 2 builds total, watermarked splash |
| Premium Android App | $25 one-time | 5 rebuilds / 30 rolling days |
| Premium Desktop App | $25 one-time | 5 rebuilds / 30 rolling days |
| Play Store Listing Add-on | $15 one-time | We publish your app to Google Play |
| Android App + Play Store Bundle | $40 one-time | Premium Android + Play Store listing |

* All paid plans are **one-time payments** — no subscriptions, no renewals, no hidden charges.
* Indian users pay in INR (₹2075 for $25 equivalent plans).
* Promo/discount codes can be applied at checkout.

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

After payment the build is triggered automatically. Users receive a download link when ready.

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

* **Free plan**: 2 builds total (lifetime).
* **Paid plans**: 5 rebuilds per 30 rolling days per order.
* Each rebuild lets you update your app URL, icon, or settings and get a new signed APK/AAB.
* The 30-day rolling window resets from the date of each build, not from purchase date.

---

## Support & Contact

* **Email**: support@websitetoapp.app
* **WhatsApp**: Available for paid plan users
* **Refund policy**: Case-by-case. Contact support within 7 days of purchase.
* For billing issues, order status, or technical problems — email support@websitetoapp.app with your order number.
