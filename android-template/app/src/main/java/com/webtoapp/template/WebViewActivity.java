package com.webtoapp.template;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
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
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.util.TypedValue;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import org.json.JSONArray;
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
        // Use LinearLayout (vertical) so bottom nav sits below the webview area
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        // WebView container (takes remaining space)
        FrameLayout webContainer = new FrameLayout(this);

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

        webContainer.addView(swipeRefresh);
        webContainer.addView(progressBar);

        root.addView(webContainer, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        // Watermark banner (if enabled)
        if (features.optBoolean("show_watermark", false)) {
            setupWatermarkBanner(root);
        }

        // Bottom Navigation (if enabled with items)
        setupBottomNavigation(root, primaryColor);

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

    private void setupBottomNavigation(LinearLayout root, String primaryColor) {
        if (!features.optBoolean("navigation_menu", false)) return;

        JSONArray navItems = config.optJSONArray("navigation_items");
        if (navItems == null || navItems.length() == 0) return;

        BottomNavigationView bottomNav = new BottomNavigationView(this);
        bottomNav.setId(View.generateViewId());
        bottomNav.setBackgroundColor(Color.WHITE);
        bottomNav.setLabelVisibilityMode(BottomNavigationView.LABEL_VISIBILITY_LABELED);

        // Top border line
        GradientDrawable divider = new GradientDrawable();
        divider.setColor(Color.WHITE);
        divider.setStroke(1, Color.parseColor("#E5E7EB"));
        bottomNav.setBackground(divider);

        Menu menu = bottomNav.getMenu();
        int activeColor = Color.parseColor(primaryColor);
        int inactiveColor = Color.parseColor("#9CA3AF");

        int[][] states = new int[][] {
                new int[] { android.R.attr.state_checked },
                new int[] { -android.R.attr.state_checked }
        };
        int[] colors = new int[] { activeColor, inactiveColor };
        bottomNav.setItemIconTintList(new android.content.res.ColorStateList(states, colors));
        bottomNav.setItemTextColor(new android.content.res.ColorStateList(states, colors));

        // Store URLs for navigation items
        final String[] navUrls = new String[navItems.length()];

        for (int i = 0; i < navItems.length() && i < 5; i++) {
            JSONObject item = navItems.optJSONObject(i);
            if (item == null) continue;
            String title = item.optString("title", item.optString("label", "Tab " + (i + 1)));
            String url = item.optString("url", appUrl);
            String icon = item.optString("icon", "home");
            navUrls[i] = url;
            menu.add(Menu.NONE, i, i, title).setIcon(getNavIcon(icon));
        }

        bottomNav.setOnItemSelectedListener(menuItem -> {
            int idx = menuItem.getItemId();
            if (idx >= 0 && idx < navUrls.length && navUrls[idx] != null) {
                webView.loadUrl(navUrls[idx]);
            }
            return true;
        });

        root.addView(bottomNav, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
    }

    private void setupWatermarkBanner(LinearLayout root) {
        TextView watermark = new TextView(this);
        watermark.setText("Powered by WebToApp");
        watermark.setTextColor(Color.parseColor("#6B7280"));
        watermark.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        watermark.setBackgroundColor(Color.parseColor("#F3F4F6"));
        watermark.setGravity(android.view.Gravity.CENTER);
        int pad = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 4,
                getResources().getDisplayMetrics());
        watermark.setPadding(0, pad, 0, pad);
        watermark.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://websitetoapp.app"));
            startActivity(intent);
        });
        root.addView(watermark, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
    }

    private int getNavIcon(String iconName) {
        switch (iconName.toLowerCase()) {
            case "home": return android.R.drawable.ic_menu_today;
            case "search": return android.R.drawable.ic_menu_search;
            case "settings": case "gear": return android.R.drawable.ic_menu_preferences;
            case "info": case "about": return android.R.drawable.ic_menu_info_details;
            case "map": case "location": return android.R.drawable.ic_menu_mapmode;
            case "camera": case "photo": return android.R.drawable.ic_menu_camera;
            case "share": return android.R.drawable.ic_menu_share;
            case "star": case "favorite": return android.R.drawable.ic_menu_recent_history;
            case "mail": case "email": return android.R.drawable.ic_dialog_email;
            case "call": case "phone": return android.R.drawable.ic_menu_call;
            case "gallery": case "image": case "images": return android.R.drawable.ic_menu_gallery;
            case "edit": case "compose": return android.R.drawable.ic_menu_edit;
            case "delete": return android.R.drawable.ic_menu_delete;
            case "add": case "plus": return android.R.drawable.ic_menu_add;
            case "upload": return android.R.drawable.ic_menu_upload;
            case "save": return android.R.drawable.ic_menu_save;
            case "help": return android.R.drawable.ic_menu_help;
            case "close": return android.R.drawable.ic_menu_close_clear_cancel;
            case "more": return android.R.drawable.ic_menu_more;
            case "view": case "news": return android.R.drawable.ic_menu_view;
            case "manage": return android.R.drawable.ic_menu_manage;
            case "send": return android.R.drawable.ic_menu_send;
            case "crop": return android.R.drawable.ic_menu_crop;
            case "sort": return android.R.drawable.ic_menu_sort_by_size;
            case "day": case "agenda": return android.R.drawable.ic_menu_day;
            case "week": return android.R.drawable.ic_menu_week;
            case "month": return android.R.drawable.ic_menu_month;
            case "report": return android.R.drawable.ic_menu_report_image;
            case "rotate": return android.R.drawable.ic_menu_rotate;
            case "zoom": return android.R.drawable.ic_menu_zoom;
            case "directions": return android.R.drawable.ic_menu_directions;
            case "myplaces": case "bookmark": return android.R.drawable.ic_menu_myplaces;
            default: return android.R.drawable.ic_menu_compass;
        }
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
