package com.webtoapp.template;

// Reads config.json from assets (the same file LauncherActivity loads) so the
// FCM service and the overlay service can check the feature flag + overlay config
// without an Activity. Feature-gated: incoming_request_overlay defaults OFF.

import android.content.Context;

import org.json.JSONObject;

import java.io.InputStream;

public final class OverlayConfig {
    private OverlayConfig() {}

    private static JSONObject features(Context ctx) {
        try (InputStream is = ctx.getAssets().open("config.json")) {
            byte[] buf = new byte[is.available()];
            int read = is.read(buf);
            JSONObject config = new JSONObject(new String(buf, 0, Math.max(read, 0), "UTF-8"));
            JSONObject f = config.optJSONObject("features");
            return f != null ? f : new JSONObject();
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    /** True only when the paid feature is enabled for this app. */
    public static boolean isEnabled(Context ctx) {
        return features(ctx).optBoolean("incoming_request_overlay", false);
    }

    /** The features.overlay config object (details_url, field mappings); empty if unset. */
    public static JSONObject load(Context ctx) {
        JSONObject overlay = features(ctx).optJSONObject("overlay");
        return overlay != null ? overlay : new JSONObject();
    }
}
