/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Portal } from 'react-native-paper';
import { colors } from '../defaultTheme';
import { NotificationType } from '@larisarozin/dodone-shared';
import { UpgradeModal } from '../components/UpgradeModal';

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showPushNotification: (title: string, body: string, data?: any) => void;
  setNavigationCallback: (callback: (taskId: string, allowanceHistoryId?: string) => void) => void;
  notification: NotificationState;
  hideNotification: () => void;
  setModalOpen: (isOpen: boolean) => void;
  setUpgradeModalOpen: (isOpen: boolean) => void;
  handleNotificationTap: () => void;
}

interface NotificationState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  body?: string;
  isPushNotification?: boolean;
  data?: any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    message: '',
    type: 'info',
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  // Use useRef for the callback to avoid re-render issues and stale closures
  const navigationCallbackRef = useRef<((taskId: string, allowanceHistoryId?: string) => void) | null>(null);

  const setNavigationCallback = useCallback((callback: (taskId: string, allowanceHistoryId?: string) => void) => {
    navigationCallbackRef.current = callback;
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({
      visible: true,
      message,
      type,
      isPushNotification: false,
    });
  }, []);

  const showPushNotification = useCallback((title: string, body: string, data?: any) => {
    setNotification({
      visible: true,
      message: body, // Keep for backward compatibility
      body,
      type: 'info',
      title,
      isPushNotification: true,
      data,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  const handleNotificationTap = useCallback(() => {
    if (notification.data) {
      const { taskId, allowanceHistoryId, type } = notification.data;
      
      // Check if this is a trial notification
      const notificationType = type ? parseInt(type, 10) : null;
      const isTrialNotification = notificationType && (
        notificationType === NotificationType.TrialWelcome ||
        notificationType === NotificationType.Trial3DayWarning ||
        notificationType === NotificationType.Trial1DayWarning ||
        notificationType === NotificationType.TrialEndedWarning
      );

      if (isTrialNotification) {
        // Open UpgradeModal for trial notifications
        setUpgradeModalVisible(true);
      } else if (navigationCallbackRef.current) {
        // Handle task/allowance notifications
        if (taskId) {
          navigationCallbackRef.current(taskId);
        } else if (allowanceHistoryId) {
          navigationCallbackRef.current(`allowance:${allowanceHistoryId}`);
        }
      }
    }
    hideNotification();
  }, [notification.data, hideNotification]);

  const setModalOpen = useCallback((isOpen: boolean) => {
    setIsModalOpen(isOpen);
  }, []);

  const setUpgradeModalOpen = useCallback((isOpen: boolean) => {
    setUpgradeModalVisible(isOpen);
  }, []);

  // Animated value for slide-in effect
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (notification.visible && !isModalOpen) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [notification.visible, isModalOpen, slideAnim]);

  // Auto-hide timer
  useEffect(() => {
    if (notification.visible && !isModalOpen) {
      // Check if this is a trial notification for longer duration
      let duration = notification.isPushNotification ? 8000 : 4000;
      
      if (notification.data?.type) {
        const notificationType = parseInt(notification.data.type, 10);
        const isTrialNotification = notificationType && (
          notificationType === NotificationType.TrialWelcome ||
          notificationType === NotificationType.Trial3DayWarning ||
          notificationType === NotificationType.Trial1DayWarning ||
          notificationType === NotificationType.TrialEndedWarning
        );
        
        // Trial notifications stay visible longer (15 seconds)
        if (isTrialNotification) {
          duration = 15000;
        }
      }
      
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification.visible, notification.isPushNotification, notification.data, isModalOpen, hideNotification]);

  const getNotificationBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning || '#ff9800';
      case 'info':
      default:
        return notification.isPushNotification ? colors.primary : '#2196f3';
    }
  };

  const getActionButton = () => {
    if (!notification.isPushNotification || !notification.data) {
      return {
        label: 'Dismiss',
        onPress: hideNotification,
      };
    }

    const { type, taskId, allowanceHistoryId } = notification.data;
    const notificationType = type ? parseInt(type, 10) : null;
    const isTrialNotification = notificationType && (
      notificationType === NotificationType.TrialWelcome ||
      notificationType === NotificationType.Trial3DayWarning ||
      notificationType === NotificationType.Trial1DayWarning ||
      notificationType === NotificationType.TrialEndedWarning
    );

    if (isTrialNotification) {
      return {
        label: 'Subscribe Now',
        onPress: handleNotificationTap,
      };
    } else if (taskId || allowanceHistoryId) {
      return {
        label: 'View',
        onPress: handleNotificationTap,
      };
    }
    return {
      label: 'Dismiss',
      onPress: hideNotification,
    };
  };

  const actionButton = getActionButton();

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showPushNotification, 
      setNavigationCallback, 
      notification, 
      hideNotification,
      setModalOpen,
      setUpgradeModalOpen,
      handleNotificationTap
    }}>
      {children}
      <Portal>
        {notification.visible && !isModalOpen && (
          <Animated.View
            style={[
              styles.notificationContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View
              style={[
                styles.notificationCard,
                { backgroundColor: getNotificationBackgroundColor() },
              ]}
            >
              {/* Title */}
              {notification.title && (
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
              )}

              {/* Body */}
              <Text style={styles.notificationBody}>
                {notification.body || notification.message}
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={actionButton.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>{actionButton.label}</Text>
              </TouchableOpacity>

              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={hideNotification}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Portal>
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        message="Upgrade to Pro to continue enjoying all premium features"
      />
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 9999,
    maxHeight: '70%',
  },
  notificationCard: {
    borderRadius: 12,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: '100%',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  notificationBody: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 22,
    opacity: 0.95,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18,
  },
});
