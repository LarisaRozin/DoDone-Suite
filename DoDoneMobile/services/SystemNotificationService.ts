/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Platform } from 'react-native';

// Conditionally import push notification library only on Android
let PushNotification: any;
let Importance: any;

if (Platform.OS === 'android') {
  const PushNotificationModule = require('react-native-push-notification');
  PushNotification = PushNotificationModule.default || PushNotificationModule;
  Importance = PushNotificationModule.Importance;
}

interface NotificationData {
  type: string;
  taskId?: string;
  allowanceHistoryId?: string;
  title?: string;
  body?: string;
  [key: string]: any;
}

class SystemNotificationService {
  private navigationCallback: ((taskId?: string, allowanceHistoryId?: string) => void) | null = null;
  private isConfigured = false;
  
  setNavigationCallback(callback: (taskId?: string, allowanceHistoryId?: string) => void) {
    this.navigationCallback = callback;
  }
  
  configure() {
    if (this.isConfigured) {
      return;
    }

    // Skip configuration on iOS for now to avoid NativeEventEmitter errors
    if (Platform.OS === 'ios') {
      this.isConfigured = true;
      return;
    }
    
    if (!PushNotification || !PushNotification.configure) {
      console.error('SystemNotificationService: PushNotification module not available');
      this.isConfigured = true; // Mark as configured to prevent further attempts
      return;
    }
    
    PushNotification.configure({
      onNotification: (notification: any) => {
        if (notification.userInteraction) {
          // Handle navigation when user taps notification
          if (notification.userInfo && notification.userInfo.notificationData) {
            const data = notification.userInfo.notificationData;
            if (this.navigationCallback) {
              this.navigationCallback(data.taskId, data.allowanceHistoryId);
            }
          }
        }
      },
      // Request permissions for iOS
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      // Should the initial notification be popped automatically
      popInitialNotification: true,
      
      // (optional) Called when the user fails to register for remote notifications
      onRegistrationError: (err: Error) => {
        console.error('SystemNotificationService: Registration error:', err);
      },

      requestPermissions: (Platform.OS as string) === 'ios',
    });
    
    this.isConfigured = true;
  }

  createChannel() {
    if (Platform.OS === 'android') {
      
      if (!PushNotification || !PushNotification.createChannel) {
        console.error('SystemNotificationService: PushNotification module not available for createChannel');
        return;
      }
      
      // Delete any existing channel first to ensure clean state
      PushNotification.deleteChannel('default-channel');
      
      // Create the channel with proper configuration
      PushNotification.createChannel(
        {
          channelId: 'default-channel',
          channelName: 'Default Notifications',
          channelDescription: 'Default channel for DoDone notifications',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created: boolean) => {
          if (!created) {
            console.warn('SystemNotificationService: Channel creation returned false - may already exist or permissions issue');
            // List existing channels for debugging
            PushNotification.getChannels((channels: string[]) => {
              console.log('SystemNotificationService: Existing channels:', channels);
            });
          }
        }
      );
    } else {
      ; // do nothing on iOS
    }
  }

  displayBackgroundNotification(data: NotificationData) {
    if (Platform.OS === 'ios') {
      return;
    }

    const title = data.title || 'DoDone Notification';
    const message = data.body || 'You have a new notification';
    
    const notificationPayload: any = {
      channelId: 'default-channel',
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      priority: 'high' as const,
      importance: 'high' as const,
      userInfo: {
        notificationData: data,
      },
      // Add ID to make notification unique
      id: Date.now(),
    };

    try {
      PushNotification.localNotification(notificationPayload);
    } catch (error) {
      console.error('SystemNotificationService: Error triggering local notification:', error);
    }
  }

  cancelAllNotifications() {
    if (Platform.OS === 'android') {
      PushNotification.cancelAllLocalNotifications();
    }
  }

  clearBadge() {
    if (Platform.OS === 'ios') {
      // iOS badge clearing not yet implemented
      console.log('SystemNotificationService: Badge clearing not yet supported on iOS');
    }
  }
}

export default new SystemNotificationService();
