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
            if (km != null) km.requestDismissKeyguard(this, null);
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

        // Pre-populate UI immediately from Intent extras (FCM data message contains all order fields)
        populateFromIntentExtras();
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
        String cur = OverlayConfig.currency(this);
        boolean trial = OverlayConfig.isTrial(this);

        if (service != null && !service.isEmpty()) setText("tv_service_type", trial ? ("[TRIAL] " + service) : service);
        if (customer != null && !customer.isEmpty()) setText("tv_customer", customer);
        if (price != null && !price.isEmpty()) setText("tv_price", cur.isEmpty() ? price : cur + " " + price);
        if (areaLine != null && !areaLine.isEmpty()) setText("tv_area", areaLine);
        if (desc != null && !desc.isEmpty()) setText("tv_description", desc);

        // Coordinates for map
        try {
            double pLat = parseCoord(b, "startLat", "pickupLat", "pickup_lat", "lat", "latitude");
            double pLng = parseCoord(b, "startLng", "pickupLng", "pickup_lng", "lng", "longitude");
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
