/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * @format
 */
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { AppRegistry, Platform, PermissionsAndroid } from 'react-native';
import SystemNotificationService from './services/SystemNotificationService';
import App from './App';

// Initialize SystemNotificationService early so it's available for background notifications
SystemNotificationService.configure();
SystemNotificationService.createChannel();

// Request notification permissions for Android 13+
if (Platform.OS === 'android' && Platform.Version >= 33) {
  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
    .then((result) => {
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Notification permission denied');
      }
    })
    .catch((error) => {
      console.error('Error requesting notification permission:', error);
    });
}

// Register background handler for FCM messages (when Firebase is configured)
const hasFirebaseConfig = Platform.OS === 'android' || 
  (Platform.OS === 'ios' && __DEV__); // Enable for iOS now that Firebase is properly configured

if (hasFirebaseConfig) {
  try {
    const { setBackgroundMessageHandler, getMessaging } = require('@react-native-firebase/messaging');
    
    // Get messaging instance and verify it's available
    const messagingInstance = getMessaging();
    if (!messagingInstance) {
      throw new Error('Firebase messaging instance is not available');
    }
    
    setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
      const title = remoteMessage.notification?.title || 'New Notification';
      const body = remoteMessage.notification?.body || '';
      const data = remoteMessage.data || {};
      
      // Display system notification when app is in background/quit state
      // This ensures notifications are shown even when user is not logged in
      try {
        SystemNotificationService.displayBackgroundNotification({
          type: data.type || 'unknown',
          taskId: data.taskId,
          allowanceHistoryId: data.allowanceHistoryId,
          title,
          body,
          ...data
        });
      } catch (error) {
        console.error('Error displaying background notification:', error);
      }
    });
  } catch (error) {
    console.warn('Firebase messaging initialization failed:', error.message);
  }
} else {
  console.log('Firebase messaging skipped (not configured for this platform)');
}

AppRegistry.registerComponent('DoDoneMobile', () => App);
