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

    /** True only when the paid floating-overlay feature is enabled for this app. */
    public static boolean isEnabled(Context ctx) {
        return features(ctx).optBoolean("incoming_request_overlay", false);
    }

    /** True when the paid FULL-SCREEN incoming-request feature (Phase 2) is enabled. */
    public static boolean isFullscreenEnabled(Context ctx) {
        return features(ctx).optBoolean("incoming_request_fullscreen", false);
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
        return appUrl + "/functions/getOrderDetailsSecure";
    }

    /**
     * Optional API key sent as the X-Overlay-Key header on the details request.
     * The provider confirmed the production endpoint will require this (and the URL
     * will change) — both are config-driven so no rebuild is needed to switch.
     * features.overlay.overlay_key (or "api_key"); empty means no header is sent.
     */
    public static String overlayKey(Context ctx) {
        JSONObject o = load(ctx);
        String k = o.optString("overlay_key", "");
        if (k.isEmpty()) k = o.optString("api_key", "");
        return k;
    }

    /** Optional currency prefix for the price on the card (features.overlay.currency); empty = no prefix. */
    public static String currency(Context ctx) {
        return load(ctx).optString("currency", "");
    }

    /** Localised button/label text from features.overlay.labels.<key> (e.g. Arabic); falls back to def. */
    public static String label(Context ctx, String key, String def) {
        JSONObject labels = load(ctx).optJSONObject("labels");
        if (labels == null) return def;
        String v = labels.optString(key, "");
        return v.isEmpty() ? def : v;
    }

    /**
     * Trial mode (features.overlay.trial). When true the overlay is fully functional
     * for testing but shows a visible TRIAL marker. Flip to false (or record the paid
     * order) to deliver the clean version. Default false.
     */
    public static boolean isTrial(Context ctx) {
        return load(ctx).optBoolean("trial", false);
    }

    /**
     * The provider's user id, needed by getOrderDetails to authenticate. The FCM push
     * does NOT carry it, so resolve it in priority order:
     *   1. runtime value stored by the web app after login (SharedPreferences "overlay",
     *      key "provider_user_id" — settable via the JS bridge), then
     *   2. a config default (features.overlay.provider_user_id) — handy for testing.
     * Empty string if unknown (the request then goes out without it).
     */
    public static String providerUserId(Context ctx) {
        String stored = ctx.getSharedPreferences("overlay", Context.MODE_PRIVATE)
                .getString("provider_user_id", "");
        if (stored != null && !stored.isEmpty()) return stored;
        return load(ctx).optString("provider_user_id", "");
    }

    /** First non-empty string value among the given keys (config-mapped key first,
     *  then common API spellings — Rahatna sends customerFirstName, t310). */
    public static String firstNonEmpty(org.json.JSONObject o, String... keys) {
        for (String k : keys) {
            if (k == null || k.isEmpty()) continue;
            String v = o.optString(k, "");
            if (!v.isEmpty() && !"null".equals(v)) return v;
        }
        return "";
    }
}
