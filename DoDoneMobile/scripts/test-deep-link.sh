#!/bin/bash
# Test script for deep linking
# Usage: ./test-deep-link.sh

echo "Testing deep link for password reset..."
echo "Make sure your app is installed and running in debug mode"
echo ""

# Example deep link URL
DEEP_LINK="dodone://reset-password?token=test-token-12345&email=test@example.com"

echo "Testing deep link: $DEEP_LINK"
echo ""

# For Android (using adb)
echo "Sending deep link to Android device/emulator..."
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "$DEEP_LINK" \
  com.dodoneMobile

echo ""
echo "If the app opened to the Reset Password screen, deep linking is working!"
echo "If not, check:"
echo "1. App is installed and running"
echo "2. Android manifest has the correct intent filter"
echo "3. Navigation configuration is set up correctly"
