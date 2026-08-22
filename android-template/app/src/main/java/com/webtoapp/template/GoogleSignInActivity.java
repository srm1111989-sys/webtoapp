package com.webtoapp.template;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Bundle;
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
import androidx.credentials.exceptions.NoCredentialException;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Deterministic Native Google Sign-In Activity.
 * 
 * Flow:
 * 1. Resolves Web Client ID (from config.json features.native_google_signin.web_client_id or R.string.default_web_client_id).
 * 2. Uses AndroidX Credential Manager with GetSignInWithGoogleOption(webClientId).
 * 3. Fallback to GoogleSignInClient if Credential Manager fails with a non-cancellation error.
 * 4. Delivers token or explicit error to JavaScript callback and safely finishes activity.
 */
public class GoogleSignInActivity extends Activity {

    private static final String TAG = "WebToApp_GoogleSignIn";
    private static final int RC_SIGN_IN = 9301;

    public interface Callback {
        void onResult(String idToken, String error);
    }

    private static Callback pendingCallback;

    public static void setCallback(Callback cb) {
        pendingCallback = cb;
    }

    private static void deliver(String idToken, String error) {
        Callback cb = pendingCallback;
        pendingCallback = null;
        if (cb != null) {
            cb.onResult(idToken == null ? "" : idToken, error == null ? "" : error);
        }
    }

    private String webClientId;
    private boolean callbackDelivered = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        logDiagnostics();

        webClientId = resolveWebClientId();
        if (webClientId == null || webClientId.trim().isEmpty()) {
            Log.e(TAG, "Web Client ID could not be resolved from config.json or google-services.json");
            finishWithError("web_client_id_missing");
            return;
        }

        Log.i(TAG, "Starting Credential Manager request with serverClientId suffix: ..." + 
                webClientId.substring(Math.max(0, webClientId.length() - 12)));

        startCredentialManagerFlow();
    }

    private void startCredentialManagerFlow() {
        try {
            CredentialManager cm = CredentialManager.create(this);
            GetSignInWithGoogleOption googleIdOption = new GetSignInWithGoogleOption.Builder(webClientId)
                    .build();

            GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build();

            cm.getCredentialAsync(
                    this,
                    request,
                    null,
                    ContextCompat.getMainExecutor(this),
                    new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                        @Override
                        public void onResult(GetCredentialResponse response) {
                            handleCredentialResponse(response);
                        }

                        @Override
                        public void onError(GetCredentialException e) {
                            handleCredentialError(e);
                        }
                    }
            );
        } catch (Exception ex) {
            Log.w(TAG, "Credential Manager initialization failed, attempting fallback: " + ex.getMessage());
            startLegacyFlow();
        }
    }

    private void handleCredentialResponse(GetCredentialResponse response) {
        try {
            Credential credential = response.getCredential();
            if (credential instanceof CustomCredential &&
                    GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                GoogleIdTokenCredential googleIdTokenCredential =
                        GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                String idToken = googleIdTokenCredential.getIdToken();
                if (idToken != null && !idToken.isEmpty()) {
                    Log.i(TAG, "Credential Manager successfully obtained ID Token (length: " + idToken.length() + ")");
                    finishWithToken(idToken);
                    return;
                }
            }
            Log.w(TAG, "Unexpected credential response format, attempting fallback: " + credential.getType());
            startLegacyFlow();
        } catch (Exception ex) {
            Log.e(TAG, "Failed parsing credential response: " + ex.getMessage(), ex);
            startLegacyFlow();
        }
    }

    private void handleCredentialError(GetCredentialException e) {
        if (e instanceof GetCredentialCancellationException) {
            Log.i(TAG, "Google Sign-In cancelled by user");
            finishWithError("google_signin_cancelled");
            return;
        }

        Log.w(TAG, "Credential Manager error: " + e.getClass().getSimpleName() + " - " + e.getMessage() + ". Attempting legacy fallback.");
        startLegacyFlow();
    }

    private void startLegacyFlow() {
        if (isFinishing() || isDestroyed()) return;
        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();

            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            client.signOut().addOnCompleteListener(task -> {
                if (isFinishing() || isDestroyed()) return;
                try {
                    startActivityForResult(client.getSignInIntent(), RC_SIGN_IN);
                } catch (Exception e) {
                    Log.e(TAG, "startActivityForResult failed for legacy GoogleSignInClient", e);
                    finishWithError("google_signin_intent_failed");
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Legacy GoogleSignInClient init failed: " + e.getMessage(), e);
            finishWithError("google_signin_failed: " + e.getMessage());
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != RC_SIGN_IN) return;

        if (data == null) {
            finishWithError("null_result_intent");
            return;
        }

        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account != null ? account.getIdToken() : null;
            if (idToken != null && !idToken.isEmpty()) {
                Log.i(TAG, "Legacy GoogleSignIn successfully obtained ID Token (length: " + idToken.length() + ")");
                finishWithToken(idToken);
            } else {
                finishWithError("google_id_token_missing");
            }
        } catch (ApiException e) {
            int code = e.getStatusCode();
            Log.w(TAG, "Google Sign-In ApiException: code=" + code + " (" + GoogleSignInStatusCodes(code) + ")");
            if (code == 12501 || code == 12502) {
                finishWithError("google_signin_cancelled");
            } else if (code == 10) {
                // DEVELOPER_ERROR (10) occurs when the Android OAuth Client ID (SHA-1) is missing in Firebase / Google Cloud
                finishWithError("play_services_developer_error_10_missing_sha1");
            } else {
                finishWithError("google_signin_failed_code_" + code);
            }
        } catch (Exception e) {
            Log.e(TAG, "Unexpected error in onActivityResult", e);
            finishWithError("google_signin_exception: " + e.getMessage());
        }
    }

    private void finishWithToken(String idToken) {
        if (callbackDelivered) return;
        callbackDelivered = true;
        deliver(idToken, "");
        finish();
    }

    private void finishWithError(String error) {
        if (callbackDelivered) return;
        callbackDelivered = true;
        deliver("", error);
        finish();
    }

    private String resolveWebClientId() {
        // 1. Check config.json features.native_google_signin.web_client_id
        try (InputStream is = getAssets().open("config.json")) {
            byte[] buf = new byte[is.available()];
            int len = is.read(buf);
            String jsonStr = new String(buf, 0, len, StandardCharsets.UTF_8);
            org.json.JSONObject config = new org.json.JSONObject(jsonStr);
            org.json.JSONObject features = config.optJSONObject("features");
            if (features != null) {
                org.json.JSONObject ngs = features.optJSONObject("native_google_signin");
                if (ngs != null) {
                    String cid = ngs.optString("web_client_id", "");
                    if (!cid.isEmpty()) return cid;
                }
                String directCid = features.optString("google_web_client_id", "");
                if (!directCid.isEmpty()) return directCid;
            }
        } catch (Exception ignored) {}

        // 2. Fallback to generated default_web_client_id from google-services.json
        try {
            int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
            if (resId != 0) {
                return getString(resId);
            }
        } catch (Exception ignored) {}

        return null;
    }

    private void logDiagnostics() {
        try {
            String pkg = getPackageName();
            PackageInfo pInfo = getPackageManager().getPackageInfo(pkg, PackageManager.GET_SIGNATURES);
            String sha1 = getSignatureSha1(pInfo);
            String installer = getPackageManager().getInstallerPackageName(pkg);
            Log.i(TAG, "Diagnostics: pkg=" + pkg + " versionCode=" + pInfo.versionCode + 
                    " installer=" + installer + " signingSha1=" + sha1);
        } catch (Exception e) {
            Log.w(TAG, "Diagnostics logging failed: " + e.getMessage());
        }
    }

    private String getSignatureSha1(PackageInfo pInfo) {
        try {
            if (pInfo.signatures != null && pInfo.signatures.length > 0) {
                MessageDigest md = MessageDigest.getInstance("SHA-1");
                byte[] digest = md.digest(pInfo.signatures[0].toByteArray());
                StringBuilder sb = new StringBuilder();
                for (byte b : digest) {
                    sb.append(String.format("%02X:", b));
                }
                if (sb.length() > 0) sb.setLength(sb.length() - 1);
                return sb.toString();
            }
        } catch (Exception ignored) {}
        return "UNKNOWN";
    }

    private String GoogleSignInStatusCodes(int code) {
        switch (code) {
            case 10: return "DEVELOPER_ERROR (Check Firebase Android Client SHA-1 / Package Name match)";
            case 12500: return "SIGN_IN_FAILED";
            case 12501: return "SIGN_IN_CANCELLED";
            case 12502: return "SIGN_IN_CURRENTLY_IN_PROGRESS";
            default: return "STATUS_CODE_" + code;
        }
    }
}
