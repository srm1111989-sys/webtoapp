# Investigation & Resolution Report: Academic Fresh (Ali) — Google Sign-In Architecture

**Customer:** Ali (`lovasecond931@gmail.com`)  
**App Name:** Academic fresh  
**Package Name:** `a.academic.fresh`  
**App ID:** `570a2708-5947-4ff8-b1f0-09136f060416`  
**Order ID:** `cb69709c-4199-42cf-be2f-45d2c942db36`  
**Website URL:** `https://edumobile.ai.studio`  
**Service Account Email:** `swap-saas@decent-era-490019-b6.iam.gserviceaccount.com`

---

## 1. Problem Statement

Google Sign-In worked when installing the generated **APK directly**, but failed with errors when the same app was uploaded as an **AAB to Google Play Console** and installed from the Play Store / Alpha track.

### Observed Symptoms:
* `no_android_oauth_client`
* `Firebase: Error (auth/invalid-credential). Code: NO_CODE`
* `No matching Android auth client found`
* `Error 400: disallowed_useragent` / `400 cannot process request` (during Web OAuth fallback experiments)

---

## 2. Root Cause Analysis

```text
ROOT CAUSE:
1. Play App Signing replaces the local upload keystore certificate with Google's production signing certificate:
   SHA-1: A4:06:BE:84:BF:63:7E:00:41:22:BE:08:1E:7D:D1:CD:2F:3C:DF:99
2. For native Google Sign-In to issue an ID token via Google Play Services / Credential Manager, Google Cloud / Firebase MUST have an Android OAuth client corresponding to:
   Package: a.academic.fresh
   SHA-1:   A4:06:BE:84:BF:63:7E:00:41:22:BE:08:1E:7D:D1:CD:2F:3C:DF:99
3. In code, GoogleSignInActivity previously had custom string-parsing of google-services.json searching for matching client_type: 1 entries. When running a Play-signed build whose SHA-1 was not in the older bundled google-services.json, it threw an artificial "no_android_oauth_client" error back to JavaScript before even asking Google Play Services.
4. When native Google Sign-In was disabled as a workaround, WebViewActivity attempted in-app Web OAuth redirects which failed with Error 400 because edumobile.ai.studio was neither registered as an authorized domain in Firebase nor supported standard OAuth inside WebView.

WHY APK WORKS:
Direct local/CI APK is signed by the upload keystore (or debug key). If that upload SHA-1 is registered in Firebase or matched in google-services.json, the native SDK / parser finds it and Google Play Services verifies the certificate.

WHY PLAY AAB FAILS:
When installed from the Play Store, the APK has Google's Play App Signing certificate (A4:06:BE:84:BF:63:7E:00:41:22:BE:08:1E:7D:D1:CD:2F:3C:DF:99). Because this SHA-1 is missing from the customer's Firebase/Google Cloud Android Client IDs:
1. Google Play Services refuses to issue the ID token for serverClientId (DEVELOPER_ERROR 10 / No matching Android client).
2. The legacy code's manual JSON parser rejected the cert before calling the SDK.
```

---

## 3. Native Architecture Flow

The desired and implemented architecture keeps the native Google Sign-In flow intact without relying on WebView Web OAuth hacks:

```
Website (Auth.tsx)
   │
   ▼
window.WebToApp.googleSignIn(callback)
   │
   ▼
JavaScriptBridge.java
   │
   ▼
GoogleSignInActivity.java (Invisible Activity)
   │
   ├── CredentialManager (GetSignInWithGoogleOption with serverClientId = WEB_CLIENT_ID)
   │     │
   │     ▼
   │   Native Google Account Chooser UI
   │     │
   │     ▼
   │   GoogleIdTokenCredential -> Returns Google ID Token
   │
   └── Fallback: GoogleSignInClient (play-services-auth)
         │
         ▼
       Asynchronous callback delivered to window.WebToApp.googleSignIn
         │
         ▼
Firebase Web SDK on Website:
const cred = GoogleAuthProvider.credential(idToken);
await signInWithCredential(auth, cred);
   │
   ▼
✅ User Successfully Logged In
```

---

## 4. Code Changes Made

1. **`GoogleSignInActivity.java` (Rewritten):**
   * Migrated to **AndroidX Credential Manager** using `GetSignInWithGoogleOption` with the `web_client_id` (`default_web_client_id`).
   * Removed manual string parsing of `google-services.json` and client-side SHA-1 validation.
   * Fixed activity lifecycle: `finish()` is only called *after* token delivery or user cancellation.
   * Added structured diagnostic logging and descriptive error strings (`play_services_developer_error_10_missing_sha1`, `google_signin_cancelled`, `web_client_id_missing`).

2. **`proguard-rules.pro`:**
   * Added `-keep` rules for `androidx.credentials.**` and `com.google.android.libraries.identity.googleid.**` to prevent release-mode R8 stripping.

3. **`WebViewActivity.java`:**
   * Reverted experimental User-Agent regex tampering (`Version/4.0`, `; wv`).
   * Removed the temporary safe wrapper bypass so all calls route directly to native `GoogleSignInActivity`.

---

## 5. One-Time External Configuration Required

To allow Google Play Services to authorize the Play Store build:

### Option A: Via Firebase Console (Customer)
1. Go to **[Firebase Console](https://console.firebase.google.com/)** -> **Project Settings** -> **General**.
2. Scroll to **Your apps** -> Select Android app (`a.academic.fresh`).
3. Click **Add fingerprint** and enter:
   ```text
   A4:06:BE:84:BF:63:7E:00:41:22:BE:08:1E:7D:D1:CD:2F:3C:DF:99
   ```
4. Also ensure the upload key SHA-1 is present:
   ```text
   1C:59:A6:17:EB:70:60:8E:F3:0D:36:6D:A4:82:BE:3C:B9:BD:D0:B8
   ```

### Option B: Via Service Account (Automated)
Once Ali adds `swap-saas@decent-era-490019-b6.iam.gserviceaccount.com` as an **Editor** in Firebase Console (`Project Settings -> Users and permissions`), the SHA-1 fingerprints can be registered directly via API.

---

## 6. Verification Status

* **Local Release Build (`assembleRelease`):** Compiled successfully in 1m 57s with full ProGuard/R8 optimizations and dex merging.
* **Direct APK Testing:** Native Credential Manager triggers the Google account chooser and returns the ID token cleanly.
* **Play Store AAB:** Will succeed as soon as the Play App Signing SHA-1 fingerprint is added to the Firebase project.
