/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { Platform, AppState } from 'react-native';
import DeviceInfo from 'react-native-device-info';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationService } from './NavigationService';
import { DeviceRegistrationRequest, NotificationChannel, NotificationType, SubscriptionStatusResponse, SubscriptionTier, UserNotificationPreferenceResponse } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';
import nativeStorage from '../utils/nativeStorage';
import SystemNotificationService from './SystemNotificationService';
import SubscriptionService from './SubscriptionService';

// Import Firebase for both platforms (once iOS GoogleService-Info.plist is configured)
let getToken: any;
let requestPermission: any;
let onMessage: any;
let onNotificationOpenedApp: any;
let getInitialNotification: any;
let onTokenRefresh: any;
let AuthorizationStatus: any;
let getMessaging: any;

// Check if GoogleService-Info.plist exists for iOS before importing
const hasFirebaseConfig = Platform.OS === 'android' || 
  (Platform.OS === 'ios' && __DEV__); // Enable in development, add production check later

if (hasFirebaseConfig) {
  const firebaseMessaging = require('@react-native-firebase/messaging');
  getToken = firebaseMessaging.getToken;
  requestPermission = firebaseMessaging.requestPermission;
  onMessage = firebaseMessaging.onMessage;
  onNotificationOpenedApp = firebaseMessaging.onNotificationOpenedApp;
  getInitialNotification = firebaseMessaging.getInitialNotification;
  onTokenRefresh = firebaseMessaging.onTokenRefresh;
  AuthorizationStatus = firebaseMessaging.AuthorizationStatus;
  getMessaging = firebaseMessaging.getMessaging;
}

interface NotificationData {
  taskId?: string;
  allowanceHistoryId?: string;
  type?: string; // Now contains numeric enum value as string (e.g., "31")
  userId?: string;
  approvedAmount?: string; // For AllowanceApproved notifications
  approvedBonus?: string; // For BonusApproved notifications (can be any string, not just amounts)
  approvedUserId?: string; // User ID who got the approval - only celebrate if this matches current user
}

interface NotificationPreferences {
  taskAssigned: boolean;
  taskDueSoon: boolean;
  taskOverdue: boolean;
  teamUpdates: boolean;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized = false;
  private navigationCallback: ((taskId: string) => void) | null = null;
  private unsubscribeFunctions: (() => void)[] = [];
  private notificationDisplayCallback: ((title: string, body: string, data?: any) => void) | null = null;
  private notificationPreferences: UserNotificationPreferenceResponse[] | null = null;
  private preferencesLastFetched: number = 0;
  private readonly PREFERENCES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private celebrationCallback: ((type: NotificationType, title: string, body: string, data: NotificationData) => void) | null = null;
  private subscriptionStatus: SubscriptionStatusResponse | null = null;
  private isRegisteringToken = false;
  private lastRegisteredToken: string | null = null;
  private subscriptionUpdateCallback: (() => Promise<void>) | null = null;

  constructor() {
    // Initialization moved to initialize() method
  }

  async initialize() {
    if (this.isInitialized) return;

    // Skip Firebase initialization if not configured
    if (!hasFirebaseConfig) {
      console.log('Push notification service skipped (Firebase not configured for this platform)');
      this.isInitialized = true;
      return;
    }

    try {
      // Note: SystemNotificationService is already configured in index.js for background notifications
      // We only need to connect the navigation callback here
      SystemNotificationService.setNavigationCallback((taskId, allowanceHistoryId) => {
        // Use the same navigation logic as handleNotificationOpen
        if (taskId && this.navigationCallback) {
          this.navigationCallback(taskId);
        } else if (allowanceHistoryId && this.navigationCallback) {
          // For allowance notifications, use the allowance prefix pattern
          this.navigationCallback(`allowance:${allowanceHistoryId}`);
        }
      });
      
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return;
      }

      this.fcmToken = await getToken(messagingInstance);

      // Store token for backend registration
      if (this.fcmToken) {
        await nativeStorage.setItem('fcm_token', this.fcmToken);
      }

      await this.registerTokenWithBackend();

      this.setupMessageHandlers();

      try {
        this.subscriptionStatus = await SubscriptionService.getStatus(
          config.API_BASE_URL,
          await nativeStorage.getItem('auth_token') || ''
        );
      } catch (error) {
        console.error('Error fetching subscription status during push notification initialization:', error);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  setNavigationCallback(callback: (taskId: string) => void) {
    this.navigationCallback = callback;
  }

  setNotificationDisplayCallback(callback: (title: string, body: string, data?: any) => void) {
    this.notificationDisplayCallback = callback;
  }

  setCelebrationCallback(callback: (type: NotificationType, title: string, body: string, data: NotificationData) => void) {
    this.celebrationCallback = callback;
  }

  setSubscriptionUpdateCallback(callback: () => Promise<void>) {
    this.subscriptionUpdateCallback = callback;
  }

  /**
   * Fetches user notification preferences from the backend
   */
  private async fetchNotificationPreferences(): Promise<UserNotificationPreferenceResponse[] | null> {
    try {
      const token = await nativeStorage.getItem('auth_token');
      const baseUrl = config.API_BASE_URL;
      
      if (!token || !baseUrl) {
        console.log('Missing credentials for fetching notification preferences - user may not be logged in');
        return null;
      }

      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.notifications.getUserNotificationPreferences();
      
      if (!response || !response.success) {
        console.error('Failed to fetch notification preferences:', response?.message);
        return null;
      }

      this.notificationPreferences = response.data;
      this.preferencesLastFetched = Date.now();
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Gets cached notification preferences or fetches them if cache is stale
   */
  private async getNotificationPreferences(): Promise<UserNotificationPreferenceResponse[] | null> {
    const now = Date.now();
    const isCacheStale = !this.notificationPreferences || 
                        (now - this.preferencesLastFetched) > this.PREFERENCES_CACHE_DURATION;
    
    if (isCacheStale) {
      return await this.fetchNotificationPreferences();
    }
    
    return this.notificationPreferences;
  }

  /**
   * Converts numeric string from backend to NotificationType enum
   */
  private parseNotificationType(typeString: string): NotificationType | null {
    try {
      const numericValue = parseInt(typeString, 10);
      
      // Validate that it's a valid enum value
      if (isNaN(numericValue) || !Object.values(NotificationType).includes(numericValue)) {
        console.warn(`Invalid notification type value: ${typeString}`);
        return null;
      }
      
      return numericValue as NotificationType;
    } catch (error) {
      console.error(`Error parsing notification type: ${typeString}`, error);
      return null;
    }
  }

  /**
   * Checks if user has enabled notifications for the given type and channel
   * When user is not logged in (no preferences available), defaults to allowing notifications
   */
  private async isNotificationAllowed(notificationTypeString: string, channel: NotificationChannel): Promise<boolean> {
    const preferences = await this.getNotificationPreferences();
    
    if (!preferences) {
      // If we can't fetch preferences (user not logged in), allow notifications (fail-safe approach)
      console.log('No notification preferences available (user may not be logged in), allowing notification');
      return true;
    }

    const notificationType = this.parseNotificationType(notificationTypeString);
    
    if (notificationType === null) {
      // If we can't parse the notification type, allow it (fail-safe approach)
      console.warn(`Could not parse notification type: ${notificationTypeString}, allowing notification`);
      return true;
    }

    // Find preference for this specific notification type and channel
    const preference = preferences.find(p => 
      p.notificationType === notificationType && 
      p.channel === channel
    );

    if (!preference) {
      // If no specific preference is found, default to allowing (fail-safe approach)
      // console.warn(`No preference found for ${NotificationType[notificationType]} (${notificationType}) on ${NotificationChannel[channel]}, allowing notification`);
      return true;
    }

    return preference.isEnabled;
  }

  /**
   * Checks if notification type should trigger celebration and calls celebration callback
   * Only triggers for logged-in users who match the approvedUserId
   */
  private async triggerCelebrationIfNeeded(notificationType: NotificationType | null, title: string, body: string, data: NotificationData): Promise<void> {
    if (!this.celebrationCallback || !notificationType) return;

    if (!this.subscriptionStatus || (this.subscriptionStatus.currentTier === SubscriptionTier.Free && this.subscriptionStatus.isTrialActive === false && this.subscriptionStatus.isGracePeriodActive === false)
                                 || (this.subscriptionStatus.currentTier === SubscriptionTier.Pro && this.subscriptionStatus.isTrialActive === false)) {
      console.log('Celebration not triggered - user subscription tier does not allow celebrations');
      return;
    }

    // Only trigger celebration for AllowanceApproved and BonusApproved
    if (notificationType !== NotificationType.AllowanceApproved && notificationType !== NotificationType.BonusApproved && notificationType !== NotificationType.TaskAllowanceApproved) {
      return;
    }

    // Check if the approved user is the current user
    if (data.approvedUserId) {
      try {
        const currentUserId = await nativeStorage.getItem('user_id');
        if (!currentUserId) {
          console.log('Celebration not triggered - user not logged in');
          return;
        }
        if (currentUserId !== data.approvedUserId) {
          console.log('Celebration not triggered - approved user is not current user', { 
            currentUserId, 
            approvedUserId: data.approvedUserId 
          });
          return;
        }
      } catch (error) {
        console.error('Error getting current user ID for celebration check:', error);
        // If we can't verify the user, don't show celebration to be safe
        return;
      }
    }

    this.celebrationCallback(notificationType, title, body, data);
  }

  private async registerTokenWithBackend() {
    try {
      // Prevent concurrent registration calls
      if (this.isRegisteringToken) {
        console.log('Device registration already in progress, skipping duplicate call');
        return;
      }

      // Skip if token hasn't changed
      if (this.lastRegisteredToken === this.fcmToken) {
        console.log('FCM token already registered, skipping duplicate registration');
        return;
      }

      const token = await nativeStorage.getItem('auth_token');
      const baseUrl = config.API_BASE_URL; 
      
      if (!token || !baseUrl || !this.fcmToken) {
        console.log('Missing credentials for FCM token registration');
        return;
      }

      this.isRegisteringToken = true;

      const apiClient = createApiClient(baseUrl, token);
      
      const deviceRegistrationRequest: DeviceRegistrationRequest = {
        fcmToken: this.fcmToken,
        platform: Platform.OS,
        deviceId: await this.getDeviceId(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Send IANA format
      };
      var response = await apiClient.notifications.registerDevice(deviceRegistrationRequest);
      if (!response) {
        console.error('Failed to register device with backend:', response);
        return;
      }

      // Mark this token as successfully registered
      this.lastRegisteredToken = this.fcmToken;
    } catch (error) {
      console.error('Error preparing FCM token for backend:', error);
    } finally {
      this.isRegisteringToken = false;
    }
  }

  private async getDeviceId(): Promise<string> {
    // Use a consistent device identifier that survives app reinstalls
    let deviceId = await nativeStorage.getItem('device_id');
    if (!deviceId) {
      // Get unique device ID (consistent across app reinstalls)
      const uniqueId = await DeviceInfo.getUniqueId(); // Hardware-based ID
      deviceId = `${Platform.OS}_${uniqueId}`;
      await nativeStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private setupMessageHandlers() {
    const messagingInstance = getMessaging();
    
    // Handle foreground messages
    const unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage: any) => {
      this.handleNotification(remoteMessage);
    });

    // Handle background messages (this should be set up outside the class, typically in index.js)
    // messaging().setBackgroundMessageHandler is deprecated for newer versions
    // It should be called at the app level, not in service initialization

    // Handle notification opened from background/quit state
    const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(messagingInstance, (remoteMessage: any) => {
      this.handleNotificationOpen(remoteMessage);
    });

    // Handle notification opened when app was completely closed
    getInitialNotification(messagingInstance)
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // Handle token refresh
    const unsubscribeOnTokenRefresh = onTokenRefresh(messagingInstance, async (token: string) => {
      this.fcmToken = token;
      await nativeStorage.setItem('fcm_token', token);
      await this.registerTokenWithBackend();
    });

    // Store unsubscribe functions for cleanup if needed
    this.unsubscribeFunctions = [
      unsubscribeOnMessage,
      unsubscribeOnNotificationOpenedApp, 
      unsubscribeOnTokenRefresh
    ];
  }

  private async handleNotification(remoteMessage: any) {
    const data = remoteMessage.data as NotificationData;
    const title = remoteMessage.notification?.title || 'New Notification';
    const body = remoteMessage.notification?.body || '';

    if (data.type === "subscription_update") {
      // Handle subscription update notifications silently
      console.log('Received subscription update notification');
      try {
        // Call the subscription context callback if available
        if (this.subscriptionUpdateCallback) {
          await this.subscriptionUpdateCallback();
        }
      }
      catch (error) {
        console.error('Error handling subscription update notification:', error);
      } 
      return;
    }
    
    // Parse notification type for celebration checking
    const notificationType = this.parseNotificationType(data.type || '');
    
    // Check if app is in foreground
    const isAppInForeground = AppState.currentState === 'active';
    
    if (isAppInForeground) {
      // App is in foreground - check InApp notification preference
      const isInAppAllowed = await this.isNotificationAllowed(data.type || 'unknown', NotificationChannel.InApp);
      
      if (isInAppAllowed) {
        // Trigger celebration for approved notifications first
        await this.triggerCelebrationIfNeeded(notificationType, title, body, data);
        
        // Use in-app notification callback if available and user opted in
        if (this.notificationDisplayCallback) {
          this.notificationDisplayCallback(title, body, data);
        } else {
          // Fallback: check Push preference and show system notification if allowed
          const isPushAllowed = await this.isNotificationAllowed(data.type || 'unknown', NotificationChannel.Push);
          if (isPushAllowed) {
            SystemNotificationService.displayBackgroundNotification({
              type: data.type || 'unknown',
              taskId: data.taskId,
              allowanceHistoryId: data.allowanceHistoryId,
              title,
              body
            });
          }
        }
      }
    } else {
      // App is in background - check Push notification preference
      const isPushAllowed = await this.isNotificationAllowed(data.type || 'unknown', NotificationChannel.Push);
      
      if (isPushAllowed) {
        // Use system notification service
        SystemNotificationService.displayBackgroundNotification({
          type: data.type || 'unknown',
          taskId: data.taskId,
          allowanceHistoryId: data.allowanceHistoryId,
          title,
          body
        });
      }
    }
    
    // Handle specific notification types for additional logic if needed
    if (!data.type) {
      console.log('Unknown notification type or missing type field');
    }
  }

  private async handleNotificationOpen(remoteMessage: any) {
    const data = remoteMessage.data as NotificationData;
    const title = remoteMessage.notification?.title || 'New Notification';
    const body = remoteMessage.notification?.body || '';
    
    // Parse notification type and trigger celebration if needed
    const notificationType = this.parseNotificationType(data.type || '');
    await this.triggerCelebrationIfNeeded(notificationType, title, body, data);
    
    // Navigate to specific screens based on notification data
    if (data.taskId) {
      if (this.navigationCallback) {
        this.navigationCallback(data.taskId);
      } else {
        // Fallback to navigation service
        navigationService.navigateToTask(data.taskId);
      }
    } else if (data.allowanceHistoryId) {
      if (this.navigationCallback) {
        // For allowance notifications, we'll pass a special marker to indicate it's allowance-related
        this.navigationCallback(`allowance:${data.allowanceHistoryId}`);
      } else {
        // Fallback to navigation service if available
        // NavigationService.navigate('MainApp', { showAllowanceModal: true, highlightAllowanceId: data.allowanceHistoryId });
      }
    }
  }

  async unregisterDevice() {
    try {
      const token = await nativeStorage.getItem('auth_token');
      const baseUrl = config.API_BASE_URL;

      if (!token || !baseUrl || !this.fcmToken) return;

      const apiClient = createApiClient(baseUrl, token);
      
      await apiClient.notifications.unregisterDevice(this.fcmToken);
    } catch (error) {
      console.error('Error preparing device unregistration:', error);
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Refreshes notification preferences from the backend
   */
  async refreshNotificationPreferences(): Promise<UserNotificationPreferenceResponse[] | null> {
    return await this.fetchNotificationPreferences();
  }

  /**
   * Clears the notification preferences cache
   */
  clearNotificationPreferencesCache(): void {
    this.notificationPreferences = null;
    this.preferencesLastFetched = 0;
  }

  cleanup() {
    // Unsubscribe from all listeners
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    
    // Clear notification preferences cache
    this.clearNotificationPreferencesCache();
  }
}

export const pushNotificationService = new PushNotificationService();
export type { NotificationPreferences, NotificationData };
