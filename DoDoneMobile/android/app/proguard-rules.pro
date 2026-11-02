# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# React Native core
# Minimal ProGuard rules for React Native app
# Keep this file lean to allow R8/ProGuard to effectively shrink code.

# Preserve annotations and inner classes metadata (useful for Crashlytics and some libs)
-keepattributes *Annotation*
-keepattributes InnerClasses

# Keep native methods (required for JNI bridge)
-keepclasseswithmembernames class * {
    native <methods>;
}

# Avoid warnings for common optional annotations
-dontwarn javax.annotation.**

# React Native bridge methods are referenced via annotations; keep them
-keepclassmembers class * {
  @com.facebook.react.bridge.ReactMethod <methods>;
}

# Let libraries' own consumerProguard rules handle their needs.
# Do NOT keep entire libraries like OkHttp/Retrofit/Gson to allow shrinking.

# If you see specific keep requirements from a library, add narrowly scoped rules here.