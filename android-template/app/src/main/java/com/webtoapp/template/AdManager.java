package com.webtoapp.template;

import android.app.Activity;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import org.json.JSONObject;

/**
 * AdMob: banner, interstitial, and rewarded ads. The play-services-ads SDK is
 * always in the build; ads only activate when the app config supplies unit IDs
 * and the APPLICATION_ID manifest meta-data (injected by CI when AdMob is on).
 * A missing/blank unit ID for a given type just no-ops that type.
 */
public class AdManager {

    private static final String TAG = "AdManager";
    private final Activity activity;
    private final WebView webView;
    private final JSONObject admobConfig;
    private boolean initialized = false;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;

    public AdManager(Activity activity, WebView webView, JSONObject admobConfig) {
        this.activity = activity;
        this.webView = webView;
        this.admobConfig = admobConfig != null ? admobConfig : new JSONObject();
    }

    public void initialize() {
        try {
            MobileAds.initialize(activity, status -> { });
            initialized = true;
            preloadInterstitial();
            preloadRewarded();
            Log.d(TAG, "AdMob initialized");
        } catch (Throwable e) {
            Log.w(TAG, "AdMob init failed: " + e.getMessage());
        }
    }

    public void loadBanner(ViewGroup container) {
        if (!initialized || container == null) return;
        String bannerId = admobConfig.optString("banner_id", "");
        if (bannerId.isEmpty()) return;
        try {
            AdView adView = new AdView(activity);
            adView.setAdUnitId(bannerId);
            adView.setAdSize(AdSize.BANNER);
            adView.loadAd(new AdRequest.Builder().build());
            container.addView(adView);
            Log.d(TAG, "Banner requested");
        } catch (Throwable e) {
            Log.w(TAG, "Banner failed: " + e.getMessage());
        }
    }

    private void preloadInterstitial() {
        final String id = admobConfig.optString("interstitial_id", "");
        if (id.isEmpty()) return;
        try {
            InterstitialAd.load(activity, id, new AdRequest.Builder().build(),
                    new InterstitialAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull InterstitialAd ad) { interstitialAd = ad; }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { interstitialAd = null; }
                    });
        } catch (Throwable e) {
            Log.w(TAG, "Interstitial load failed: " + e.getMessage());
        }
    }

    /** Show an interstitial if one is loaded; otherwise preload for next time. */
    public void showInterstitial() {
        if (!initialized) return;
        activity.runOnUiThread(() -> {
            if (interstitialAd == null) { preloadInterstitial(); return; }
            interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { interstitialAd = null; preloadInterstitial(); }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError e) { interstitialAd = null; preloadInterstitial(); }
            });
            interstitialAd.show(activity);
        });
    }

    private void preloadRewarded() {
        final String id = admobConfig.optString("rewarded_id", "");
        if (id.isEmpty()) return;
        try {
            RewardedAd.load(activity, id, new AdRequest.Builder().build(),
                    new RewardedAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull RewardedAd ad) { rewardedAd = ad; }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { rewardedAd = null; }
                    });
        } catch (Throwable e) {
            Log.w(TAG, "Rewarded load failed: " + e.getMessage());
        }
    }

    /**
     * Show a rewarded ad and call back into the web app. The JS callback (a global
     * function name) is invoked with `true` ONLY after AdMob's onUserEarnedReward
     * fires, otherwise `false` (not ready / dismissed without reward / failed).
     * Example JS:  WebToApp.showRewardedAd('onAdReward')
     */
    public void showRewardedAd(final String callback) {
        activity.runOnUiThread(() -> {
            if (!initialized || rewardedAd == null) {
                preloadRewarded();
                invokeJs(callback, false);
                return;
            }
            final boolean[] earned = {false};
            rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() {
                    rewardedAd = null; preloadRewarded();
                    invokeJs(callback, earned[0]);
                }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError e) {
                    rewardedAd = null; preloadRewarded();
                    invokeJs(callback, false);
                }
            });
            rewardedAd.show(activity, rewardItem -> earned[0] = true);
        });
    }

    private void invokeJs(final String callback, final boolean rewarded) {
        if (callback == null || callback.trim().isEmpty() || webView == null) return;
        final String js = "if (typeof " + callback + " === 'function') { "
                + callback + "(" + (rewarded ? "true" : "false") + "); }";
        activity.runOnUiThread(() -> {
            try { webView.evaluateJavascript(js, null); } catch (Throwable ignored) { }
        });
    }
}
