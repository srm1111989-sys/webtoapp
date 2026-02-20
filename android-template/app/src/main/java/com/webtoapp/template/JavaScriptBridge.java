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

    public JavaScriptBridge(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
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
}
