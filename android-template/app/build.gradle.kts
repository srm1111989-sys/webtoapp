plugins {
    id("com.android.application")
}

// Conditionally apply Google Services plugin
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.webtoapp.template"
    compileSdk = 34

    defaultConfig {
        applicationId = project.findProperty("APP_PACKAGE_NAME")?.toString() ?: "com.webtoapp.template"
        minSdk = 24
        targetSdk = 34
        val vc = (project.findProperty("VERSION_CODE")?.toString()?.toIntOrNull() ?: System.getenv("VERSION_CODE")?.toIntOrNull() ?: 1)
        versionCode = vc
        versionName = "1.0.$vc"

        manifestPlaceholders["hostName"] = project.findProperty("APP_HOST") ?: "example.com"
        manifestPlaceholders["defaultUrl"] = project.findProperty("APP_URL") ?: "https://example.com"

        resValue("string", "app_name", project.findProperty("APP_NAME")?.toString() ?: "WebToApp")
        resValue("color", "primaryColor", project.findProperty("PRIMARY_COLOR")?.toString() ?: "#2563EB")
        resValue("color", "primaryColorDark", project.findProperty("SECONDARY_COLOR")?.toString() ?: "#1E40AF")
        resValue("color", "statusBarColor", project.findProperty("STATUS_BAR_COLOR")?.toString() ?: "#1E3A5F")
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("KEYSTORE_PATH")
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            val keystorePath = System.getenv("KEYSTORE_PATH")
            if (keystorePath != null) {
                signingConfig = signingConfigs.getByName("release")
                isMinifyEnabled = true
                isShrinkResources = true
            } else {
                // Unsigned debug-like release for testing
                signingConfig = signingConfigs.getByName("debug")
                isMinifyEnabled = false
                isShrinkResources = false
            }
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.browser:browser:1.8.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    // Biometric
    implementation("androidx.biometric:biometric:1.1.0")

    // Firebase (always included; only active with google-services.json)
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-messaging")
    implementation("com.google.firebase:firebase-analytics")

    // AdMob (always included; only active with config)
    implementation("com.google.android.gms:play-services-ads:23.0.0")

    // ML Kit for QR scanning
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.1.0")
}
