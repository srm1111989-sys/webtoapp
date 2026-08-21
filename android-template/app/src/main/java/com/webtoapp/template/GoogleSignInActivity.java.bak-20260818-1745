package com.webtoapp.template;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
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

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

public class GoogleSignInActivity extends Activity {

    private static final String TAG = "GoogleSignIn";
    private static final int RC_SIGN_IN = 9301;

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
    private boolean cmAttempted = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "[GSI-DEBUG] onCreate ENTRY, isFinishing=" + isFinishing());
        int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        Log.d(TAG, "[GSI-DEBUG] default_web_client_id resId=" + resId + " pkg=" + getPackageName());
        if (resId == 0) {
            Log.w(TAG, "[GSI-DEBUG] default_web_client_id missing — google-services.json not merged correctly");
            deliver("", "google_signin_not_available");
            finish();
            return;
        }
        webClientId = getString(resId);
        Log.d(TAG, "[GSI-DEBUG] webClientId loaded (length=" + webClientId.length() + ")");
        cmAttempted = false;
        Log.d(TAG, "[GSI-DEBUG] Calling credentialManagerFlow()");
        credentialManagerFlow();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    private void credentialManagerFlow() {
        cmAttempted = true;
        Log.d(TAG, "[GSI-DEBUG] CredentialManagerFlow START, webClientId prefix=" + webClientId.substring(0, Math.min(30, webClientId.length())) + "...");
        CredentialManager cm = CredentialManager.create(this);
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(webClientId).build();
        Log.d(TAG, "[GSI-DEBUG] GetSignInWithGoogleOption created");
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build();
        Log.d(TAG, "[GSI-DEBUG] GetCredentialRequest built, calling getCredentialAsync...");
        cm.getCredentialAsync(this, request, null, ContextCompat.getMainExecutor(this),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        Log.d(TAG, "[GSI-DEBUG] CM onResult CALLED");
                        try {
                            Credential cred = response.getCredential();
                            if (cred instanceof CustomCredential
                                    && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cred.getType())) {
                                GoogleIdTokenCredential gid = GoogleIdTokenCredential.createFrom(((CustomCredential) cred).getData());
                                String idToken = gid.getIdToken();
                                Log.d(TAG, "[GSI-DEBUG] CM success, idToken length=" + (idToken != null ? idToken.length() : "null"));
                                if (idToken != null && !idToken.isEmpty()) {
                                    deliver(idToken, "");
                                    finish();
                                } else {
                                    Log.w(TAG, "[GSI-DEBUG] Empty idToken from CM — falling back to legacy");
                                    legacyFlow();
                                }
                            } else {
                                Log.w(TAG, "[GSI-DEBUG] Unexpected credential type: " + cred.getType() + " — falling back to legacy");
                                legacyFlow();
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[GSI-DEBUG] Credential parse failed, falling back to legacy", e);
                            legacyFlow();
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        Log.w(TAG, "[GSI-DEBUG] CM onError: " + e.getClass().getSimpleName() + " — msg=" + e.getMessage());
                        legacyFlow();
                    }
                });
    }

    private void legacyFlow() {
        try {
            Log.d(TAG, "[GSI-DEBUG] legacyFlow ENTRY, isFinishing=" + isFinishing());
            if (isFinishing()) {
                Log.w(TAG, "[GSI-DEBUG] legacyFlow SKIPPED — activity is finishing");
                return;
            }
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();
            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            Log.d(TAG, "[GSI-DEBUG] GoogleSignInClient created, calling revokeAccess...");
            client.revokeAccess().continueWith(task -> {
                boolean success = task.isSuccessful();
                Exception ex = task.getException();
                Log.d(TAG, "[GSI-DEBUG] revokeAccess done, isSuccessful=" + success + (ex != null ? ", ex=" + ex : ""));
                if (!success && ex != null) {
                    Log.w(TAG, "[GSI-DEBUG] revokeAccess failed, continuing anyway", ex);
                }
                if (isFinishing()) {
                    Log.w(TAG, "[GSI-DEBUG] SKIPPED startActivityForResult — activity is finishing!");
                    return null;
                }
                Log.d(TAG, "[GSI-DEBUG] Starting sign-in intent, RC=" + RC_SIGN_IN);
                startActivityForResult(client.getSignInIntent(), RC_SIGN_IN);
                return null;
            });
        } catch (Exception e) {
            Log.e(TAG, "[GSI-DEBUG] Google sign-in init failed", e);
            deliver("", "google_signin_init_failed");
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Log.d(TAG, "[GSI-DEBUG] onActivityResult ENTRY, requestCode=" + requestCode + " resultCode=" + resultCode + " data=" + (data != null ? "NOT_NULL" : "NULL"));
        if (requestCode != RC_SIGN_IN) return;
        if (data == null) {
            Log.w(TAG, "[GSI-DEBUG] null result intent");
            deliver("", "null_result_intent");
            finish();
            return;
        }
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        Log.d(TAG, "[GSI-DEBUG] getSignedInAccountFromIntent done, task.isSuccessful=" + task.isSuccessful());
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account != null ? account.getIdToken() : null;
            Log.d(TAG, "[GSI-DEBUG] account=" + (account != null ? "YES" : "NULL") + " idToken length=" + (idToken != null ? idToken.length() : "null"));
            if (idToken != null && !idToken.isEmpty()) {
                deliver(idToken, "");
            } else {
                deliver("", "no_id_token");
            }
        } catch (ApiException e) {
            String err = (e.getStatusCode() == 12501) ? "cancelled" : ("signin_failed_" + e.getStatusCode());
            Log.w(TAG, "[GSI-DEBUG] Google sign-in result: " + err + " (statusCode=" + e.getStatusCode() + ")");
            deliver("", err);
        } catch (Exception e) {
            Log.e(TAG, "[GSI-DEBUG] onActivityResult exception", e);
            deliver("", "on_activity_result_exception");
        }
        finish();
    }
}
