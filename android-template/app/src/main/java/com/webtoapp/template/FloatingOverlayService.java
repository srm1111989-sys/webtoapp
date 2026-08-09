package com.webtoapp.template;

// Incoming-request floating overlay (Phase 1). Feature-gated by
// features.incoming_request_overlay in config.json (default OFF, so no other app
// is affected). Built for Rahatna (paid custom feature) but config-driven so it
// can be productised later. Draws a card OVER other apps on a new-request push,
// fetches the latest details by Order ID, and offers Accept/Reject/Negotiate.
//
// Config (config.json features.overlay, all optional; Rahatna defaults):
//   details_url : full URL of the order-details endpoint (POST {orderId, providerUserId})
//   f_service   : JSON path/key for service type in the returned order  (default "type")
//   f_customer  : key for customer name   (default "customerName")
//   f_price     : key for price           (default "price")
//   f_area      : key for area/address    (default "area")

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.os.Vibrator;
import android.os.VibrationEffect;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class FloatingOverlayService extends Service {

    private static final String TAG = "OverlayService";
    private static final String FG_CHANNEL = "webtoapp_overlay";

    public static final String EXTRA_ORDER_ID = "orderId";
    public static final String EXTRA_PROVIDER_USER_ID = "providerUserId";
    public static final String ACTION_DISMISS = "com.webtoapp.template.OVERLAY_DISMISS";

    private WindowManager windowManager;
    private View overlayView;
    private CountDownTimer timer;
    private String orderId;
    private String providerUserId;
    private boolean actionInFlight = false;
    private final OverlayAlert alert = new OverlayAlert();
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_DISMISS.equals(intent.getAction())) {
            String dismissId = intent.getStringExtra(EXTRA_ORDER_ID);
            if (dismissId == null || dismissId.equals(orderId)) stopSelf();
            return START_NOT_STICKY;
        }

        // Need the "display over other apps" permission (granted at Service-Provider registration).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Log.w(TAG, "overlay permission not granted; nothing to show");
            stopSelf();
            return START_NOT_STICKY;
        }

        promoteForeground();
        orderId = intent != null ? intent.getStringExtra(EXTRA_ORDER_ID) : null;
        String pushProvider = intent != null ? intent.getStringExtra(EXTRA_PROVIDER_USER_ID) : null;
        // Push payloads don't include the provider id — fall back to the stored/config value.
        providerUserId = (pushProvider != null && !pushProvider.isEmpty())
                ? pushProvider : OverlayConfig.providerUserId(this);

        showOverlay();
        fetchAndPopulate(orderId, providerUserId);
        return START_NOT_STICKY;
    }

    /** Android 8+ requires a foreground notification to reliably run + draw from the background. */
    private void promoteForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(FG_CHANNEL) == null) {
                nm.createNotificationChannel(new NotificationChannel(
                        FG_CHANNEL, "Incoming requests", NotificationManager.IMPORTANCE_LOW));
            }
            Notification n = new Notification.Builder(this, FG_CHANNEL)
                    .setContentTitle("New request")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .build();
            // Android 14 (API 34) REQUIRES the foregroundServiceType in the call for a
            // manifest-declared specialUse service; omitting it throws and the overlay
            // then never draws. Older APIs use the 2-arg form.
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(42, n, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(42, n);
            }
          } catch (Exception e) {
            // Never let a foreground-service failure abort the overlay — it draws via
            // SYSTEM_ALERT_WINDOW regardless; FGS only keeps the service alive.
            Log.w(TAG, "promoteForeground failed (continuing to draw overlay): " + e.getMessage());
          }
        }
    }

    private void showOverlay() {
        if (overlayView != null) return;
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        int layoutId = getResources().getIdentifier("overlay_incoming_request", "layout", getPackageName());
        overlayView = LayoutInflater.from(this).inflate(layoutId, null);

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP;

        bindButton("btn_accept", "accept");
        bindButton("btn_reject", "reject");
        bindButton("btn_negotiate", "negotiate");
        // App logo in the banner.
        int logoId = getResources().getIdentifier("iv_logo", "id", getPackageName());
        View logo = logoId != 0 ? overlayView.findViewById(logoId) : null;
        if (logo instanceof ImageView) {
            try { ((ImageView) logo).setImageDrawable(getPackageManager().getApplicationIcon(getPackageName())); } catch (Exception ignored) {}
        }
        overlayView.setOnClickListener(v -> openAppToRequest());
        startCountdown(30);
        // Ringtone + call-style vibration, looping until the provider responds
        // or the countdown expires (silent/vibrate mode respected).
        alert.start(this);
        windowManager.addView(overlayView, params);
    }

    private void bindButton(String idName, final String action) {
        int id = getResources().getIdentifier(idName, "id", getPackageName());
        View b = overlayView.findViewById(id);
        if (b instanceof Button) {
            b.setOnClickListener(v -> respond(action));
            // Localised label from config (features.overlay.labels.<action>), e.g. Arabic.
            String label = OverlayConfig.label(this, action, ((Button) b).getText().toString());
            ((Button) b).setText(label);
        }
    }

    private void startCountdown(int seconds) {
        final TextView tv = overlayView.findViewById(getResources().getIdentifier("tv_countdown", "id", getPackageName()));
        timer = new CountDownTimer(seconds * 1000L, 1000L) {
            public void onTick(long ms) { if (tv != null) tv.setText(String.valueOf(ms / 1000)); }
            public void onFinish() { respond("timeout"); }
        }.start();
    }

    private void respond(String action) {
        // First interaction silences the ringtone/vibration immediately.
        alert.stop();
        // Live backend actions ($50 bundle spec, 2026-08-10):
        //  accept    -> POST acceptOrder; success = close + open app at the order;
        //               failure = show backend's Arabic message, keep the card open.
        //  reject    -> POST rejectOrder (returns order to the pool), close at once.
        //  negotiate -> open the app at the negotiation view, close.
        //  timeout   -> just close.
        if (actionInFlight) return;
        switch (action) {
            case "accept":
                actionInFlight = true;
                setStatusText(OverlayConfig.label(this, "accepting", "جارٍ قبول الطلب…"));
                OverlayActions.accept(this, orderId, providerUserId, new OverlayActions.Callback() {
                    @Override public void onSuccess() {
                        OverlayActions.openOrder(FloatingOverlayService.this, orderId);
                        stopSelf();
                    }
                    @Override public void onFailure(String message) {
                        actionInFlight = false;
                        setStatusText(message);
                    }
                });
                break;
            case "reject":
                OverlayActions.reject(this, orderId, providerUserId);
                stopSelf();
                break;
            case "negotiate":
                OverlayActions.openNegotiate(this, orderId);
                stopSelf();
                break;
            default: // timeout
                stopSelf();
        }
    }

    /** Show a short status/error line on the card (reuses tv_status if the layout
     *  has one, else falls back to the description field). */
    private void setStatusText(String text) {
        if (overlayView == null || text == null) return;
        int id = getResources().getIdentifier("tv_status", "id", getPackageName());
        if (id == 0) id = getResources().getIdentifier("tv_description", "id", getPackageName());
        View v = id != 0 ? overlayView.findViewById(id) : null;
        if (v instanceof TextView) ((TextView) v).setText(text);
    }

    private void openAppToRequest() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launch.putExtra(EXTRA_ORDER_ID, orderId);
            startActivity(launch);
        }
        stopSelf();
    }

    /** Fetch latest order details by ID and populate the card (off the main thread). */
    private void fetchAndPopulate(final String orderId, final String providerUserId) {
        if (orderId == null) return;
        new Thread(() -> {
            try {
                JSONObject cfg = OverlayConfig.load(this);
                String url = OverlayConfig.detailsUrl(this);
                if (url.isEmpty()) return; // no endpoint configured yet
                JSONObject reqBody = new JSONObject()
                        .put("orderId", orderId)
                        .put("providerUserId", providerUserId == null ? "" : providerUserId);

                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                // Production endpoint requires an API key header (provider-confirmed); sent only when configured.
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
                    // Trial builds stay fully functional for testing but are clearly marked.
                    setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
                    setText("tv_customer", customer);
                    setText("tv_price", price.isEmpty() ? "" : (cur.isEmpty() ? price : cur + " " + price));
                    setText("tv_area", trial && !area.isEmpty() ? (area + "  ·  TRIAL") : area);
                    setText("tv_description", desc);
                });
            } catch (Exception e) {
                Log.w(TAG, "getOrderDetails failed: " + e.getMessage());
            }
        }).start();
    }

    private void setText(String idName, String value) {
        if (overlayView == null) return;
        View v = overlayView.findViewById(getResources().getIdentifier(idName, "id", getPackageName()));
        if (v instanceof TextView && value != null && !value.isEmpty()) ((TextView) v).setText(value);
    }

    @Override
    public void onDestroy() {
        alert.stop();
        if (timer != null) timer.cancel();
        if (overlayView != null && windowManager != null) {
            try { windowManager.removeView(overlayView); } catch (Exception ignored) {}
            overlayView = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
