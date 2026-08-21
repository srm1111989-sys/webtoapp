package com.webtoapp.template;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class GoogleSignInActivity extends Activity {

    private static final String TAG = "GoogleSignIn";
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
        if (cb != null) cb.onResult(idToken, error);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "[GSI-DEBUG] onCreate ENTRY");

        int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
        if (resId == 0) {
            Log.w(TAG, "[GSI-DEBUG] default_web_client_id missing in resources");
            deliver("", "google_signin_not_available");
            finish();
            return;
        }

        String webClientId = getString(resId);
        Log.d(TAG, "[GSI-DEBUG] Using webClientId: " + webClientId);

        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();

            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            client.signOut().addOnCompleteListener(task -> {
                Log.d(TAG, "[GSI-DEBUG] Starting Google Sign-In intent chooser");
                startActivityForResult(client.getSignInIntent(), RC_SIGN_IN);
            });
        } catch (Exception e) {
            Log.e(TAG, "[GSI-DEBUG] Failed to initialize GoogleSignInClient", e);
            deliver("", "google_signin_init_failed");
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Log.d(TAG, "[GSI-DEBUG] onActivityResult requestCode=" + requestCode + " resultCode=" + resultCode);

        if (requestCode != RC_SIGN_IN) return;

        if (data == null) {
            Log.w(TAG, "[GSI-DEBUG] Intent data is null");
            deliver("", "null_result_intent");
            finish();
            return;
        }

        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account != null ? account.getIdToken() : null;
            Log.d(TAG, "[GSI-DEBUG] GoogleSignInAccount idToken=" + (idToken != null ? "FOUND" : "NULL"));

            if (idToken != null && !idToken.isEmpty()) {
                deliver(idToken, "");
            } else {
                deliver("", "no_id_token");
            }
        } catch (ApiException e) {
            String err = (e.getStatusCode() == 12501) ? "cancelled" : ("signin_failed_" + e.getStatusCode());
            Log.w(TAG, "[GSI-DEBUG] Google Sign-In failed with code: " + e.getStatusCode() + " (" + err + ")");
            deliver("", err);
        } catch (Exception e) {
            Log.e(TAG, "[GSI-DEBUG] Unexpected exception onActivityResult", e);
            deliver("", "on_activity_result_exception");
        }
        finish();
    }
}
