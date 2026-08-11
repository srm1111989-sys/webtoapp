package com.webtoapp.template;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Diagnostic build v16-diag-export: file-based log capture + on-device share.
 *
 * Wraps every log() call to also append to a file in external cache. Ali can
 * export and share the file directly from the app — no PC / adb required.
 *
 * File location: /Android/data/<package>/cache/gsi_log.txt
 * Share target: any app (Gmail, WhatsApp, etc.)
 */
public class GoogleSignInActivity extends Activity {

    private static final int RC_SIGN_IN = 9301;
    private static final String LOG_TAG = "WSignIn";
    private static final String LOG_FILE = "gsi_log.txt";
    private static final int MAX_LOG_BYTES = 512 * 1024; // 512 KB ring buffer

    private static final Object FILE_LOCK = new Object();
    private static volatile File logFile;
    private static volatile boolean fileErrorLogged = false;

    public interface Callback {
        void onResult(String idToken, String error);
    }

    private static Callback pendingCallback;
    public static void setCallback(Callback cb) { pendingCallback = cb; }

    private static void deliver(String idToken, String error) {
        Callback cb = pendingCallback;
        pendingCallback = null;
        if (cb != null) cb.onResult(idToken, error);
    }

    private String webClientId;
    private String launchId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        launchId = String.valueOf(SystemClock.uptimeMillis());
        logFile = new File(getExternalCacheDir(), LOG_FILE);
        log("=== onCreate start ===");
        log("launchVia=" + detectLaunchPath());
        log("onNewIntent called on relaunch?");

        int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        if (resId == 0) {
            log("FATAL: default_web_client_id missing - Firebase not configured");
            deliver("", "google_signin_not_available");
            Toast.makeText(this, "Sign-in not configured", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }
        webClientId = getString(resId);
        log("webClientId=" + webClientId);

        try {
            com.google.android.gms.common.GoogleApiAvailability api = com.google.android.gms.common.GoogleApiAvailability.getInstance();
            int result = api.isGooglePlayServicesAvailable(this);
            String rStr = "UNKNOWN(" + result + ")";
            if (result == com.google.android.gms.common.ConnectionResult.SUCCESS) rStr = "SUCCESS";
            else if (result == com.google.android.gms.common.ConnectionResult.SERVICE_MISSING) rStr = "SERVICE_MISSING";
            else if (result == com.google.android.gms.common.ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED) rStr = "UPDATE_REQUIRED";
            else if (result == com.google.android.gms.common.ConnectionResult.SERVICE_DISABLED) rStr = "SERVICE_DISABLED";
            else if (result == com.google.android.gms.common.ConnectionResult.SIGN_IN_REQUIRED) rStr = "SIGN_IN_REQUIRED";
            else if (result == com.google.android.gms.common.ConnectionResult.INVALID_ACCOUNT) rStr = "INVALID_ACCOUNT";
            log("PlayServices availability=" + rStr);
        } catch (Throwable t) {
            log("PlayServices check threw: " + t);
        }

        log("Calling credentialManagerFlow");
        try {
            credentialManagerFlow();
        } catch (Throwable t) {
            log("CM threw immediately, falling back to legacy: " + t);
            legacyFlow();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        log("=== onNewIntent CALLED - onCreate is NOT called on re-launch ===");
        log("action=" + (intent != null ? intent.getAction() : "null"));
        log("flags=0x" + (intent != null ? Integer.toHexString(intent.getFlags()) : "0"));
        log("If this is the second sign-in attempt, the bridge callback (pendingCallback)"
                + " from the FIRST sign-in is stale and will never be restored.");
        log("onNewIntent done (no setIntent called)");
    }

    @Override
    protected void onResume() {
        super.onResume();
        log("onResume pendingCallback=" + (pendingCallback != null));
    }

    @Override
    protected void onDestroy() {
        log("onDestroy isFinishing=" + isFinishing());
        super.onDestroy();
    }

    private String detectLaunchPath() {
        try {
            return new org.json.JSONObject()
                    .put("from", getCallingActivity() != null ? "startActivityForResult" : "startActivity")
                    .toString();
        } catch (Exception e) { return "unknown"; }
    }

    // ---- Logging: logcat + file (thread-safe ring buffer) ----

    private void log(String msg) {
        Log.i(LOG_TAG, msg);
        android.util.Log.println(Log.INFO, LOG_TAG, msg);
        appendToFile(msg);
    }

    private void logError(String msg, Throwable t) {
        log("ERROR: " + msg + " ex=" + t.getClass().getName()
                + " msg=" + t.getMessage());
        if (t.getCause() != null) {
            log("  cause=" + t.getCause().getClass().getName()
                    + " msg=" + t.getCause().getMessage());
        }
        StackTraceElement[] st = t.getStackTrace();
        int start = Math.max(0, st.length - 6);
        for (int i = start; i < st.length; i++) {
            log("    at " + st[i].getClassName() + "." + st[i].getMethodName()
                    + "(" + st[i].getFileName() + ":" + st[i].getLineNumber() + ")");
        }
    }

    private void appendToFile(String msg) {
        synchronized (FILE_LOCK) {
            try {
                if (logFile == null) logFile = new File(getExternalCacheDir(), LOG_FILE);
                if (logFile.length() > MAX_LOG_BYTES) {
                    // Trim: keep last ~80 %
                    java.io.File oldFile = new java.io.File(getExternalCacheDir(),
                            "gsi_old_" + System.currentTimeMillis() + ".txt");
                    java.io.FileInputStream fis = new java.io.FileInputStream(logFile);
                    java.io.FileOutputStream fos = new java.io.FileOutputStream(oldFile);
                    byte[] buf = new byte[8192];
                    int read; StringBuilder sb = new StringBuilder();
                    while ((read = fis.read(buf)) != -1) sb.append(new String(buf, 0, read));
                    String all = sb.toString();
                    String trimmed = all.substring(Math.min(all.length(),
                            (int)(all.length() * 0.2)), all.length());
                    fos.write(trimmed.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    fos.close(); fis.close();
                    BufferedWriter bw = new BufferedWriter(new FileWriter(logFile, false));
                    try { bw.write(trimmed); } finally { bw.close(); }
                }
                BufferedWriter bw = new BufferedWriter(new FileWriter(logFile, true));
                try {
                    bw.write("[" + new SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(new Date()) + "] " + msg);
                    bw.newLine();
                } finally { bw.close(); }
            } catch (Exception e) {
                if (!fileErrorLogged) {
                    Log.e(LOG_TAG, "Cannot write log file: " + e);
                    fileErrorLogged = true;
                }
            }
        }
    }

    /**
     * Export + share the log file. Call from WebViewActivity via JS bridge
     * or any in-app action button.
     */
    public static void exportAndShareLogs(Activity ctx) {
        try {
            File f = ctx.getExternalCacheDir();
            if (f == null) { Toast.makeText(ctx, "Cannot access storage", Toast.LENGTH_SHORT).show(); return; }
            File lf = new File(f, LOG_FILE);
            if (!lf.exists() || lf.length() == 0) {
                Toast.makeText(ctx, "No logs captured yet. Try signing in first.", Toast.LENGTH_SHORT).show();
                return;
            }
            Uri uri = FileProvider.getUriForFile(ctx,
                    ctx.getPackageName() + ".fileprovider", lf);
            String ts = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("text/plain");
            share.putExtra(Intent.EXTRA_SUBJECT, "gsi_log_" + ts + ".txt");
            share.putExtra(Intent.EXTRA_TEXT,
                    "Google Sign-In diagnostic log exported from app.\n" +
                    "Please reply to support@websitetoapp.app with this file attached.");
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            ctx.startActivity(Intent.createChooser(share,
                    "Share gsi_log.txt (send to support@websitetoapp.app)"));
        } catch (Exception e) {
            Toast.makeText(ctx, "Export failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
            Log.e(LOG_TAG, "exportLogs failed", e);
        }
    }

    // ---- Credential Manager flow (primary) ----

    private void credentialManagerFlow() {
        androidx.credentials.CredentialManager cm = androidx.credentials.CredentialManager.create(this);
        log("CredentialManager created, building request for clientId=" + webClientId);
        androidx.credentials.GetSignInWithGoogleOption option =
                new androidx.credentials.GetSignInWithGoogleOption.Builder(webClientId).build();
        androidx.credentials.GetCredentialRequest request = new androidx.credentials.GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build();
        log("Submitting getCredentialAsync");
        cm.getCredentialAsync(this, request, null, androidx.core.content.ContextCompat.getMainExecutor(this),
                new androidx.credentials.CredentialManagerCallback<androidx.credentials.GetCredentialResponse, androidx.credentials.exceptions.GetCredentialException>() {
                    @Override
                    public void onResult(androidx.credentials.GetCredentialResponse response) {
                        log("CM onResult SUCCESS");
                        try {
                            androidx.credentials.Credential cred = response.getCredential();
                            log("credential type=" + cred.getType());
                            if (cred instanceof androidx.credentials.CustomCredential
                                    && com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cred.getType())) {
                                com.google.android.libraries.identity.googleid.GoogleIdTokenCredential gid =
                                        com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.createFrom(((androidx.credentials.CustomCredential) cred).getData());
                                String idToken = gid.getIdToken();
                                log("idToken length=" + (idToken != null ? idToken.length() : 0)
                                        + " empty=" + (idToken == null || idToken.isEmpty()));
                                deliver(idToken, "");
                            } else {
                                log("WARN: unexpected credential type: " + cred.getType());
                                deliver("", "unexpected_credential_type");
                            }
                        } catch (Exception e) {
                            logError("Credential parse failed", e);
                            deliver("", "credential_parse_failed");
                        }
                        log("Finishing activity (CM success path)");
                        finish();
                    }

                    @Override
                    public void onError(androidx.credentials.exceptions.GetCredentialException e) {
                        log("CM onError: class=" + e.getClass().getName()
                                + " msg=" + e.getMessage());
                        if (e instanceof androidx.credentials.exceptions.GetCredentialCancellationException) {
                            log("CM: user cancelled");
                            deliver("", "cancelled");
                            finish();
                            return;
                        }
                        logError("CM non-cancellation error, falling back to legacy", e);
                        legacyFlow();
                    }
                });
    }

    // ---- Legacy fallback ----

    private void legacyFlow() {
        try {
            com.google.android.gms.auth.api.signin.GoogleSignInOptions gso =
                    new com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(
                            com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN)
                            .requestIdToken(webClientId)
                            .requestEmail()
                            .build();
            log("GSO built, getting GoogleSignInClient");
            com.google.android.gms.auth.api.signin.GoogleSignInClient client =
                    com.google.android.gms.auth.api.signin.GoogleSignIn.getClient(this, gso);
            log("Current account=" + com.google.android.gms.auth.api.signin.GoogleSignIn.getLastSignedInAccount(this));

            log("Calling revokeAccess...");
            client.revokeAccess().addOnCompleteListener(t -> {
                if (t.isSuccessful()) {
                    log("revokeAccess succeeded");
                } else {
                    logError("revokeAccess FAILED - continuing anyway", t.getException());
                }
                log("Starting sign-in intent");
                startActivityForResult(client.getSignInIntent(), RC_SIGN_IN);
            });
        } catch (Exception e) {
            logError("Legacy init failed", e);
            deliver("", "google_signin_init_failed");
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        log("onActivityResult request=" + requestCode + " result=" + resultCode
                + " data=" + (data != null ? "non-null" : "null"));
        if (requestCode != RC_SIGN_IN) {
            log("Ignoring unexpected request code=" + requestCode);
            return;
        }
        if (data == null) {
            log("FATAL: result intent is null - no data to extract account from");
            deliver("", "null_result_intent");
            finish();
            return;
        }
        com.google.android.gms.tasks.Task<com.google.android.gms.auth.api.signin.GoogleSignInAccount> task =
                com.google.android.gms.auth.api.signin.GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            log("Calling task.getResult(ApiException.class)");
            com.google.android.gms.auth.api.signin.GoogleSignInAccount account =
                    task.getResult(com.google.android.gms.common.api.ApiException.class);
            log("Account: email=" + (account != null ? account.getEmail() : "null")
                    + " idToken_len=" + (account != null && account.getIdToken() != null
                    ? account.getIdToken().length() : 0));
            deliver(account != null && account.getIdToken() != null ? account.getIdToken() : "", "");
        } catch (com.google.android.gms.common.api.ApiException e) {
            log("ApiException status=" + e.getStatusCode()
                    + " (" + com.google.android.gms.common.api.CommonStatusCodes.getStatusCodeString(e.getStatusCode()) + ")"
                    + " message=" + e.getMessage());
            String err = (e.getStatusCode() == 12501) ? "cancelled"
                    : ("signin_failed_" + e.getStatusCode());
            deliver("", err);
        } catch (Exception e) {
            logError("Unexpected onActivityResult exception", e);
            deliver("", "on_activity_result_exception");
        }
        log("Finishing activity (result path)");
        finish();
    }
}
