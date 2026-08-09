package com.webtoapp.template;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Real backend actions for the incoming-request feature (Rahatna $50 bundle,
 * 2026-08-10). Shared by BOTH the floating overlay and the full-screen
 * activity so behaviour is identical:
 *
 *  - accept():   POST acceptOrder {orderId, providerUserId} with X-Overlay-Key.
 *                Success -> close + open the app at the order. Failure -> show
 *                the backend's (Arabic) message, keep the popup open.
 *  - reject():   POST rejectOrder (returns the order to the public pool),
 *                popup closes immediately, app not opened.
 *  - negotiate():open the app straight to /order-details?id=..&action=negotiate.
 *
 * Endpoints come from features.overlay.accept_url / reject_url when set;
 * otherwise they are derived from details_url by swapping the function name
 * (his backend exposes them side by side under /functions/).
 */
public final class OverlayActions {

    public interface Callback {
        void onSuccess();
        /** message = backend-provided (Arabic) text when available, else generic. */
        void onFailure(String message);
    }

    private OverlayActions() {}

    private static String derived(Context ctx, String cfgKey, String fnName) {
        try {
            String explicit = OverlayConfig.load(ctx).optString(cfgKey, "");
            if (!explicit.isEmpty()) return explicit;
        } catch (Exception ignored) {}
        String details = OverlayConfig.detailsUrl(ctx);
        if (details.isEmpty()) return "";
        int i = details.lastIndexOf('/');
        return i > 0 ? details.substring(0, i + 1) + fnName : "";
    }

    public static String acceptUrl(Context ctx) { return derived(ctx, "accept_url", "acceptOrder"); }
    public static String rejectUrl(Context ctx) { return derived(ctx, "reject_url", "rejectOrder"); }

    public static void accept(Context ctx, String orderId, String providerUserId, Callback cb) {
        post(ctx, acceptUrl(ctx), orderId, providerUserId, cb);
    }

    /** Fire the reject and invoke cb.onSuccess() immediately (spec: close at once). */
    public static void reject(Context ctx, String orderId, String providerUserId) {
        post(ctx, rejectUrl(ctx), orderId, providerUserId, null);
    }

    /** Open the app directly on the negotiation view for this order. */
    public static void openNegotiate(Context ctx, String orderId) {
        openApp(ctx, orderId, "negotiate");
    }

    /** Open the app at the order details (used after a successful accept). */
    public static void openOrder(Context ctx, String orderId) {
        openApp(ctx, orderId, null);
    }

    private static void openApp(Context ctx, String orderId, String action) {
        try {
            Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            if (launch == null) return;
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launch.putExtra(FloatingOverlayService.EXTRA_ORDER_ID, orderId);
            // The web layer reads this path and navigates to it after load.
            String path = "/order-details?id=" + Uri.encode(orderId == null ? "" : orderId);
            if (action != null) path += "&action=" + action;
            launch.putExtra("overlay_open_path", path);
            ctx.startActivity(launch);
        } catch (Exception ignored) {}
    }

    private static void post(Context ctx, String url, String orderId, String providerUserId, Callback cb) {
        final Handler main = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            String failMsg = null;
            boolean ok = false;
            try {
                if (url == null || url.isEmpty()) throw new IllegalStateException("no endpoint");
                JSONObject body = new JSONObject()
                        .put("orderId", orderId == null ? "" : orderId)
                        .put("providerUserId", providerUserId == null ? "" : providerUserId);
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                String key = OverlayConfig.overlayKey(ctx);
                if (!key.isEmpty()) c.setRequestProperty("X-Overlay-Key", key);
                c.setConnectTimeout(10000);
                c.setReadTimeout(10000);
                c.setDoOutput(true);
                try (OutputStream os = c.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
                int code = c.getResponseCode();
                String resp = ApiUtil.readBody(c);
                if (code == 200) {
                    ok = true;
                } else {
                    // Surface the backend's own (Arabic) message when present.
                    try { failMsg = new JSONObject(resp).optString("message", null); } catch (Exception ignored) {}
                }
                c.disconnect();
            } catch (Exception e) {
                failMsg = null;
            }
            if (cb != null) {
                final boolean fOk = ok;
                final String fMsg = failMsg;
                main.post(() -> {
                    if (fOk) cb.onSuccess();
                    else cb.onFailure(fMsg != null && !fMsg.isEmpty()
                            ? fMsg
                            : OverlayConfig.label(ctx, "action_failed", "تعذر تنفيذ الطلب، حاول مرة أخرى"));
                });
            }
        }).start();
    }

    /** Tiny shared reader so error bodies are also parsed. */
    static final class ApiUtil {
        static String readBody(HttpURLConnection c) {
            try {
                java.io.InputStream in = c.getResponseCode() < 400 ? c.getInputStream() : c.getErrorStream();
                if (in == null) return "";
                java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
                return bos.toString("UTF-8");
            } catch (Exception e) {
                return "";
            }
        }
    }
}
