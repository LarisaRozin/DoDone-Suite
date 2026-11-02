/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

// Create a ref to store the navigation object
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

class NavigationService {
  // Navigate to a specific route
  navigate(routeName: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate(routeName, params);
    }
  }

  // Navigate to a specific task
  navigateToTask(taskItemId: string) {
    if (navigationRef.isReady()) {
      // Navigate to the TaskEdit screen with the task ID
      (navigationRef as any).navigate('TaskEdit', { taskItemId });
    }
  }

  // Go back
  goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }

  // Get current route name
  getCurrentRoute() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  }

  // Reset to a specific route
  reset(routeName: keyof RootStackParamList, params?: any) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName as any, params: params as any }],
      });
    }
  }

  // Handle password reset deep link
  navigateToPasswordReset(token: string, email?: string) {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('ResetPassword', { token, email });
    }
  }
}

export const navigationService = new NavigationService();
