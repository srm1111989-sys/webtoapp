package com.webtoapp.template.rahatna;

// Rahatna Phase-1 floating overlay (custom feature). SCAFFOLD — not yet wired into the
// shared android-template; integrate feature-gated (features.rahatna_overlay) and synced
// across all 4 pipelines only after testing + confirmed payment. See PLAN.md.
//
// Draws an incoming-service-request card over other apps via TYPE_APPLICATION_OVERLAY.
// Requires the "display over other apps" permission (Settings.canDrawOverlays), which the
// app requests ONLY during Service-Provider registration.

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class FloatingOverlayService extends Service {

    public static final String EXTRA_ORDER_ID = "orderId";
    public static final String EXTRA_PROVIDER_USER_ID = "providerUserId";
    public static final String ACTION_DISMISS = "com.webtoapp.rahatna.OVERLAY_DISMISS";

    private WindowManager windowManager;
    private View overlayView;
    private CountDownTimer timer;
    private String orderId;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // A dismiss broadcast (order taken/cancelled by someone else) tears the overlay down.
        if (intent != null && ACTION_DISMISS.equals(intent.getAction())) {
            String dismissId = intent.getStringExtra(EXTRA_ORDER_ID);
            if (dismissId == null || dismissId.equals(orderId)) { stopSelf(); }
            return START_NOT_STICKY;
        }

        // No overlay permission → nothing to draw. (Registration flow should have requested it.)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        orderId = intent != null ? intent.getStringExtra(EXTRA_ORDER_ID) : null;
        String providerUserId = intent != null ? intent.getStringExtra(EXTRA_PROVIDER_USER_ID) : null;

        showOverlay();
        // TODO(integration): fetch latest details by orderId from Rahatna's endpoint
        //   POST /functions/getOrderDetails {orderId, providerUserId}
        //   then populate the fields below. Blocked on mohamed's test creds + endpoint base URL.
        fetchAndPopulate(orderId, providerUserId);
        return START_NOT_STICKY;
    }

    private void showOverlay() {
        if (overlayView != null) return;
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        overlayView = LayoutInflater.from(this).inflate(
                getResources().getIdentifier("overlay_incoming_request", "layout", getPackageName()), null);

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

        wireButtons();
        startCountdown(30);
        windowManager.addView(overlayView, params);

        // Tap the card body (not the buttons) → open the app to the request.
        overlayView.setOnClickListener(v -> openAppToRequest());
    }

    private void wireButtons() {
        bindButton("btn_accept", () -> respond("accept"));
        bindButton("btn_reject", () -> respond("reject"));
        bindButton("btn_negotiate", () -> respond("negotiate"));
    }

    private void bindButton(String idName, Runnable action) {
        int id = getResources().getIdentifier(idName, "id", getPackageName());
        View b = overlayView.findViewById(id);
        if (b instanceof Button) b.setOnClickListener(v -> action.run());
    }

    private void startCountdown(int seconds) {
        int tvId = getResources().getIdentifier("tv_countdown", "id", getPackageName());
        TextView tv = overlayView.findViewById(tvId);
        timer = new CountDownTimer(seconds * 1000L, 1000L) {
            public void onTick(long ms) { if (tv != null) tv.setText(String.valueOf(ms / 1000)); }
            public void onFinish() { respond("timeout"); }
        }.start();
    }

    private void respond(String action) {
        // TODO(integration): POST the provider's response to Rahatna's endpoint, then open the
        // app on accept/negotiate. "reject"/"timeout" just dismiss. Blocked on the response API.
        if ("accept".equals(action) || "negotiate".equals(action)) openAppToRequest();
        stopSelf();
    }

    private void openAppToRequest() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launch.putExtra(EXTRA_ORDER_ID, orderId); // WebViewActivity routes to the request via JS
            startActivity(launch);
        }
        stopSelf();
    }

    private void fetchAndPopulate(String orderId, String providerUserId) {
        // TODO(integration): call getOrderDetails, then setText on service type / customer name /
        // price / area. Left as a stub until the endpoint base URL + a test order are provided.
    }

    @Override
    public void onDestroy() {
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
