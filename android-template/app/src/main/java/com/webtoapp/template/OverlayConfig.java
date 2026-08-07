package com.webtoapp.template;

// Reads config.json from assets (the same file LauncherActivity loads) so the
// FCM service and the overlay service can check the feature flag + overlay config
// without an Activity. Feature-gated: incoming_request_overlay defaults OFF.

import android.content.Context;

import org.json.JSONObject;

import java.io.InputStream;

public final class OverlayConfig {
    private OverlayConfig() {}

    private static JSONObject config(Context ctx) {
        try (InputStream is = ctx.getAssets().open("config.json")) {
            byte[] buf = new byte[is.available()];
            int read = is.read(buf);
            return new JSONObject(new String(buf, 0, Math.max(read, 0), "UTF-8"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    private static JSONObject features(Context ctx) {
        JSONObject f = config(ctx).optJSONObject("features");
        return f != null ? f : new JSONObject();
    }

    /** True only when the paid feature is enabled for this app. */
    public static boolean isEnabled(Context ctx) {
        return features(ctx).optBoolean("incoming_request_overlay", false);
    }

    /** The features.overlay config object (field mappings); empty if unset. */
    public static JSONObject load(Context ctx) {
        JSONObject overlay = features(ctx).optJSONObject("overlay");
        return overlay != null ? overlay : new JSONObject();
    }

    /**
     * Full URL of the order-details endpoint. Uses features.overlay.details_url if set,
     * otherwise defaults to the app's own domain + "/functions/getOrderDetails"
     * (Base44 apps serve functions from the app origin — verified for Rahatna).
     */
    public static String detailsUrl(Context ctx) {
        String explicit = load(ctx).optString("details_url", "");
        if (!explicit.isEmpty()) return explicit;
        String appUrl = config(ctx).optString("app_url", "");
        if (appUrl.isEmpty()) return "";
        if (appUrl.endsWith("/")) appUrl = appUrl.substring(0, appUrl.length() - 1);
        return appUrl + "/functions/getOrderDetails";
    }
}
