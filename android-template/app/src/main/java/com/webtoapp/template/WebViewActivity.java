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
import android.widget.Toast;
import org.json.JSONObject;

public class WebViewActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefresh;
    // Android 15+ screen-recording detection: mutes audio while the app is being
    // recorded (part of Screen Capture Protection). Held so we can unregister it.
    private java.util.function.Consumer<Integer> screenRecordMuteCallback;
    private JSONObject config;
    private JSONObject features;
    private String appUrl;
    private String appHost;
    private String appBaseDomain;

    private ValueCallback<Uri[]> fileUploadCallback;
    private ActivityResultLauncher<Intent> fileChooserLauncher;

    // HTML5 fullscreen video (onShowCustomView) — without these the player's
    // fullscreen button silently does nothing (customer report 2026-07-20).
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private int fullscreenPrevSystemUi;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadConfig();
        setupWindow();

        // Check trial expiry for free plan apps. A paid upgrade recorded on the
        // server unlocks the install live — see refreshEntitlement().
        int trialDays = features.optInt("trial_days", 0);
        if (trialDays > 0 && !isEntitledPaid()) {
            if (isTrialExpired(trialDays)) {
                // If the owner just paid, flip to the unlocked app the moment
                // the server confirms; meanwhile show the neutral notice.
                refreshEntitlement(this::recreate);
                showTrialExpiredScreen();
                return;
            }
            // Trial still running — refresh the cached entitlement quietly so a
            // payment made on the website unlocks the next launch.
            refreshEntitlement(null);
        }

        setupLayout();
        setupWebView();
        setupFeatures();
        requestNotificationPermissionIfNeeded();

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
            // FLAG_SECURE only blanks the *visual* surface for screenshots/screen
            // recorders — audio is a separate stream and still gets captured. On
            // API 29+ opt the whole app out of the MediaProjection AudioPlaybackCapture
            // path so screen recorders can't grab the sound either (covers WebView /
            // embedded video audio, since it plays through this app's process).
            // Note: this cannot stop acoustic mic recording — no platform API can.
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                android.media.AudioManager am =
                        (android.media.AudioManager) getSystemService(android.content.Context.AUDIO_SERVICE);
                if (am != null) {
                    am.setAllowedCapturePolicy(android.media.AudioAttributes.ALLOW_CAPTURE_BY_NONE);
                }
            }
            // Android 15+ can tell an app when its own windows are being screen
            // recorded. The system recorder captures internal audio at a level no
            // app can block (ALLOW_CAPTURE_BY_NONE only stops third-party capture
            // apps), so the honest defence is: the moment a recording starts, mute
            // the media stream; unmute when it stops. Result on Android 15+: a
            // recording of a protected app gets a blank screen AND silence.
            registerScreenRecordingMute();
        }
    }

    private void registerScreenRecordingMute() {
        if (android.os.Build.VERSION.SDK_INT < 35) return;  // API 35 = Android 15
        try {
            final android.media.AudioManager am =
                    (android.media.AudioManager) getSystemService(android.content.Context.AUDIO_SERVICE);
            if (am == null) return;
            screenRecordMuteCallback = state -> {
                boolean recording =
                        state == android.view.WindowManager.SCREEN_RECORDING_STATE_VISIBLE;
                am.adjustStreamVolume(
                        android.media.AudioManager.STREAM_MUSIC,
                        recording ? android.media.AudioManager.ADJUST_MUTE
                                  : android.media.AudioManager.ADJUST_UNMUTE,
                        0);
            };
            int initial = getWindowManager()
                    .addScreenRecordingCallback(getMainExecutor(), screenRecordMuteCallback);
            screenRecordMuteCallback.accept(initial);
        } catch (Throwable t) {
            screenRecordMuteCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (screenRecordMuteCallback != null
                && android.os.Build.VERSION.SDK_INT >= 35) {
            try {
                getWindowManager().removeScreenRecordingCallback(screenRecordMuteCallback);
                android.media.AudioManager am =
                        (android.media.AudioManager) getSystemService(android.content.Context.AUDIO_SERVICE);
                if (am != null) {
                    am.adjustStreamVolume(android.media.AudioManager.STREAM_MUSIC,
                            android.media.AudioManager.ADJUST_UNMUTE, 0);
                }
            } catch (Throwable ignored) {
            }
        }
        super.onDestroy();
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

        // Watermark: floating pill over the content area (added to webContainer,
        // not root) so it never collides with the bottom navigation row.
        if (features.optBoolean("show_watermark", false) && !isEntitledPaid()) {
            setupWatermarkBanner(webContainer);
        }

        // Bottom Navigation (if enabled with items)
        setupBottomNavigation(root, primaryColor);

        // Force the root to fill the window so the weighted WebView container
        // expands and the watermark bar is pinned to the bottom (not centered).
        setContentView(root, new android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT));

        // Pull-to-refresh behaviour
        // (1) Optional: apps can turn it off entirely via the "disable_pull_to_refresh"
        //     feature — web apps that never need a manual reload don't want the gesture
        //     firing while the user is simply scrolling.
        boolean pullToRefreshDisabled = features.optBoolean("disable_pull_to_refresh", false);
        swipeRefresh.setEnabled(!pullToRefreshDisabled);
        // (2) When enabled, only arm the gesture when the page is scrolled to the very
        //     top. This stops a normal downward scroll mid-page from triggering a refresh,
        //     and keeps SwipeRefreshLayout from intercepting the WebView's touch stream
        //     mid-gesture (which was making the web content's own swipe/slider handlers
        //     read the wrong direction).
        swipeRefresh.setOnChildScrollUpCallback((parent, child) -> webView.getScrollY() > 0);
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

    private void setupWatermarkBanner(FrameLayout container) {
        // Compact FLOATING pill overlaid on the bottom of the content area — it
        // adds no layout height and sits ABOVE the app's bottom menu (which is a
        // sibling row below this container), so the two never overlap.
        // "⚡ Built with websitetoapp.app · Upgrade ›", tappable.
        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setPadding(dp(13), dp(7), dp(7), dp(7));

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#F20F172A")); // ~95% opaque dark slate
        bg.setCornerRadius(dp(22));
        bg.setStroke(dp(1), Color.parseColor("#334155"));
        pill.setBackground(bg);
        pill.setElevation(dp(10));

        TextView lead = new TextView(this);
        lead.setText("⚡ Built with ");
        lead.setTextColor(Color.parseColor("#94A3B8"));
        lead.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);

        TextView brand = new TextView(this);
        brand.setText("websitetoapp.app");
        brand.setTextColor(Color.parseColor("#60A5FA"));
        brand.setTypeface(Typeface.DEFAULT_BOLD);
        brand.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);

        TextView chip = new TextView(this);
        chip.setText("Upgrade ›");
        chip.setTextColor(Color.WHITE);
        chip.setTypeface(Typeface.DEFAULT_BOLD);
        chip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11.5f);
        chip.setPadding(dp(11), dp(4), dp(11), dp(4));
        GradientDrawable chipBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{Color.parseColor("#3B82F6"), Color.parseColor("#2563EB")});
        chipBg.setCornerRadius(dp(18));
        chip.setBackground(chipBg);
        LinearLayout.LayoutParams chipLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        chipLp.leftMargin = dp(9);

        // No purchase link anywhere in the binary (Variant B / Play Payments
        // safety). The chip re-checks the paid entitlement instead, so a user
        // who just upgraded on the website can dismiss the watermark instantly.
        chip.setText("Refresh");
        chip.setOnClickListener(v -> {
            Toast.makeText(this, "Checking your plan…", Toast.LENGTH_SHORT).show();
            refreshEntitlement(this::recreate);
        });
        pill.setOnClickListener(null);

        pill.addView(lead);
        pill.addView(brand);
        pill.addView(chip, chipLp);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        lp.bottomMargin = dp(16);
        container.addView(pill, lp);
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
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) { callback.onCustomViewHidden(); return; }
                fullscreenView = view;
                fullscreenCallback = callback;
                fullscreenPrevSystemUi = getWindow().getDecorView().getSystemUiVisibility();
                view.setBackgroundColor(Color.BLACK);
                FrameLayout decor = (FrameLayout) getWindow().getDecorView();
                decor.addView(view, new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT));
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
            }

            @Override
            public void onHideCustomView() {
                hideFullscreenView();
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

    private void requestNotificationPermissionIfNeeded() {
        // Android 13+ (API 33) blocks ALL notifications until POST_NOTIFICATIONS is
        // granted at runtime. FCM push silently fails without it — the registration
        // token still generates, but no notification is ever delivered. Prompt on
        // launch when this app actually uses push so delivery can work.
        if (android.os.Build.VERSION.SDK_INT < 33) return;
        boolean usesPush = features.optBoolean("push_notifications", false)
                || features.optBoolean("firebase_notification", false);
        if (!usesPush) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
        }
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

    // ── Server entitlement (Variant B): a paid upgrade made on the website
    // unlocks this install live — no rebuild, and the app itself never shows
    // any payment UI, price, or external checkout link. ──
    private boolean isEntitledPaid() {
        return getSharedPreferences("webtoapp_entitlement", MODE_PRIVATE).getBoolean("paid", false);
    }

    /** Fetch paid/unpaid state from the server (4s budget, silent on failure).
     *  onPaid runs on the UI thread only when the server confirms paid. */
    private void refreshEntitlement(final Runnable onPaid) {
        final String orderId = features.optString("order_id", "");
        final String base = features.optString("entitlement_url", "https://websitetoapp.app/api/apps/entitlement");
        if (orderId.isEmpty()) return;
        new Thread(() -> {
            try {
                java.net.HttpURLConnection c = (java.net.HttpURLConnection)
                        new java.net.URL(base + "?order_id=" + orderId).openConnection();
                c.setConnectTimeout(4000);
                c.setReadTimeout(4000);
                java.io.BufferedReader r = new java.io.BufferedReader(
                        new java.io.InputStreamReader(c.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
                r.close();
                boolean paid = new JSONObject(sb.toString()).optBoolean("paid", false);
                getSharedPreferences("webtoapp_entitlement", MODE_PRIVATE)
                        .edit().putBoolean("paid", paid).apply();
                if (paid && onPaid != null) runOnUiThread(onPaid);
            } catch (Exception ignored) {
                // Offline or server unreachable — keep the baked build behavior.
            }
        }).start();
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

        // Message — trial length is dynamic (matches features.trial_days) so it
        // never drifts from the plan the app was built on.
        int trialLen = features.optInt("trial_days", 15);
        TextView message = new TextView(this);
        message.setText("This app\'s " + trialLen + "-day free period has ended.\n"
                + "The app owner can reactivate it anytime from their WebToApp dashboard.\n"
                + "Already reactivated? Tap the button below.");
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
        buyButton.setText("Check again");
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
            Toast.makeText(this, "Checking…", Toast.LENGTH_SHORT).show();
            refreshEntitlement(this::recreate);
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
        // Back exits fullscreen video first, then navigates web history.
        if (fullscreenView != null) {
            hideFullscreenView();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /** Tear down HTML5 fullscreen video (shared by onHideCustomView + back button). */
    private void hideFullscreenView() {
        if (fullscreenView == null) return;
        FrameLayout decor = (FrameLayout) getWindow().getDecorView();
        decor.removeView(fullscreenView);
        fullscreenView = null;
        getWindow().getDecorView().setSystemUiVisibility(fullscreenPrevSystemUi);
        if (fullscreenCallback != null) {
            fullscreenCallback.onCustomViewHidden();
            fullscreenCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
