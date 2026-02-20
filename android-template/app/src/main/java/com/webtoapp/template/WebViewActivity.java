package com.webtoapp.template;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import org.json.JSONObject;

public class WebViewActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefresh;
    private JSONObject config;
    private JSONObject features;
    private String appUrl;
    private String appHost;

    private ValueCallback<Uri[]> fileUploadCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadConfig();
        setupWindow();
        setupLayout();
        setupWebView();
        setupFeatures();

        webView.loadUrl(appUrl);
    }

    private void loadConfig() {
        try {
            String configJson = getIntent().getStringExtra("config");
            if (configJson != null) {
                config = new JSONObject(configJson);
            } else {
                config = new JSONObject();
            }
            features = config.optJSONObject("features");
            if (features == null) features = new JSONObject();
            appUrl = config.optString("app_url", "https://example.com");
            appHost = config.optString("app_host", "example.com");
        } catch (Exception e) {
            config = new JSONObject();
            features = new JSONObject();
            appUrl = "https://example.com";
            appHost = "example.com";
        }
    }

    private void setupWindow() {
        String statusBarColor = config.optString("status_bar_color", "#1E3A5F");
        getWindow().setStatusBarColor(Color.parseColor(statusBarColor));

        if (features.optBoolean("screenshot_prevention", false)) {
            getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
            );
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupLayout() {
        FrameLayout root = new FrameLayout(this);

        // SwipeRefresh
        swipeRefresh = new SwipeRefreshLayout(this);
        String primaryColor = config.optString("primary_color", "#2563EB");
        swipeRefresh.setColorSchemeColors(Color.parseColor(primaryColor));

        // WebView
        webView = new WebView(this);
        swipeRefresh.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // Progress bar
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 8));

        root.addView(swipeRefresh);
        root.addView(progressBar);

        setContentView(root);

        swipeRefresh.setOnRefreshListener(() -> webView.reload());

        // File upload launcher
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (fileUploadCallback != null) {
                        Uri[] results = null;
                        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                            String dataString = result.getData().getDataString();
                            if (dataString != null) {
                                results = new Uri[]{Uri.parse(dataString)};
                            }
                        }
                        fileUploadCallback.onReceiveValue(results);
                        fileUploadCallback = null;
                    }
                });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);

        // Custom user agent
        String customUA = features.optString("custom_user_agent", "");
        if (!customUA.isEmpty()) {
            settings.setUserAgentString(customUA);
        }

        // Offline mode
        if (features.optBoolean("offline_mode", false)) {
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                if (host != null && host.contains(appHost)) {
                    return false; // Load in WebView
                }
                // External links open in browser
                Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                startActivity(intent);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                fileChooserLauncher.launch(intent);
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                                                            GeolocationPermissions.Callback callback) {
                if (features.optBoolean("location_services", false)) {
                    if (ContextCompat.checkSelfPermission(WebViewActivity.this,
                            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                        callback.invoke(origin, true, false);
                    } else {
                        ActivityCompat.requestPermissions(WebViewActivity.this,
                                new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 100);
                    }
                }
            }
        });
    }

    private void setupFeatures() {
        // JS Bridge
        if (features.optBoolean("js_bridge", false)) {
            JavaScriptBridge bridge = new JavaScriptBridge(this, webView);
            webView.addJavascriptInterface(bridge, "WebToApp");
        }

        // Biometric auth
        if (features.optBoolean("biometric_auth", false)) {
            BiometricHelper.authenticate(this, () -> {
                // Auth passed, already showing content
            }, () -> {
                finish(); // Auth failed
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
