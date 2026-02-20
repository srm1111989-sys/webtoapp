package com.webtoapp.template;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.json.JSONObject;

/**
 * Manages AdMob banner, interstitial, and rewarded ads.
 * Ad dependencies are conditionally included at build time.
 */
public class AdManager {

    private static final String TAG = "AdManager";
    private final Activity activity;
    private final JSONObject admobConfig;
    private boolean initialized = false;

    public AdManager(Activity activity, JSONObject admobConfig) {
        this.activity = activity;
        this.admobConfig = admobConfig;
    }

    public void initialize() {
        try {
            // Dynamic class loading to avoid crashes when AdMob is not included
            Class<?> mobileAds = Class.forName("com.google.android.gms.ads.MobileAds");
            mobileAds.getMethod("initialize", android.content.Context.class)
                    .invoke(null, activity);
            initialized = true;
            Log.d(TAG, "AdMob initialized");
        } catch (Exception e) {
            Log.w(TAG, "AdMob not available: " + e.getMessage());
        }
    }

    public void loadBanner(ViewGroup container) {
        if (!initialized) return;
        String bannerId = admobConfig.optString("banner_id", "");
        if (bannerId.isEmpty()) return;

        try {
            Class<?> adViewClass = Class.forName("com.google.android.gms.ads.AdView");
            Class<?> adSizeClass = Class.forName("com.google.android.gms.ads.AdSize");
            Class<?> adRequestClass = Class.forName("com.google.android.gms.ads.AdRequest");
            Class<?> adRequestBuilderClass = Class.forName("com.google.android.gms.ads.AdRequest$Builder");

            Object adView = adViewClass.getConstructor(android.content.Context.class).newInstance(activity);
            adViewClass.getMethod("setAdUnitId", String.class).invoke(adView, bannerId);

            Object bannerSize = adSizeClass.getField("BANNER").get(null);
            adViewClass.getMethod("setAdSize", adSizeClass).invoke(adView, bannerSize);

            Object builder = adRequestBuilderClass.getConstructor().newInstance();
            Object request = adRequestBuilderClass.getMethod("build").invoke(builder);
            adViewClass.getMethod("loadAd", adRequestClass).invoke(adView, request);

            container.addView((android.view.View) adView);
            Log.d(TAG, "Banner ad loaded");
        } catch (Exception e) {
            Log.w(TAG, "Failed to load banner: " + e.getMessage());
        }
    }

    public void showInterstitial() {
        if (!initialized) return;
        String interstitialId = admobConfig.optString("interstitial_id", "");
        if (interstitialId.isEmpty()) return;
        Log.d(TAG, "Interstitial ad requested");
        // Interstitial loading requires async callback pattern - simplified here
    }
}
