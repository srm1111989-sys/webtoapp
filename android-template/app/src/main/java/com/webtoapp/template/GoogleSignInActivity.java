package com.webtoapp.template;

import android.app.Activity;
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
        int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        if (resId == 0) {
            Log.w(TAG, "default_web_client_id missing");
            deliver("", "google_signin_not_available");
            finish();
            return;
        }
        webClientId = getString(resId);
        cmAttempted = false;
        credentialManagerFlow();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    private void credentialManagerFlow() {
        cmAttempted = true;
        CredentialManager cm = CredentialManager.create(this);
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(webClientId).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(option)
                .build();
        cm.getCredentialAsync(this, request, null, ContextCompat.getMainExecutor(this),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        try {
                            Credential cred = response.getCredential();
                            if (cred instanceof CustomCredential
                                    && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(cred.getType())) {
                                GoogleIdTokenCredential gid = GoogleIdTokenCredential.createFrom(((CustomCredential) cred).getData());
                                String idToken = gid.getIdToken();
                                if (idToken != null && !idToken.isEmpty()) {
                                    deliver(idToken, "");
                                    finish();
                                } else {
                                    Log.w(TAG, "Empty idToken from CM — falling back to legacy");
                                    legacyFlow();
                                    // finish() will be called in onActivityResult
                                }
                            } else {
                                Log.w(TAG, "Unexpected credential type: " + cred.getType() + " — falling back to legacy");
                                legacyFlow();
                                // finish() will be called in onActivityResult
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Credential parse failed, falling back to legacy", e);
                            legacyFlow();
                            // finish() will be called in onActivityResult
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        Log.w(TAG, "CM error: " + e.getClass().getSimpleName() + " — " + e.getMessage());
                        // CM failed — always fall back to legacy GoogleSignIn flow.
                        // This handles devices where CM's account picker returns
                        // GetCredentialCancellationException even after the user
                        // selected an account (known issue on some Android/Play
                        // Services versions where the CM UI shows but the result
                        // is delivered as a cancellation instead of onResult).
                        legacyFlow();
                    }
                });
    }

    private void legacyFlow() {
        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();
            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            client.revokeAccess().continueWith(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "revokeAccess failed, continuing", task.getException());
                }
                startActivityForResult(client.getSignInIntent(), RC_SIGN_IN);
                return null;
            });
        } catch (Exception e) {
            Log.e(TAG, "Google sign-in init failed", e);
            deliver("", "google_signin_init_failed");
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != RC_SIGN_IN) return;
        if (data == null) {
            deliver("", "null_result_intent");
            finish();
            return;
        }
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account != null ? account.getIdToken() : null;
            if (idToken != null && !idToken.isEmpty()) {
                deliver(idToken, "");
            } else {
                deliver("", "no_id_token");
            }
        } catch (ApiException e) {
            String err = (e.getStatusCode() == 12501) ? "cancelled" : ("signin_failed_" + e.getStatusCode());
            Log.w(TAG, "Google sign-in result: " + err);
            deliver("", err);
        } catch (Exception e) {
            Log.e(TAG, "onActivityResult exception", e);
            deliver("", "on_activity_result_exception");
        }
        finish();
    }
}
