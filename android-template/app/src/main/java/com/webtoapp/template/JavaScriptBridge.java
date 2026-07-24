package com.webtoapp.template;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONObject;

public class JavaScriptBridge {

    private final Context context;
    private final WebView webView;
    private final SharedPreferences prefs;
    private final AdManager adManager;

    public JavaScriptBridge(Context context, WebView webView, AdManager adManager) {
        this.context = context;
        this.webView = webView;
        this.adManager = adManager;
        this.prefs = context.getSharedPreferences("webtoapp_bridge", Context.MODE_PRIVATE);
    }

    @JavascriptInterface
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void vibrate(int duration) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            vibrator.vibrate(duration);
        }
    }

    @JavascriptInterface
    public void shareText(String title, String text) {
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("text/plain");
        share.putExtra(Intent.EXTRA_SUBJECT, title);
        share.putExtra(Intent.EXTRA_TEXT, text);
        context.startActivity(Intent.createChooser(share, "Share via"));
    }

    @JavascriptInterface
    public void openExternalUrl(String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        context.startActivity(intent);
    }

    @JavascriptInterface
    public void setItem(String key, String value) {
        prefs.edit().putString(key, value).apply();
    }

    @JavascriptInterface
    public String getItem(String key) {
        return prefs.getString(key, null);
    }

    @JavascriptInterface
    public void removeItem(String key) {
        prefs.edit().remove(key).apply();
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        try {
            JSONObject info = new JSONObject();
            info.put("platform", "android");
            info.put("manufacturer", android.os.Build.MANUFACTURER);
            info.put("model", android.os.Build.MODEL);
            info.put("sdk_version", android.os.Build.VERSION.SDK_INT);
            info.put("version_release", android.os.Build.VERSION.RELEASE);
            return info.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public void scanQR() {
        Intent intent = new Intent(context, QRScannerActivity.class);
        context.startActivity(intent);
    }

    /**
     * Hand the NATIVE Android FCM registration token to the web page. A WebView
     * cannot generate a token with the Firebase Web SDK (getToken()), so the page
     * asks the native layer for the device token and stores it server-side to send
     * per-user targeted push. Async — the token is delivered to a JS callback:
     *   window.WebToApp.getFCMToken('onFcmToken');
     *   window.onFcmToken = function (token, error) { ... };
     * `error` is empty on success; non-empty (e.g. "firebase_not_available") if
     * Firebase isn't configured for this app (no google-services.json).
     */
    @JavascriptInterface
    public void getFCMToken(final String callback) {
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                    .addOnCompleteListener(task -> {
                        String token = (task.isSuccessful() && task.getResult() != null) ? task.getResult() : "";
                        String error = task.isSuccessful() ? "" : String.valueOf(task.getException());
                        deliverToken(callback, token, error);
                    });
        } catch (Throwable t) {
            deliverToken(callback, "", "firebase_not_available");
        }
    }

    private void deliverToken(final String callback, String token, String error) {
        if (callback == null || callback.isEmpty()) return;
        final String js = "if (typeof " + callback + " === 'function') { "
                + callback + "(" + JSONObject.quote(token) + ", " + JSONObject.quote(error) + "); }";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    // ── AdMob: let the web app trigger full-screen ads and get the rewarded callback ──

    /** Show a rewarded ad; the JS callback fires with true only after the reward is
     *  earned, false otherwise. Needs the AdMob feature + a Rewarded Ad ID. */
    @JavascriptInterface
    public void showRewardedAd(final String callback) {
        if (adManager != null) {
            adManager.showRewardedAd(callback);
        } else if (callback != null && !callback.isEmpty()) {
            final String js = "if (typeof " + callback + " === 'function') { " + callback + "(false); }";
            webView.post(() -> webView.evaluateJavascript(js, null));
        }
    }

    @JavascriptInterface
    public void showInterstitial() {
        if (adManager != null) adManager.showInterstitial();
    }
}
