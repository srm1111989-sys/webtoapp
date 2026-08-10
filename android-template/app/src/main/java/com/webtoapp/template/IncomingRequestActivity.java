package com.webtoapp.template;

// Incoming-request FULL-SCREEN screen (Phase 2, paid feature). Unlike the floating
// overlay card, this is a full-screen activity launched via a high-priority
// full-screen-intent notification, so it appears over the lock screen and when the
// app is backgrounded/closed — the sanctioned Android way to pop call-style UI from
// the background (no SYSTEM_ALERT_WINDOW needed). Feature-gated by
// features.incoming_request_fullscreen (default OFF). Config-driven, reuses the same
// features.overlay block (details_url, labels, field maps, currency, trial, etc.).
//
// Rahatna $50 bundle: live Accept/Reject/Negotiate via OverlayActions, looping
// ringtone+vibration via OverlayAlert, request photos (≤3 tappable thumbnails +
// full-size viewer), pickup→destination OpenStreetMap (Leaflet, no API key),
// dark/light palette via values-night, auto-close when the order is gone (403/404).

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class IncomingRequestActivity extends Activity {

    private static final String TAG = "IncomingFullScreen";
    private String orderId;
    private String providerUserId;
    private boolean actionInFlight = false;
    private CountDownTimer timer;
    private final OverlayAlert alert = new OverlayAlert();
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over the lock screen and turn the screen on (call-style).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        int layoutId = getResources().getIdentifier("activity_incoming_request", "layout", getPackageName());
        setContentView(layoutId);

        orderId = getIntent() != null ? getIntent().getStringExtra(FloatingOverlayService.EXTRA_ORDER_ID) : null;
        String pushProvider = getIntent() != null ? getIntent().getStringExtra(FloatingOverlayService.EXTRA_PROVIDER_USER_ID) : null;
        providerUserId = (pushProvider != null && !pushProvider.isEmpty())
                ? pushProvider : OverlayConfig.providerUserId(this);

        // App logo in the header.
        View logo = view("iv_logo");
        if (logo instanceof ImageView) {
            try { ((ImageView) logo).setImageDrawable(getPackageManager().getApplicationIcon(getPackageName())); } catch (Exception ignored) {}
        }

        // Full-size photo viewer closes on tap anywhere.
        View viewer = view("img_viewer");
        if (viewer != null) viewer.setOnClickListener(v -> v.setVisibility(View.GONE));

        bindButton("btn_accept", "accept", "✓ ");
        bindButton("btn_reject", "reject", "✗ ");
        bindButton("btn_negotiate", "negotiate", "💬 ");
        startCountdown(30);
        // Looping ringtone + call-style vibration until the provider responds
        // (silent/vibrate mode respected) — shared with the floating card.
        alert.start(this);
        fetchAndPopulate(orderId, providerUserId);
    }

    private View view(String idName) {
        int id = getResources().getIdentifier(idName, "id", getPackageName());
        return id != 0 ? findViewById(id) : null;
    }

    private void bindButton(String idName, final String action, String symbol) {
        View b = view(idName);
        if (b instanceof Button) {
            b.setOnClickListener(v -> respond(action));
            String label = OverlayConfig.label(this, action, ((Button) b).getText().toString());
            ((Button) b).setText(symbol + label);
        }
    }

    private void startCountdown(int seconds) {
        final TextView tv = (TextView) view("tv_countdown");
        timer = new CountDownTimer(seconds * 1000L, 1000L) {
            public void onTick(long ms) { if (tv != null) tv.setText(String.valueOf(ms / 1000)); }
            public void onFinish() { respond("timeout"); }
        }.start();
    }

    private void respond(String action) {
        // First interaction silences the ringtone/vibration.
        alert.stop();
        // Same live-action semantics as the floating card ($50 bundle spec):
        if (actionInFlight) return;
        switch (action) {
            case "accept":
                actionInFlight = true;
                setText("tv_status", OverlayConfig.label(this, "accepting", "جارٍ قبول الطلب…"));
                OverlayActions.accept(this, orderId, providerUserId, new OverlayActions.Callback() {
                    @Override public void onSuccess() {
                        OverlayActions.openOrder(IncomingRequestActivity.this, orderId);
                        finish();
                    }
                    @Override public void onFailure(String message) {
                        actionInFlight = false;
                        setText("tv_status", message);
                    }
                });
                break;
            case "reject":
                OverlayActions.reject(this, orderId, providerUserId);
                finish();
                break;
            case "negotiate":
                OverlayActions.openNegotiate(this, orderId);
                finish();
                break;
            default: // timeout
                finish();
        }
    }

    private void setText(String idName, String value) {
        View v = view(idName);
        if (v instanceof TextView && value != null && !value.isEmpty()) ((TextView) v).setText(value);
    }

    /** Fetch latest order details by ID (off the main thread) and populate the screen. */
    private void fetchAndPopulate(final String orderId, final String providerUserId) {
        if (orderId == null) return;
        new Thread(() -> {
            try {
                JSONObject cfg = OverlayConfig.load(this);
                String url = OverlayConfig.detailsUrl(this);
                if (url.isEmpty()) return;
                JSONObject reqBody = new JSONObject()
                        .put("orderId", orderId)
                        .put("providerUserId", providerUserId == null ? "" : providerUserId);
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                String overlayKey = OverlayConfig.overlayKey(this);
                if (!overlayKey.isEmpty()) c.setRequestProperty("X-Overlay-Key", overlayKey);
                c.setConnectTimeout(10000); c.setReadTimeout(10000); c.setDoOutput(true);
                try (OutputStream os = c.getOutputStream()) { os.write(reqBody.toString().getBytes("UTF-8")); }
                int code = c.getResponseCode();
                if (code == 403 || code == 404) {
                    // Order gone / not for this provider (e.g. already taken): close silently.
                    main.post(this::closeQuiet);
                    return;
                }
                if (code / 100 != 2) return;
                StringBuilder sb = new StringBuilder();
                try (InputStream is = c.getInputStream()) {
                    byte[] buf = new byte[4096]; int n;
                    while ((n = is.read(buf)) != -1) sb.append(new String(buf, 0, n, "UTF-8"));
                }
                JSONObject resp = new JSONObject(sb.toString());
                JSONObject order = resp.optJSONObject("order");
                if (order == null) order = resp;
                final String service = order.optString(cfg.optString("f_service", "service"), "New request");
                final String customer = OverlayConfig.firstNonEmpty(order,
                        cfg.optString("f_customer", "customerName"),
                        "customerName", "customerFirstName", "customer_name", "firstName", "name");
                final String price = order.optString(cfg.optString("f_price", "price"), "");
                final String area = order.optString(cfg.optString("f_area", "area"), "");
                final String desc = order.optString(cfg.optString("f_description", "description"), "");
                final String cur = OverlayConfig.currency(this);
                final boolean trial = OverlayConfig.isTrial(this);
                final List<String> images = imageUrls(order, cfg);
                final double pLat = coord(order, cfg, "f_pickup_lat", PICKUP_LAT);
                final double pLng = coord(order, cfg, "f_pickup_lng", PICKUP_LNG);
                final double dLat = coord(order, cfg, "f_dest_lat", DEST_LAT);
                final double dLng = coord(order, cfg, "f_dest_lng", DEST_LNG);
                main.post(() -> {
                    setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
                    setText("tv_customer", customer);
                    setText("tv_price", price.isEmpty() ? "" : (cur.isEmpty() ? price : cur + " " + price));
                    setText("tv_area", area);
                    setText("tv_description", desc);
                    showMap(pLat, pLng, dLat, dLng);
                });
                loadThumbnails(images);
            } catch (Exception e) {
                Log.w(TAG, "getOrderDetails failed: " + e.getMessage());
            }
        }).start();
    }

    private void closeQuiet() {
        alert.stop();
        finish();
    }

    // ── Request photos ──────────────────────────────────────────────────────

    /** Image URLs from the order (config f_images, default descriptionImages);
     *  accepts an array of strings or of objects with url/src. Max 3 (spec). */
    private static List<String> imageUrls(JSONObject order, JSONObject cfg) {
        List<String> out = new ArrayList<>();
        String[] keys = {cfg.optString("f_images", "descriptionImages"), "images", "photos"};
        for (String k : keys) {
            JSONArray arr = order.optJSONArray(k);
            if (arr == null) continue;
            for (int i = 0; i < arr.length() && out.size() < 3; i++) {
                Object v = arr.opt(i);
                String u = null;
                if (v instanceof String) u = (String) v;
                else if (v instanceof JSONObject) {
                    u = ((JSONObject) v).optString("url", ((JSONObject) v).optString("src", null));
                }
                if (u != null && (u.startsWith("http://") || u.startsWith("https://"))) out.add(u);
            }
            if (!out.isEmpty()) break;
        }
        return out;
    }

    /** Download each photo (already on a background thread when called from fetch;
     *  spawns its own threads to stay safe) and show tappable thumbnails. */
    private void loadThumbnails(List<String> urls) {
        if (urls == null || urls.isEmpty()) return;
        final String[] slots = {"iv_img1", "iv_img2", "iv_img3"};
        for (int i = 0; i < urls.size() && i < slots.length; i++) {
            final String url = urls.get(i);
            final String slot = slots[i];
            new Thread(() -> {
                Bitmap bmp = downloadBitmap(url);
                if (bmp == null) return;
                final Bitmap fBmp = bmp;
                main.post(() -> {
                    View row = view("row_images");
                    View iv = view(slot);
                    if (!(iv instanceof ImageView)) return;
                    if (row != null) row.setVisibility(View.VISIBLE);
                    iv.setVisibility(View.VISIBLE);
                    ((ImageView) iv).setImageBitmap(fBmp);
                    iv.setOnClickListener(v -> showFullImage(fBmp));
                });
            }).start();
        }
    }

    private void showFullImage(Bitmap bmp) {
        View viewer = view("img_viewer");
        View full = view("iv_full");
        if (viewer == null || !(full instanceof ImageView)) return;
        ((ImageView) full).setImageBitmap(bmp);
        viewer.setVisibility(View.VISIBLE);
    }

    /** Download + decode, downsampled to ~1280px so provider photos can't OOM. */
    private static Bitmap downloadBitmap(String url) {
        try {
            byte[] data;
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(10000); c.setReadTimeout(15000);
            try (InputStream is = c.getInputStream()) {
                java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[8192]; int n;
                while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
                data = bos.toByteArray();
            }
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, opts);
            int sample = 1;
            while (opts.outWidth / sample > 1280 || opts.outHeight / sample > 1280) sample *= 2;
            opts = new BitmapFactory.Options();
            opts.inSampleSize = sample;
            return BitmapFactory.decodeByteArray(data, 0, data.length, opts);
        } catch (Exception e) {
            Log.w(TAG, "image load failed: " + e.getMessage());
            return null;
        }
    }

    // ── Pickup → destination map (OpenStreetMap/Leaflet, no API key) ────────

    private static final String[] PICKUP_LAT = {"pickupLatitude", "pickup_lat", "pickupLat",
            "pickup.lat", "pickup.latitude", "location.lat", "location.latitude", "latitude", "lat"};
    private static final String[] PICKUP_LNG = {"pickupLongitude", "pickup_lng", "pickupLng",
            "pickup.lng", "pickup.longitude", "location.lng", "location.longitude", "longitude", "lng"};
    private static final String[] DEST_LAT = {"destinationLatitude", "destination_lat", "destLat",
            "destination.lat", "destination.latitude", "dropoff.lat", "dropoffLatitude", "dropLatitude"};
    private static final String[] DEST_LNG = {"destinationLongitude", "destination_lng", "destLng",
            "destination.lng", "destination.longitude", "dropoff.lng", "dropoffLongitude", "dropLongitude"};

    /** Read a coordinate: config-mapped key first (supports dotted paths), then candidates. */
    private static double coord(JSONObject order, JSONObject cfg, String cfgKey, String[] candidates) {
        String override = cfg.optString(cfgKey, "");
        if (!override.isEmpty()) {
            double v = pathDouble(order, override);
            if (!Double.isNaN(v)) return v;
        }
        for (String k : candidates) {
            double v = pathDouble(order, k);
            if (!Double.isNaN(v)) return v;
        }
        return Double.NaN;
    }

    /** optDouble with "a.b" nested-object path support. */
    private static double pathDouble(JSONObject o, String path) {
        try {
            String[] parts = path.split("\\.");
            JSONObject cur = o;
            for (int i = 0; i < parts.length - 1; i++) {
                cur = cur.optJSONObject(parts[i]);
                if (cur == null) return Double.NaN;
            }
            return cur.optDouble(parts[parts.length - 1], Double.NaN);
        } catch (Exception e) {
            return Double.NaN;
        }
    }

    /** Pickup marker + (when present) destination marker with a route line between
     *  them, on OpenStreetMap tiles via Leaflet — no API key needed. Map stays
     *  hidden when the order carries no coordinates. */
    private void showMap(double pLat, double pLng, double dLat, double dLng) {
        if (Double.isNaN(pLat) || Double.isNaN(pLng)) return;
        View v = view("wv_map");
        if (!(v instanceof WebView)) return;
        WebView wv = (WebView) v;
        boolean hasDest = !Double.isNaN(dLat) && !Double.isNaN(dLng);
        String html = "<!DOCTYPE html><html><head>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'>"
                + "<script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script>"
                + "<style>html,body,#m{height:100%;margin:0}</style></head>"
                + "<body><div id='m'></div><script>"
                + "var map=L.map('m',{zoomControl:false,attributionControl:false,dragging:false,tap:false});"
                + "L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);"
                + "var p=[" + pLat + "," + pLng + "];L.marker(p).addTo(map);"
                + (hasDest
                    ? "var d=[" + dLat + "," + dLng + "];L.marker(d).addTo(map);"
                      + "L.polyline([p,d],{color:'#2563EB',weight:4,dashArray:'8 6'}).addTo(map);"
                      + "map.fitBounds(L.latLngBounds([p,d]).pad(0.3));"
                    : "map.setView(p,15);")
                + "</script></body></html>";
        wv.getSettings().setJavaScriptEnabled(true);
        wv.setVisibility(View.VISIBLE);
        wv.loadDataWithBaseURL("https://webtoapp.map/", html, "text/html", "UTF-8", null);
    }

    @Override
    protected void onDestroy() {
        if (timer != null) timer.cancel();
        alert.stop();
        super.onDestroy();
    }
}
