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
        // carrying a request type + orderId pops the floating overlay over other apps;
        // a "taken"/"cancelled" event dismisses it. Falls through to a normal
        // notification for every other app/message.
        if (OverlayConfig.isEnabled(this) && !remoteMessage.getData().isEmpty()) {
            java.util.Map<String, String> data = remoteMessage.getData();
            String type = data.get("type");
            String orderId = data.get("orderId");
            if (orderId != null && ("request_taken".equals(type) || "request_cancelled".equals(type)
                    || "cancelled".equals(type))) {
                Intent dismiss = new Intent(this, FloatingOverlayService.class)
                        .setAction(FloatingOverlayService.ACTION_DISMISS)
                        .putExtra(FloatingOverlayService.EXTRA_ORDER_ID, orderId);
                startService(dismiss);
                return;
            }
            if (orderId != null && ("new_request".equals(type) || "order".equals(type)
                    || "publicRequest".equals(type))) {
                Intent show = new Intent(this, FloatingOverlayService.class)
                        .putExtra(FloatingOverlayService.EXTRA_ORDER_ID, orderId)
                        .putExtra(FloatingOverlayService.EXTRA_PROVIDER_USER_ID, data.get("providerUserId"));
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(show);
                else startService(show);
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

        showNotification(title, body);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "FCM Token: " + token);
        // Send token to server if needed
    }

    private void showNotification(String title, String body) {
        Intent intent = new Intent(this, LauncherActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
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
