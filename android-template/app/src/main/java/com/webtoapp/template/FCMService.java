package com.webtoapp.template;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class FCMService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "webtoapp_notifications";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        // Incoming-request overlay (paid feature, gated + default OFF). A data message
        // carrying an orderId/requestId pops the floating overlay over other apps.
        if ((OverlayConfig.isEnabled(this) || OverlayConfig.isFullscreenEnabled(this)) && !remoteMessage.getData().isEmpty()) {
            java.util.Map<String, String> data = remoteMessage.getData();
            String type = data.get("type");
            String id = data.get("orderId");
            if (id == null) id = data.get("requestId");
            if (id != null && ("request_taken".equals(type) || "request_cancelled".equals(type) || "cancelled".equals(type))) {
                Intent dismiss = new Intent(this, FloatingOverlayService.class)
                        .setAction(FloatingOverlayService.ACTION_DISMISS)
                        .putExtra(FloatingOverlayService.EXTRA_ORDER_ID, id);
                startService(dismiss);
                return;
            }
            // Show the Accept/Reject UI ONLY for the PROVIDER's new-request pushes.
            // The backend marks those with data.overlay="1" (or data.role="provider").
            // Customer-facing status pushes (accepted/negotiation/cancelled) omit it and
            // fall through to a normal notification below — no card/screen for customers.
            String ov = data.get("overlay");
            boolean wantUi = "1".equals(ov) || "true".equalsIgnoreCase(String.valueOf(ov))
                    || "provider".equalsIgnoreCase(String.valueOf(data.get("role")));
            if (wantUi && id != null) {
                boolean fullscreenOn = OverlayConfig.isFullscreenEnabled(this);
                boolean floatingOn = OverlayConfig.isEnabled(this);
                boolean useFullScreen;
                if (fullscreenOn && floatingOn) {
                    // Mode rule ($50 bundle): device locked or screen off → call-style
                    // full screen; unlocked & in use → the less intrusive floating card.
                    // The card also needs the draw-over-apps permission — if the provider
                    // hasn't granted it, fall back to full screen so no request is missed.
                    android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(KEYGUARD_SERVICE);
                    boolean locked = km != null && km.isKeyguardLocked();
                    android.os.PowerManager pm = (android.os.PowerManager) getSystemService(POWER_SERVICE);
                    boolean screenOff = pm != null && !pm.isInteractive();
                    boolean canFloat = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                            || android.provider.Settings.canDrawOverlays(this);
                    useFullScreen = locked || screenOff || !canFloat;
                } else {
                    useFullScreen = fullscreenOn;
                }
                if (useFullScreen) {
                    // Phase 2: full-screen call-style screen (works over lock screen / background).
                    showFullScreenRequest(id, data.get("providerUserId"), data.get("title"), data.get("body"));
                } else {
                    Intent show = new Intent(this, FloatingOverlayService.class)
                            .putExtra(FloatingOverlayService.EXTRA_ORDER_ID, id)
                            .putExtra(FloatingOverlayService.EXTRA_PROVIDER_USER_ID, data.get("providerUserId"));
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(show);
                    else startService(show);
                }
                return;
            }
        }


        String title = "Notification";
        String body = "";

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle() != null
                    ? remoteMessage.getNotification().getTitle() : title;
            body = remoteMessage.getNotification().getBody() != null
                    ? remoteMessage.getNotification().getBody() : body;
        }

        showNotification(title, body, remoteMessage.getData());
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "FCM Token: " + token);
        // Send token to server if needed
    }

    private void showNotification(String title, String body, java.util.Map<String, String> data) {
        Intent intent = new Intent(this, LauncherActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // Carry the FCM data payload so a tap deep-links into the web app
        // (LauncherActivity forwards these extras to WebViewActivity).
        if (data != null) {
            for (java.util.Map.Entry<String, String> de : data.entrySet()) {
                intent.putExtra(de.getKey(), de.getValue());
            }
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        // Custom notification icon if the build shipped one (res/drawable/ic_stat_notification),
        // otherwise a generic fallback. Resolved at runtime so the drawable stays optional.
        int smallIcon = getResources().getIdentifier("ic_stat_notification", "drawable", getPackageName());
        if (smallIcon == 0) smallIcon = android.R.drawable.ic_dialog_info;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(smallIcon)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify((int) System.currentTimeMillis(), builder.build());
    }

    /** Phase-2 full-screen incoming-request screen, launched via a full-screen-intent
     *  notification so it appears over the lock screen / when backgrounded (call-style). */
    private void showFullScreenRequest(String id, String providerUserId, String title, String body) {
        Intent full = new Intent(this, IncomingRequestActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .putExtra(FloatingOverlayService.EXTRA_ORDER_ID, id)
                .putExtra(FloatingOverlayService.EXTRA_PROVIDER_USER_ID, providerUserId == null ? "" : providerUserId);
        PendingIntent pi = PendingIntent.getActivity(this, 43, full,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        final String CH = "webtoapp_incoming_fullscreen";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(CH) == null) {
                NotificationChannel c = new NotificationChannel(CH, "Incoming requests", NotificationManager.IMPORTANCE_HIGH);
                c.setDescription("New service requests");
                nm.createNotificationChannel(c);
            }
        }
        int smallIcon = getResources().getIdentifier("ic_stat_notification", "drawable", getPackageName());
        if (smallIcon == 0) smallIcon = android.R.drawable.ic_dialog_info;
        android.app.Notification n = new NotificationCompat.Builder(this, CH)
                .setSmallIcon(smallIcon)
                .setContentTitle(title != null && !title.isEmpty() ? title : "طلب جديد")
                .setContentText(body != null && !body.isEmpty() ? body : "لديك طلب خدمة جديد")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setFullScreenIntent(pi, true)
                .build();
        getSystemService(NotificationManager.class).notify(43, n);
        // Foreground case: also try launching directly (the full-screen intent covers locked/background).
        try { startActivity(full); } catch (Exception ignored) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "App Notifications",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications from the app");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}
