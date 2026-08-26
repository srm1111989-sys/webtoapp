package com.webtoapp.template;

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
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class IncomingRequestActivity extends Activity {

    private static final String TAG = "IncomingFullScreen";
    private String orderId;
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
            if (km != null) {
                km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                    @Override public void onDismissSucceeded() {
                        enableButtons();
                    }
                });
                // Buttons start disabled — they enable once keyguard is dismissed.
                disableButtons();
            }
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        int layoutId = getResources().getIdentifier("activity_incoming_request", "layout", getPackageName());
        setContentView(layoutId);

        orderId = getIntent() != null ? getIntent().getStringExtra(FloatingOverlayService.EXTRA_ORDER_ID) : null;

        // App logo in the header.
        View logo = view("iv_logo");
        if (logo instanceof ImageView) {
            try { ((ImageView) logo).setImageDrawable(getPackageManager().getApplicationIcon(getPackageName())); } catch (Exception ignored) {}
        }

        // Full-size photo viewer closes on tap anywhere.
        View viewer = view("img_viewer");
        if (viewer != null) viewer.setOnClickListener(v -> v.setVisibility(View.GONE));

        bindButton("btn_accept", "accept", "✓ ");
        bindButton("btn_reject", "reject", "✕ ");
        bindButton("btn_negotiate", "negotiate", "💬 ");
        startCountdown(30);
        // Looping ringtone + call-style vibration until the provider responds
        alert.start(this);

        // Pre-populate UI immediately from Intent extras (all data is available in FCM payload).
        populateFromIntentExtras();
    }

    /** True when at least customer + service were populated from FCM extras. */
    private boolean hasEnoughData() {
        Bundle b = getIntent() != null ? getIntent().getExtras() : null;
        if (b == null) return false;
        String customer = b.getString("customerFirstName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customerName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customer_name");
        if (customer == null || customer.isEmpty()) customer = b.getString("name");

        String service = b.getString("service");
        if (service == null || service.isEmpty()) service = b.getString("type");

        return customer != null && !customer.isEmpty() && service != null && !service.isEmpty();
    }

    /** Fetch order details from the API when FCM data was incomplete. */
    private void fetchOrderDetails(String orderId) {
        if (orderId == null || orderId.isEmpty()) return;
        Bundle b = getIntent() != null ? getIntent().getExtras() : null;
        String apiUrl = b != null ? b.getString("overlayApiUrl") : null;
        if (apiUrl == null || apiUrl.isEmpty()) apiUrl = OverlayConfig.detailsUrl(this);
        if (apiUrl.isEmpty()) return;

        final String targetUrl = apiUrl;
        final String apiKey = (b != null && b.getString("overlayKey") != null && !b.getString("overlayKey").isEmpty())
                ? b.getString("overlayKey")
                : OverlayConfig.overlayKey(this);

        setText("tv_service_type", "Loading...");
        new Thread(() -> {
            String json = null;
            try {
                JSONObject body = new JSONObject()
                        .put("orderId", orderId)
                        .put("requestId", orderId)
                        .put("providerUserId", OverlayConfig.providerUserId(this));
                HttpURLConnection c = (HttpURLConnection) new URL(targetUrl).openConnection();
                c.setRequestMethod("POST");
                c.setRequestProperty("Content-Type", "application/json");
                if (apiKey != null && !apiKey.isEmpty()) c.setRequestProperty("X-Overlay-Key", apiKey);
                c.setDoOutput(true);
                try (java.io.OutputStream os = c.getOutputStream()) {
                    os.write(body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                int code = c.getResponseCode();
                java.io.InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
                if (in != null) {
                    java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
                    byte[] buf = new byte[4096]; int n;
                    while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
                    json = bos.toString("UTF-8");
                }
                c.disconnect();
            } catch (Exception ignored) {}

            final String resp = json;
            main.post(() -> {
                if (resp == null || resp.isEmpty()) {
                    setText("tv_service_type", "New request");
                    return;
                }
                try {
                    JSONObject j = new JSONObject(resp);
                    // Support both flat API responses and nested ones (e.g.
                    // Rahatna wraps fields under "order": { "service": ..., ... }).
                    JSONObject orderObj = j.optJSONObject("order");
                    JSONObject src = orderObj != null ? orderObj : j;
                    String service = OverlayActions.ApiUtil.firstNonNull(src,
                            "serviceType", "service", "service_name", "type", "title");
                    String customer = OverlayActions.ApiUtil.firstNonNull(src,
                            "customerFirstName", "customerName", "customer_name", "name", "customer");
                    String price = OverlayActions.ApiUtil.firstNonNull(src,
                            "price", "offeredPrice", "amount", "total", "cost");
                    String area = OverlayActions.ApiUtil.firstNonNull(src,
                            "generalAddress", "address", "area", "location", "pickupAddress");
                    String desc = OverlayActions.ApiUtil.firstNonNull(src,
                            "description", "notes", "details", "serviceDescription");
                    String dist = OverlayActions.ApiUtil.firstNonNull(src, "tripDistance", "distance");
                    String dur = OverlayActions.ApiUtil.firstNonNull(src, "tripDuration", "duration");

                    String cur = OverlayConfig.currency(this);
                    boolean trial = OverlayConfig.isTrial(this);
                    if (!service.isEmpty()) setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
                    if (!customer.isEmpty()) setText("tv_customer", customer);
                    if (!price.isEmpty()) setText("tv_price", cur.isEmpty() ? price : cur + " " + price);

                    StringBuilder areaLine = new StringBuilder();
                    if (!area.isEmpty()) areaLine.append(area);
                    if (dist != null && !dist.isEmpty()) {
                        areaLine.append(!areaLine.isEmpty() ? " · " : "").append(dist).append(" كم");
                        if (dur != null && !dur.isEmpty()) areaLine.append(" · ").append(dur).append(" دقيقة");
                    }
                    if (areaLine.length() > 0) setText("tv_area", areaLine.toString());
                    if (!desc.isEmpty()) setText("tv_description", desc);
                } catch (Exception e) {
                    Log.w(TAG, "Order details parse failed: " + e.getMessage());
                    setText("tv_service_type", "New request");
                }
            });
        }).start();
    }

    private void populateFromIntentExtras() {
        if (getIntent() == null || getIntent().getExtras() == null) return;
        Bundle b = getIntent().getExtras();
        String service = b.getString("service");
        if (service == null || service.isEmpty()) service = b.getString("type");
        if (service == null || service.isEmpty()) service = "New request";

        String customer = b.getString("customerFirstName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customerName");
        if (customer == null || customer.isEmpty()) customer = b.getString("customer_name");
        if (customer == null || customer.isEmpty()) customer = b.getString("name");

        String price = b.getString("price");
        if (price == null || price.isEmpty()) price = b.getString("offeredPrice");
        if (price == null || price.isEmpty()) price = b.getString("amount");

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
        String orderJson = b.getString("order");
        if ((service != null && service.isEmpty()) && orderJson != null && !orderJson.isEmpty()) {
            try {
                JSONObject order = new JSONObject(orderJson);
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
        if (areaLine != null && !areaLine.isEmpty()) setText("tv_area", areaLine);
        if (desc != null && !desc.isEmpty()) setText("tv_description", desc);

        // Coordinates for map (supports customerLat, startLat, pickupLat, lat)
        try {
            double pLat = parseCoord(b, "customerLat", "customer_lat", "startLat", "pickupLat", "pickup_lat", "lat", "latitude");
            double pLng = parseCoord(b, "customerLng", "customer_lng", "startLng", "pickupLng", "pickup_lng", "lng", "longitude");
            double dLat = parseCoord(b, "endLat", "destLat", "dest_lat", "dropLat", "dropoffLat");
            double dLng = parseCoord(b, "endLng", "destLng", "dest_lng", "dropLng", "dropoffLng");
            if (!Double.isNaN(pLat) && !Double.isNaN(pLng)) {
                showMap(pLat, pLng, dLat, dLng);
            }
        } catch (Exception ignored) {}

        // Single or multiple description images
        List<String> images = new ArrayList<>();
        String[] singleKeys = {"descriptionImage", "image", "photo", "imageUrl", "img"};
        for (String k : singleKeys) {
            String u = b.getString(k);
            if (u != null && (u.startsWith("http://") || u.startsWith("https://")) && !images.contains(u)) {
                images.add(u);
            }
        }
        String[] multiKeys = {"descriptionImages", "images", "photos"};
        for (String k : multiKeys) {
            String multi = b.getString(k);
            if (multi != null && !multi.isEmpty()) {
                try {
                    JSONArray arr = new JSONArray(multi);
                    for (int i = 0; i < arr.length() && images.size() < 3; i++) {
                        Object v = arr.opt(i);
                        String u = null;
                        if (v instanceof String) u = (String) v;
                        else if (v instanceof JSONObject) {
                            u = ((JSONObject) v).optString("url", ((JSONObject) v).optString("src", null));
                        }
                        if (u != null && (u.startsWith("http://") || u.startsWith("https://")) && !images.contains(u)) {
                            images.add(u);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
        if (!images.isEmpty()) {
            loadThumbnails(images);
        }
    }

    private static double parseCoord(Bundle b, String... keys) {
        for (String k : keys) {
            String val = b.getString(k);
            if (val != null && !val.isEmpty()) {
                try {
                    double d = Double.parseDouble(val);
                    if (!Double.isNaN(d)) return d;
                } catch (Exception ignored) {}
            }
        }
        return Double.NaN;
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
        alert.stop();
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (km != null && km.isKeyguardLocked()) {
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override public void onDismissSucceeded() {
                    doRespond(action);
                }
                @Override public void onDismissError() {
                    doRespond(action);
                }
            });
        } else {
            doRespond(action);
        }
    }

    private void doRespond(String action) {
        switch (action) {
            case "accept":
            case "negotiate":
                OverlayActions.openNegotiate(this, orderId);
                finish();
                break;
            case "reject":
            default: // timeout
                finish();
        }
    }

    private void disableButtons() {
        setButtonsEnabled(false);
    }

    private void enableButtons() {
        setButtonsEnabled(true);
    }

    private void setButtonsEnabled(boolean enabled) {
        int[] ids = {
            getResources().getIdentifier("btn_accept", "id", getPackageName()),
            getResources().getIdentifier("btn_reject", "id", getPackageName()),
            getResources().getIdentifier("btn_negotiate", "id", getPackageName()),
        };
        for (int id : ids) {
            if (id == 0) continue;
            View v = findViewById(id);
            if (v != null) {
                v.setEnabled(enabled);
                v.setAlpha(enabled ? 1.0f : 0.5f);
            }
        }
    }

    private void setText(String idName, String value) {
        View v = view(idName);
        if (v instanceof TextView && value != null && !value.isEmpty()) ((TextView) v).setText(value);
    }

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
                      + "var line=L.polyline([p,d],{color:'#2563EB',weight:4,dashArray:'8 6'}).addTo(map);"
                      + "map.fitBounds(L.latLngBounds([p,d]).pad(0.3));"
                      + "fetch('https://router.project-osrm.org/route/v1/driving/'+p[1]+','+p[0]+';'+d[1]+','+d[0]+'?overview=full&geometries=geojson')"
                      + ".then(function(r){return r.json()}).then(function(j){"
                      + "if(j.routes&&j.routes[0]){map.removeLayer(line);"
                      + "var route=L.geoJSON(j.routes[0].geometry,{style:{color:'#2563EB',weight:5,opacity:0.9}}).addTo(map);"
                      + "map.fitBounds(route.getBounds().pad(0.15));}"
                      + "}).catch(function(){});"
                    : "map.setView(p,15);")
                + "</script></body></html>";
        wv.getSettings().setJavaScriptEnabled(true);
        wv.getSettings().setDomStorageEnabled(true);
        wv.setVisibility(View.VISIBLE);
        wv.loadDataWithBaseURL("https://unpkg.com/", html, "text/html", "UTF-8", null);
    }

    @Override
    protected void onDestroy() {
        if (timer != null) timer.cancel();
        alert.stop();
        super.onDestroy();
    }
}
