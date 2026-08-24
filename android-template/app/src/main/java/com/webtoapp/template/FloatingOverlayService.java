package com.webtoapp.template;

import org.json.JSONObject;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class FloatingOverlayService extends Service {
    private static final String TAG = "FloatingOverlay";
    public static final String EXTRA_ORDER_ID = "order_id";
    public static final String EXTRA_PROVIDER_USER_ID = "provider_user_id";
    public static final String ACTION_DISMISS = "com.webtoapp.template.OVERLAY_DISMISS";
    private WindowManager windowManager;
    private View overlayView;
    private String orderId;
    private String providerUserId;
    private boolean actionInFlight = false;
    private CountDownTimer timer;
    private final OverlayAlert alert = new OverlayAlert();
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        promoteForeground();
        if (intent != null && ACTION_DISMISS.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null) {
            orderId = intent.getStringExtra(EXTRA_ORDER_ID);
        }
        String pushProvider = intent != null ? intent.getStringExtra(EXTRA_PROVIDER_USER_ID) : null;
        providerUserId = (pushProvider != null && !pushProvider.isEmpty())
                ? pushProvider : OverlayConfig.providerUserId(this);

        showOverlay();
        populateFromIntentExtras(intent);
        return START_NOT_STICKY;
    }

    private void populateFromIntentExtras(Intent intent) {
        if (intent == null || intent.getExtras() == null || overlayView == null) return;
        Bundle b = intent.getExtras();

        // Support both flat payload (order.service) and nested payload
        // where the backend wraps everything under an "order" key
        // (e.g. Rahatna's getOrderDetailsSecure returns { "order": { ... } }).
        String orderObj = b.getString("order");
        boolean nested = orderObj != null && !orderObj.isEmpty();
        Bundle nb = b;
        if (nested) {
            try { nb = new Bundle(); nb.putString("order", orderObj); } catch (Exception ignored) {}
        }

        String service = b.getString("service");
        if (service == null || service.isEmpty()) service = b.getString("type");
        if (service == null || service.isEmpty()) service = "New request";

        String customer = b.getString("customerFirstName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customerName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customer_name");
        if (customer == null || customer.isEmpty()) customer = b.getString("name");

        String price = b.getString("price");
        if (price == null || price.isEmpty()) price = b.getString("offeredPrice");
        if (price == null || service.isEmpty()) price = b.getString("amount");

        String areaLine = b.getString("generalAddress");
        if (areaLine == null || areaLine.isEmpty()) areaLine = b.getString("area");
        if (areaLine == null || areaLine.isEmpty()) areaLine = b.getString("address");

        String distStr = b.getString("tripDistance");
        String durStr = b.getString("tripDuration");
        if (distStr != null && !distStr.isEmpty()) {
            StringBuilder trip = new StringBuilder(distStr).append(" كم");
            if (durStr != null && !durStr.isEmpty()) {
                trip.append(" · ").append(durStr).append(" دقيقة");
            }
            areaLine = (areaLine == null || areaLine.isEmpty()) ? trip.toString() : areaLine + " · " + trip;
        }

        String desc = b.getString("description");

        // Fallback: read fields from a nested "order" JSON string if flat lookup returned empty
        if ((service == null || service.isEmpty() || "New request".equals(service))
                && nested) {
            try {
                JSONObject order = new JSONObject(orderObj);
                String s = order.optString("service", "").trim();
                if (!s.isEmpty()) service = s;
                String c = order.optString("customerFirstName", "").trim();
                if (c.isEmpty()) c = order.optString("customerName", "").trim();
                if (!c.isEmpty()) customer = c;
                String p = order.optString("price", "").trim();
                if (p.isEmpty()) p = order.optString("offeredPrice", "").trim();
                if (!p.isEmpty()) price = p;
                String a = order.optString("generalAddress", "").trim();
                if (a.isEmpty()) a = order.optString("area", "").trim();
                if (!a.isEmpty()) areaLine = a;
                String d = order.optString("description", "").trim();
                if (!d.isEmpty()) desc = d;
                String dt = order.optString("tripDistance", "").trim();
                String dr = order.optString("tripDuration", "").trim();
                if (!dt.isEmpty()) {
                    StringBuilder trip = new StringBuilder(dt).append(" كم");
                    if (!dr.isEmpty()) trip.append(" · ").append(dr).append(" دقيقة");
                    areaLine = (areaLine == null || areaLine.isEmpty()) ? trip.toString() : areaLine + " · " + trip;
                }
            } catch (Exception ignored) {}
        }

        String cur = OverlayConfig.currency(this);
        boolean trial = OverlayConfig.isTrial(this);

        if (service != null && !service.isEmpty()) setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
        if (customer != null && !customer.isEmpty()) setText("tv_customer", customer);
        if (price != null && !price.isEmpty()) setText("tv_price", cur.isEmpty() ? price : cur + " " + price);
        if (areaLine != null && !areaLine.isEmpty()) setText("tv_area", trial ? (areaLine + "  ·  TRIAL") : areaLine);
        if (desc != null && !desc.isEmpty()) setText("tv_description", desc);
    }

    private void promoteForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel("wta_overlay") == null) {
                NotificationChannel c = new NotificationChannel("wta_overlay", "Active Requests", NotificationManager.IMPORTANCE_LOW);
                c.setShowBadge(false);
                nm.createNotificationChannel(c);
            }
            Notification.Builder b = new Notification.Builder(this, "wta_overlay")
                    .setContentTitle("Incoming request active")
                    .setContentText("Tap to open app")
                    .setSmallIcon(android.R.drawable.ic_dialog_info);
            Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (launch != null) {
                b.setContentIntent(android.app.PendingIntent.getActivity(this, 0, launch,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE));
            }
            startForeground(8675309, b.build());
          } catch (Exception e) {
             Log.w(TAG, "Foreground promotion failed: " + e.getMessage());
          }
        }
    }

    private void showOverlay() {
        if (overlayView != null) return;
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT);
        params.gravity = android.view.Gravity.TOP;

        int layoutId = getResources().getIdentifier("layout_floating_request", "layout", getPackageName());
        overlayView = LayoutInflater.from(this).inflate(layoutId, null);
        
        // Ensure buttons have something bound to them immediately (prevents dead clicks)
        bindButton("btn_accept", "accept", "✓ ");
        bindButton("btn_reject", "reject", "✕ ");
        bindButton("btn_negotiate", "negotiate", "💬 ");
        
        // Let user tap background to open app
        overlayView.setOnClickListener(v -> openAppToRequest());
        
        startCountdown(30);

        // Ringtone + call-style vibration, looping until the provider responds
        // or the countdown expires (silent/vibrate mode respected).
        alert.start(this);
        windowManager.addView(overlayView, params);
    }

    private void bindButton(String idName, final String action, String symbol) {
        int id = getResources().getIdentifier(idName, "id", getPackageName());
        View b = overlayView.findViewById(id);
        if (b instanceof Button) {
            b.setOnClickListener(v -> respond(action));
            // Localised label from config (features.overlay.labels.<action>), e.g. Arabic.
            String label = OverlayConfig.label(this, action, ((Button) b).getText().toString());
            ((Button) b).setText(symbol + label);
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
        switch (action) {
            case "accept":
            case "negotiate":
                OverlayActions.openNegotiate(this, orderId);
                stopSelf();
                break;
            case "reject":
            default: // timeout
                stopSelf();
        }
    }

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
