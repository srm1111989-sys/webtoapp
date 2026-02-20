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

        if (isChromeInstalledAndSupported()) {
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
