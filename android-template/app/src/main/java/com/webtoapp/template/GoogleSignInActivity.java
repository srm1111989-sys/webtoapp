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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Invisible helper activity that runs the NATIVE Google sign-in flow.
 * Correctly extracts the Android OAuth Client ID from google-services.json
 * by matching package_name + certificate_hash, not just client_type.
 *
 * FIX (2026-08-18): old parser used string search that could return null
 * or pick the wrong client, causing sign_in_failed_10 (DEVELOPER_ERROR = 10)
 * on Play-signed AABs. New parser matches the running cert's SHA-1 to the
 * correct oauth_client entry.
 */
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

        String clientId = resolveCorrectClientId();
        if (clientId == null) {
            Log.e(TAG, "No matching Android OAuth client found - cannot use Web Client ID for native sign-in (DEVELOPER_ERROR). Check google-services.json has correct package_name + SHA-1 for a.academic.fresh");
            deliver("", "no_android_oauth_client");
            finish();
            return;
        }

        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(clientId)
                    .requestEmail()
                    .build();
            GoogleSignInClient client = GoogleSignIn.getClient(this, gso);
            client.signOut().addOnCompleteListener(t ->
                    startActivityForResult(client.getSignInIntent(), RC_SIGN_IN));
        } catch (Exception e) {
            Log.e(TAG, "Google sign-in init failed", e);
            deliver("", "google_signin_init_failed");
            finish();
        }
    }

    /**
     * Load google-services.json from assets, find the Android OAuth client
     * whose certificate_hash matches the running app's signing certificate.
     */
    private String resolveCorrectClientId() {
        try {
            String content = readAsset("google-services.json");
            String pkg = getPackageName();
            String certHash = getSigningCertHash();

            // Find all android_info blocks whose package_name matches ours
            // and whose certificate_hash matches our cert.
            // Look for oauth_client entries with client_type 1.
            int searchFrom = 0;
            while (true) {
                int oauthIdx = content.indexOf("\"oauth_client\"", searchFrom);
                if (oauthIdx < 0) break;

                // Find the client_id within this oauth_client block
                int clientIdIdx = content.indexOf("\"client_id\"", oauthIdx);
                if (clientIdIdx < 0) break;

                int cColon = content.indexOf(":", clientIdIdx);
                int q1 = content.indexOf("\"", cColon);
                int q2 = content.indexOf("\"", q1 + 1);
                if (q1 < 0 || q2 < 0) break;
                String cid = content.substring(q1 + 1, q2);

                // Check if this oauth_client block has client_type 1
                int typeIdx = content.indexOf("\"client_type\"", oauthIdx);
                int nextOAuth = content.indexOf("\"oauth_client\"", oauthIdx + 1);
                int blockEnd = nextOAuth > 0 ? nextOAuth : content.length();

                if (typeIdx > 0 && typeIdx < blockEnd) {
                    int tColon = content.indexOf(":", typeIdx);
                    int typeVal = content.indexOf("1", tColon);
                    if (typeVal > 0 && typeVal < tColon + 10) {
                        // This is an Android client. Check package_name + cert_hash
                        if (matchesThisApp(content, oauthIdx, blockEnd, pkg, certHash)) {
                            Log.d(TAG, "Matched Android OAuth client: " + cid);
                            return cid;
                        }
                    }
                }
                searchFrom = oauthIdx + 1;
            }
            Log.w(TAG, "No matching Android OAuth client found for pkg=" + pkg + " hash=" + certHash);
        } catch (Exception e) {
            Log.w(TAG, "Failed to resolve Android client ID: " + e.getMessage());
        }
        return null;
    }

    /**
     * Check if an oauth_client block contains android_info matching this app's
     * package_name and signing certificate SHA-1.
     */
    private boolean matchesThisApp(String content, int blockStart, int blockEnd, String pkg, String certHash) {
        int pkgIdx = content.indexOf("\"package_name\"", blockStart);
        if (pkgIdx < 0 || pkgIdx > blockEnd) return false;
        int pColon = content.indexOf(":", pkgIdx);
        int pq1 = content.indexOf("\"", pColon);
        int pq2 = content.indexOf("\"", pq1 + 1);
        String foundPkg = content.substring(pq1 + 1, pq2);
        if (!pkg.equals(foundPkg)) return false;

        int hashIdx = content.indexOf("\"certificate_hash\"", blockStart);
        if (hashIdx < 0 || hashIdx > blockEnd) return false;
        int hColon = content.indexOf(":", hashIdx);
        // certificate_hash can be an array [\"hash\"] or a string \"hash\"
        String foundHash;
        if (hColon > 0 && content.charAt(hColon + 1) == '[') {
            int hq1 = content.indexOf("\"", hColon);
            int hq2 = content.indexOf("\"", hq1 + 1);
            foundHash = hq1 >= 0 ? content.substring(hq1 + 1, hq2) : "";
        } else {
            int hq1 = content.indexOf("\"", hColon);
            int hq2 = content.indexOf("\"", hq1 + 1);
            foundHash = hq1 >= 0 ? content.substring(hq1 + 1, hq2) : "";
        }
        return certHash.equals(normalizeSha(foundHash));
    }

    /**
     * Normalize SHA-1: remove colons, lowercase.
     */
    private String normalizeSha(String sha) {
        if (sha == null) return "";
        return sha.replace(":", "").toLowerCase(Locale.US);
    }

    /**
     * Fallback: read default_web_client_id from generated resources.
     */
    private String fallbackToWebClientId() {
        try {
            int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
            if (resId != 0) {
                return getString(resId);
            }
        } catch (Exception e) {
            Log.w(TAG, "Cannot read default_web_client_id: " + e.getMessage());
        }
        return null;
    }

    /**
     * Compute SHA-1 of the signing certificate of the currently running APK.
     * This matches the hash Google Play Console shows in App signing.
     */
    private String getSigningCertHash() {
        try {
            java.security.cert.Certificate cert = getPackageManager()
                    .getPackageInfo(getPackageName(), android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES)
                    .signingInfo.getApkContentsSigners()[0];
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(cert.getEncoded());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format(Locale.US, "%02x", b));
            }
            return sb.toString().replace(":", "").toLowerCase(Locale.US);
        } catch (Exception e) {
            Log.w(TAG, "Cannot get signing cert hash: " + e.getMessage());
            return null;
        }
    }

    private String readAsset(String filename) throws Exception {
        InputStream is = getAssets().open(filename);
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        reader.close();
        return sb.toString();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != RC_SIGN_IN) return;
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
            deliver("", "on_activity_result_exception");
        }
        finish();
    }
}
