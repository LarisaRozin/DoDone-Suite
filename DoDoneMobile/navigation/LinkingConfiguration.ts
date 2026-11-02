/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Deep linking configuration for React Navigation
 * @format
 */

import { LinkingOptions, getStateFromPath } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['dodone://'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password',
        exact: true,
      },
      MainApp: 'main',
      Team: 'team',
      TeamMemberEdit: 'team-member-edit',
      TaskEdit: 'task-edit',
      TaskGroups: 'task-groups',
      TaskGroupEdit: 'task-group-edit',
      TaskKinds: 'task-kinds',
      TaskKindEdit: 'task-kind-edit',
      TaskCategories: 'task-categories',
      TaskCategoryEdit: 'task-category-edit',
      NotificationSettings: 'notification-settings',
      Test: 'test',
    },
  },
  getStateFromPath(path, options) {
    // Handle reset-password URLs manually
    if (path && path.includes('reset-password')) {
      try {
        // Handle different path formats
        let fullUrl = path;
        if (!path.startsWith('dodone://')) {
          fullUrl = `dodone://${path}`;
        }
        
        // Parse URL parameters manually
        const url = new URL(fullUrl);
        const token = url.searchParams.get('token');
        const email = url.searchParams.get('email');
        
        if (token) {
          const navigationState = {
            routes: [
              {
                name: 'ResetPassword' as keyof RootStackParamList,
                params: {
                  token,
                  email: email ? decodeURIComponent(email) : undefined,
                },
              },
            ],
          };
          
          return navigationState;
        } else {
          console.log('LinkingConfiguration - No token found in URL');
        }
      } catch (error) {
        console.log('LinkingConfiguration - Error parsing URL:', error);
      }
    }
    
    // Use default parsing for other URLs
    const defaultState = getStateFromPath(path, options);
    return defaultState;
  },
};
