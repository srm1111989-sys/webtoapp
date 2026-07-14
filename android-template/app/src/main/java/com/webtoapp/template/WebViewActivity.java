package com.webtoapp.template;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
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
import android.widget.Button;
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
    private String appBaseDomain;

    private ValueCallback<Uri[]> fileUploadCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadConfig();
        setupWindow();

        // Check trial expiry for free plan apps
        int trialDays = features.optInt("trial_days", 0);
        if (trialDays > 0 && isTrialExpired(trialDays)) {
            showTrialExpiredScreen();
            return;
        }

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
            appBaseDomain = extractBaseDomain(appHost);
        } catch (Exception e) {
            config = new JSONObject();
            features = new JSONObject();
            appUrl = "https://example.com";
            appHost = "example.com";
            appBaseDomain = "example.com";
        }
    }

    private String extractBaseDomain(String host) {
        // Strip www. prefix and return base domain (e.g., "www.example.com" → "example.com")
        if (host != null && host.startsWith("www.")) {
            return host.substring(4);
        }
        return host;
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

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                getResources().getDisplayMetrics());
    }

    private void setupWatermarkBanner(LinearLayout root) {
        // Slim, modern branded bar: dark gradient with rounded top corners,
        // a lightning glyph, "Built with WebToApp" (brand accent), and an
        // "Upgrade" chip. Tapping the bar opens the site; the chip opens pricing.
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(14), dp(9), dp(12), dp(9));

        GradientDrawable barBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{Color.parseColor("#1E293B"), Color.parseColor("#0F172A")});
        float r = dp(14);
        barBg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0}); // round top only
        bar.setBackground(barBg);
        bar.setElevation(dp(8));

        // ⚡ + "Built with " (muted) + "WebToApp" (accent, bold)
        TextView lead = new TextView(this);
        lead.setText("⚡ Built with ");
        lead.setTextColor(Color.parseColor("#94A3B8"));
        lead.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);

        TextView brand = new TextView(this);
        brand.setText("WebToApp");
        brand.setTextColor(Color.parseColor("#60A5FA"));
        brand.setTypeface(Typeface.DEFAULT_BOLD);
        brand.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);

        View spacer = new View(this);
        LinearLayout.LayoutParams spLp = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);

        // "Upgrade ›" chip
        TextView chip = new TextView(this);
        chip.setText("Upgrade ›");
        chip.setTextColor(Color.WHITE);
        chip.setTypeface(Typeface.DEFAULT_BOLD);
        chip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        chip.setPadding(dp(12), dp(5), dp(12), dp(5));
        GradientDrawable chipBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{Color.parseColor("#3B82F6"), Color.parseColor("#2563EB")});
        chipBg.setCornerRadius(dp(20));
        chip.setBackground(chipBg);

        final String purchaseUrl = features != null ? features.optString("purchase_url", "") : "";
        chip.setOnClickListener(v -> openUrl(!purchaseUrl.isEmpty() ? purchaseUrl : "https://websitetoapp.app/pricing"));
        bar.setOnClickListener(v -> openUrl("https://websitetoapp.app"));

        bar.addView(lead);
        bar.addView(brand);
        bar.addView(spacer, spLp);
        bar.addView(chip);

        root.addView(bar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
    }

    private void openUrl(String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.setPackage("com.android.chrome");
        try {
            startActivity(intent);
        } catch (Exception e) {
            intent.setPackage(null);
            startActivity(intent);
        }
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
                if (host != null && (host.contains(appBaseDomain) || host.contains(appHost))) {
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

    private boolean isTrialExpired(int trialDays) {
        SharedPreferences prefs = getSharedPreferences("webtoapp_trial", MODE_PRIVATE);
        long firstLaunch = prefs.getLong("first_launch", 0);
        if (firstLaunch == 0) {
            prefs.edit().putLong("first_launch", System.currentTimeMillis()).apply();
            return false;
        }
        long elapsed = System.currentTimeMillis() - firstLaunch;
        long trialMs = (long) trialDays * 24 * 60 * 60 * 1000;
        return elapsed > trialMs;
    }

    private void showTrialExpiredScreen() {
        String primaryColor = config.optString("primary_color", "#2563EB");
        String purchaseUrl = features.optString("purchase_url", "https://websitetoapp.app/pricing");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.WHITE);
        int padding = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 32,
                getResources().getDisplayMetrics());
        layout.setPadding(padding, padding, padding, padding);

        // Trial expired icon
        TextView icon = new TextView(this);
        icon.setText("\u23F0");
        icon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 64);
        icon.setGravity(Gravity.CENTER);
        layout.addView(icon);

        // Title
        TextView title = new TextView(this);
        title.setText("Trial Expired");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#111827"));
        title.setGravity(Gravity.CENTER);
        int titleMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 16,
                getResources().getDisplayMetrics());
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        titleParams.setMargins(0, titleMargin, 0, 0);
        title.setLayoutParams(titleParams);
        layout.addView(title);

        // Message
        TextView message = new TextView(this);
        message.setText("Your 15-day free trial has ended.\nUpgrade to Premium to continue using this app with all features and no watermark.");
        message.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        message.setTextColor(Color.parseColor("#6B7280"));
        message.setGravity(Gravity.CENTER);
        message.setLineSpacing(8, 1);
        LinearLayout.LayoutParams msgParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        int msgMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 12,
                getResources().getDisplayMetrics());
        msgParams.setMargins(0, msgMargin, 0, 0);
        message.setLayoutParams(msgParams);
        layout.addView(message);

        // Purchase button
        Button buyButton = new Button(this);
        buyButton.setText("Upgrade to Premium");
        buyButton.setTextColor(Color.WHITE);
        buyButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        buyButton.setTypeface(null, Typeface.BOLD);
        buyButton.setAllCaps(false);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor(primaryColor));
        btnBg.setCornerRadius(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 12,
                getResources().getDisplayMetrics()));
        buyButton.setBackground(btnBg);
        int btnPadH = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 32,
                getResources().getDisplayMetrics());
        int btnPadV = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 14,
                getResources().getDisplayMetrics());
        buyButton.setPadding(btnPadH, btnPadV, btnPadH, btnPadV);
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        int btnMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 24,
                getResources().getDisplayMetrics());
        btnParams.setMargins(0, btnMargin, 0, 0);
        buyButton.setLayoutParams(btnParams);
        buyButton.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(purchaseUrl));
            startActivity(intent);
        });
        layout.addView(buyButton);

        // Powered by text
        TextView powered = new TextView(this);
        powered.setText("Powered by WebToApp");
        powered.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        powered.setTextColor(Color.parseColor("#9CA3AF"));
        powered.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams poweredParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        int poweredMargin = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 32,
                getResources().getDisplayMetrics());
        poweredParams.setMargins(0, poweredMargin, 0, 0);
        powered.setLayoutParams(poweredParams);
        layout.addView(powered);

        setContentView(layout);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
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
