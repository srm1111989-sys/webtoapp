# WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# ML Kit
-keep class com.google.mlkit.** { *; }

# Keep JavaScript bridge
-keepclassmembers class com.webtoapp.template.JavaScriptBridge {
    public *;
}
