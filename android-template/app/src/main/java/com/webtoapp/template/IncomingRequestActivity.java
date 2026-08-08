package com.webtoapp.template;

// Incoming-request FULL-SCREEN screen (Phase 2, paid feature). Unlike the floating
// overlay card, this is a full-screen activity launched via a high-priority
// full-screen-intent notification, so it appears over the lock screen and when the
// app is backgrounded/closed — the sanctioned Android way to pop call-style UI from
// the background (no SYSTEM_ALERT_WINDOW needed). Feature-gated by
// features.incoming_request_fullscreen (default OFF). Config-driven, reuses the same
// features.overlay block (details_url, labels, field maps, currency, trial, etc.).

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class IncomingRequestActivity extends Activity {

    private static final String TAG = "IncomingFullScreen";
    private String orderId;
    private CountDownTimer timer;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over the lock screen and turn the screen on (call-style).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        int layoutId = getResources().getIdentifier("activity_incoming_request", "layout", getPackageName());
        setContentView(layoutId);

        orderId = getIntent() != null ? getIntent().getStringExtra(FloatingOverlayService.EXTRA_ORDER_ID) : null;
        String pushProvider = getIntent() != null ? getIntent().getStringExtra(FloatingOverlayService.EXTRA_PROVIDER_USER_ID) : null;
        final String providerUserId = (pushProvider != null && !pushProvider.isEmpty())
                ? pushProvider : OverlayConfig.providerUserId(this);

        // App logo in the header.
        View logo = findViewById(getResources().getIdentifier("iv_logo", "id", getPackageName()));
        if (logo instanceof ImageView) {
            try { ((ImageView) logo).setImageDrawable(getPackageManager().getApplicationIcon(getPackageName())); } catch (Exception ignored) {}
        }

        bindButton("btn_accept", "accept");
        bindButton("btn_reject", "reject");
        bindButton("btn_negotiate", "negotiate");
        startCountdown(30);
        vibrateAlert();
        fetchAndPopulate(orderId, providerUserId);
    }

    private void bindButton(String idName, final String action) {
        int id = getResources().getIdentifier(idName, "id", getPackageName());
        View b = findViewById(id);
        if (b instanceof Button) {
            b.setOnClickListener(v -> respond(action));
            String label = OverlayConfig.label(this, action, ((Button) b).getText().toString());
            ((Button) b).setText(label);
        }
    }

    private void startCountdown(int seconds) {
        int tvId = getResources().getIdentifier("tv_countdown", "id", getPackageName());
        final TextView tv = tvId != 0 ? findViewById(tvId) : null;
        timer = new CountDownTimer(seconds * 1000L, 1000L) {
            public void onTick(long ms) { if (tv != null) tv.setText(String.valueOf(ms / 1000)); }
            public void onFinish() { respond("timeout"); }
        }.start();
    }

    private void vibrateAlert() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            long[] pattern = {0, 500, 300, 500, 300, 500};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.vibrate(VibrationEffect.createWaveform(pattern, -1));
            else v.vibrate(pattern, -1);
        } catch (Exception ignored) {}
    }

    private void respond(String action) {
        if ("accept".equals(action) || "negotiate".equals(action)) openAppToRequest();
        finish();
    }

    private void openAppToRequest() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launch.putExtra(FloatingOverlayService.EXTRA_ORDER_ID, orderId);
            startActivity(launch);
        }
    }

    private void setText(String idName, String value) {
        View v = findViewById(getResources().getIdentifier(idName, "id", getPackageName()));
        if (v instanceof TextView && value != null && !value.isEmpty()) ((TextView) v).setText(value);
    }

    /** Fetch latest order details by ID (off the main thread) and populate the screen. */
    private void fetchAndPopulate(final String orderId, final String providerUserId) {
        if (orderId == null) return;
        new Thread(() -> {
            try {
                JSONObject cfg = OverlayConfig.load(this);
                String url = OverlayConfig.detailsUrl(this);
                if (url.isEmpty()) return;
                JSONObject reqBody = new JSONObject()
                        .put("orderId", orderId)
                        .put("providerUserId", providerUserId == null ? "" : providerUserId);
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                String overlayKey = OverlayConfig.overlayKey(this);
                if (!overlayKey.isEmpty()) c.setRequestProperty("X-Overlay-Key", overlayKey);
                c.setConnectTimeout(10000); c.setReadTimeout(10000); c.setDoOutput(true);
                try (OutputStream os = c.getOutputStream()) { os.write(reqBody.toString().getBytes("UTF-8")); }
                if (c.getResponseCode() / 100 != 2) return;
                StringBuilder sb = new StringBuilder();
                try (InputStream is = c.getInputStream()) {
                    byte[] buf = new byte[4096]; int n;
                    while ((n = is.read(buf)) != -1) sb.append(new String(buf, 0, n, "UTF-8"));
                }
                JSONObject resp = new JSONObject(sb.toString());
                JSONObject order = resp.optJSONObject("order");
                if (order == null) order = resp;
                final String service = order.optString(cfg.optString("f_service", "service"), "New request");
                final String customer = order.optString(cfg.optString("f_customer", "customerName"), "");
                final String price = order.optString(cfg.optString("f_price", "price"), "");
                final String area = order.optString(cfg.optString("f_area", "area"), "");
                final String desc = order.optString(cfg.optString("f_description", "description"), "");
                final String cur = OverlayConfig.currency(this);
                final boolean trial = OverlayConfig.isTrial(this);
                main.post(() -> {
                    setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
                    setText("tv_customer", customer);
                    setText("tv_price", price.isEmpty() ? "" : (cur.isEmpty() ? price : cur + " " + price));
                    setText("tv_area", area);
                    setText("tv_description", desc);
                });
            } catch (Exception e) {
                Log.w(TAG, "getOrderDetails failed: " + e.getMessage());
            }
        }).start();
    }

    @Override
    protected void onDestroy() {
        if (timer != null) timer.cancel();
        super.onDestroy();
    }
}
