package com.webtoapp.template;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.customtabs.TrustedWebUtils;

import org.json.JSONObject;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class LauncherActivity extends AppCompatActivity {

    private static final String TAG = "LauncherActivity";
    private static final String CHROME_PACKAGE = "com.android.chrome";
    private JSONObject config;
    private String appUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadConfig();

        // Free-app telemetry only (paid apps never phone home).
        maybeSendAnalytics();

        // Use WebView by default for a native app experience (no URL bar).
        // TWA requires Digital Asset Links (assetlinks.json) on the website;
        // without it, Chrome shows a URL bar making it look like a browser.
        boolean useTwa = config.optJSONObject("features") != null
                && config.optJSONObject("features").optBoolean("twa_mode", false);

        if (useTwa && isChromeInstalledAndSupported()) {
            launchTWA();
        } else {
            launchWebView();
        }
    }

    private void loadConfig() {
        try {
            InputStream is = getAssets().open("config.json");
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            String json = new String(buffer, StandardCharsets.UTF_8);
            config = new JSONObject(json);
            appUrl = config.optString("app_url", "https://example.com");
        } catch (Exception e) {
            Log.e(TAG, "Failed to load config", e);
            appUrl = "https://example.com";
            config = new JSONObject();
        }
    }

    /** Best-effort 'app_open' ping — FREE apps only, never blocks or errors the launch. */
    private void maybeSendAnalytics() {
        try {
            JSONObject feats = config.optJSONObject("features");
            if (feats == null || !feats.optBoolean("show_watermark", false)) return; // free = has watermark
            final int orderId = feats.optInt("order_id", 0);
            if (orderId <= 0) return;
            final String url = feats.optString("analytics_url", "https://websitetoapp.app/api/apps/event");
            final String pkg = getPackageName();
            String v = "";
            try { v = getPackageManager().getPackageInfo(pkg, 0).versionName; } catch (Exception ignored) {}
            final String version = v;
            final String deviceId = getOrCreateDeviceId();
            new Thread(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("order_id", orderId);
                    body.put("event", "app_open");
                    body.put("device_id", deviceId);
                    body.put("package", pkg);
                    body.put("app_version", version);
                    body.put("platform", "android");
                    java.net.HttpURLConnection c =
                            (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
                    c.setConnectTimeout(4000);
                    c.setReadTimeout(4000);
                    c.setRequestMethod("POST");
                    c.setRequestProperty("Content-Type", "application/json");
                    c.setDoOutput(true);
                    c.getOutputStream().write(body.toString().getBytes(StandardCharsets.UTF_8));
                    c.getResponseCode();
                    c.disconnect();
                } catch (Exception ignored) {}
            }).start();
        } catch (Exception ignored) {}
    }

    private String getOrCreateDeviceId() {
        android.content.SharedPreferences p = getSharedPreferences("wta_prefs", MODE_PRIVATE);
        String id = p.getString("device_id", null);
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
            p.edit().putString("device_id", id).apply();
        }
        return id;
    }

    private boolean isChromeInstalledAndSupported() {
        try {
            getPackageManager().getPackageInfo(CHROME_PACKAGE, 0);
            // Check if Chrome supports TWA (version 72+)
            return CustomTabsClient.getPackageName(this, null) != null;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private void launchTWA() {
        CustomTabsClient.bindCustomTabsService(this, CHROME_PACKAGE, new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(android.content.ComponentName name, CustomTabsClient client) {
                CustomTabsSession session = client.newSession(null);
                if (session == null) {
                    launchWebView();
                    return;
                }

                try {
                    CustomTabsIntent intent = new CustomTabsIntent.Builder(session).build();
                    TrustedWebUtils.launchAsTrustedWebActivity(
                            LauncherActivity.this,
                            intent,
                            Uri.parse(appUrl)
                    );
                    finish();
                } catch (Exception e) {
                    Log.e(TAG, "TWA launch failed, falling back to WebView", e);
                    launchWebView();
                }
            }

            @Override
            public void onServiceDisconnected(android.content.ComponentName name) {
                // Service disconnected
            }
        });
    }

    private void launchWebView() {
        Intent intent = new Intent(this, WebViewActivity.class);
        intent.putExtra("config", config.toString());
        startActivity(intent);
        finish();
    }
}
