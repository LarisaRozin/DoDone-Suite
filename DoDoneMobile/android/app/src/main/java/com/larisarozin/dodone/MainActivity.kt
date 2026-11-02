package com.larisarozin.dodone

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "DoDoneMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Fix for react-native-screens issue #17: Screen fragments should never be restored.
   * When the app is backgrounded and comes back, Android tries to restore saved fragment state.
   * This causes a crash because react-native-screens forbids fragment restoration.
   * Solution: Clear the savedInstanceState before calling super.onCreate() to prevent
   * the framework from restoring fragments.
   * See: https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    // Prevent savedInstanceState restoration which causes react-native-screens to crash.
    // This ensures the app always starts fresh without trying to restore saved fragments.
    super.onCreate(null)
  }
}