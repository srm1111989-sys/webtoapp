package com.webtoapp.template;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

/**
 * Incoming-request alert sound + vibration (Rahatna $50 bundle):
 *  - plays the device's default (pleasant, user-chosen) ringtone, LOOPING
 *    until stop() — i.e. until the provider Accepts/Rejects/Negotiates or the
 *    countdown expires;
 *  - uses the RINGTONE audio usage, so the system automatically silences it in
 *    silent/vibrate mode (spec: respect system settings);
 *  - strong incoming-call-style repeating vibration alongside.
 * One instance per alert; both overlay modes share it.
 */
final class OverlayAlert {

    private MediaPlayer player;
    private Vibrator vibrator;

    void start(Context ctx) {
        startSound(ctx);
        startVibration(ctx);
    }

    void stop() {
        try { if (player != null) { player.stop(); player.release(); } } catch (Exception ignored) {}
        player = null;
        try { if (vibrator != null) vibrator.cancel(); } catch (Exception ignored) {}
        vibrator = null;
    }

    private void startSound(Context ctx) {
        try {
            AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am != null && am.getRingerMode() != AudioManager.RINGER_MODE_NORMAL) return; // silent/vibrate: no sound
            Uri tone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (tone == null) tone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (tone == null) return;
            player = new MediaPlayer();
            player.setDataSource(ctx, tone);
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            player.setLooping(true); // repeat until interaction (spec)
            player.prepare();
            player.start();
        } catch (Exception ignored) {
            stop();
        }
    }

    private void startVibration(Context ctx) {
        try {
            vibrator = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator == null || !vibrator.hasVibrator()) return;
            // Incoming-call cadence: strong pulse, pause, repeat indefinitely.
            long[] pattern = {0, 800, 600, 800, 600};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 1));
            } else {
                vibrator.vibrate(pattern, 1);
            }
        } catch (Exception ignored) {}
    }
}
