package com.webtoapp.template;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;

import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

/**
 * Diagnostic build (vc16-diag): verbose logcat logging so we can identify
 * WHY sign-in fails after the first successful login. The failure happens
 * identically across three different engine implementations — the issue is
 * in app lifecycle, device state, or something outside the auth code path.
 *
 * Collect logs via:
 *   adb logcat -s "WSignIn" -s "JSBridge" -s "WebViewActivity" -d > gsi_log.txt
 *
 * Send gsi_log.txt back — it will show: launch mode, intent extras, onNewIntent
 * calls, Credential Manager callback result/error class, Play Services status,
 * any ApiException code, and the raw error detail.
 */
public class GoogleSignInActivity extends Activity {

    private static final int RC_SIGN_IN = 9301;
    private static final String LOG_TAG = "WSignIn";

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
        log("=== onCreate start ===");
        log("launchVia=" + detectLaunchPath());

        // Leading hypothesis: a singleTask launchMode causes onNewIntent to be
        // called (instead of onCreate) on subsequent app launches. This means
        // the sign-in bridge callback (pendingCallback) is stale and never set,
        // so the web page never receives the result. The onNewIntent override
        // below logs this event so we can confirm or rule it out.
        log("onNewIntent called on relaunch?");

        int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        if (resId == 0) {
            log("FATAL: default_web_client_id missing - Firebase not configured");
            deliver("", "google_signin_not_available");
            finish();
            return;
        }
        webClientId = getString(resId);
        log("webClientId=" + webClientId);

        try {
            GoogleApiAvailability api = GoogleApiAvailability.getInstance();
            int result = api.isGooglePlayServicesAvailable(this);
            String rStr = "UNKNOWN(" + result + ")";
            if (result == ConnectionResult.SUCCESS) rStr = "SUCCESS";
            else if (result == ConnectionResult.SERVICE_MISSING) rStr = "SERVICE_MISSING";
            else if (result == ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED) rStr = "UPDATE_REQUIRED";
            else if (result == ConnectionResult.SERVICE_DISABLED) rStr = "SERVICE_DISABLED";
            else if (result == ConnectionResult.SIGN_IN_REQUIRED) rStr = "SIGN_IN_REQUIRED";
            else if (result == ConnectionResult.INVALID_ACCOUNT) rStr = "INVALID_ACCOUNT";
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
            return new JSONObject()
                    .put("from", getCallingActivity() != null ? "startActivityForResult" : "startActivity")
                    .toString();
        } catch (Exception e) { return "unknown"; }
    }

    private void log(String msg) {
        Log.i(LOG_TAG, msg);
        android.util.Log.println(Log.INFO, LOG_TAG, msg);
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

    // ---- Credential Manager flow (primary) ----

    private void credentialManagerFlow() {
        CredentialManager cm = CredentialManager.create(this);
        log("CredentialManager created, building request for clientId=" + webClientId);
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build();
        log("Submitting getCredentialAsync");
        cm.getCredentialAsync(this, request, null, ContextCompat.getMainExecutor(this),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        log("CM onResult SUCCESS");
                        try {
                            Credential cred = response.getCredential();
                            log("credential type=" + cred.getType());
                            if (cred instanceof CustomCredential
                                    && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cred.getType())) {
                                GoogleIdTokenCredential gid =
                                        GoogleIdTokenCredential.createFrom(((CustomCredential) cred).getData());
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
                    public void onError(GetCredentialException e) {
                        log("CM onError: class=" + e.getClass().getName()
                                + " msg=" + e.getMessage());
                        if (e instanceof GetCredentialCancellationException) {
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
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();
            log("GSO built, getting GoogleSignInClient");
            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            log("Current account=" + GoogleSignIn.getLastSignedInAccount(this));

            // Revoke to avoid the re-grant path that produces DEVELOPER_ERROR(10).
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
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            log("Calling task.getResult(ApiException.class)");
            GoogleSignInAccount account = task.getResult(ApiException.class);
            log("Account: email=" + (account != null ? account.getEmail() : "null")
                    + " idToken_len=" + (account != null && account.getIdToken() != null
                    ? account.getIdToken().length() : 0));
            deliver(account != null && account.getIdToken() != null ? account.getIdToken() : "", "");
        } catch (ApiException e) {
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
