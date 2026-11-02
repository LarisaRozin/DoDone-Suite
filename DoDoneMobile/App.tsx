/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */
import { AuthProvider, ConfigProvider } from '@larisarozin/dodone-shared';
import AppNavigator from './navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from './contexts/NotificationContext';
import { CelebrationProvider, useCelebration } from './contexts/CelebrationContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import CelebrationOverlay from './components/CelebrationOverlay';
import { defaultTheme } from './defaultTheme';
import config from './config/config';
import { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { navigationRef } from './services/NavigationService';
import { getCrashlytics, setCrashlyticsCollectionEnabled, log } from '@react-native-firebase/crashlytics';
import { analyticsService } from './services/AnalyticsService';
import { setupGlobalErrorHandlers } from './utils/globalErrorHandler';


Icon.loadFont();

// Component that handles celebration overlay across all screens
function AppWithCelebration() {
  const { celebrationData, isCelebrationVisible, hideCelebration } = useCelebration();

  return (
    <>
      <AppNavigator />
      {/* Global Celebration Overlay - shows across all screens */}
      <CelebrationOverlay
        visible={isCelebrationVisible}
        type={celebrationData?.type!}
        body={celebrationData?.body!}
        onAnimationComplete={hideCelebration}
      />
    </>
  );
}

function App() {
  
  useEffect(() => {
    // Set up global error handlers for 401 detection
    // This catches errors from hooks and other async operations
    setupGlobalErrorHandlers();
    
    // Initialize Firebase services
    const crashlytics = getCrashlytics();
    log(crashlytics, 'App mounted');
    
    // Set up Crashlytics for development (only enable collection in release builds)
    if (__DEV__) {
      // Enable crashlytics collection during development for testing
      setCrashlyticsCollectionEnabled(crashlytics, true);
    }

    // Initialize Analytics and Performance Monitoring
    analyticsService.initialize();

    const handleUrl = (url: string) => {
      // Handle password reset URLs manually
      if (url && url.includes('reset-password')) {
        
        try {
          const urlObj = new URL(url);
          const token = urlObj.searchParams.get('token');
          const email = urlObj.searchParams.get('email');
          
          if (token) {
            // Retry navigation with delay if needed
            const attemptNavigation = (retries = 3) => {
              if (navigationRef.isReady() && retries > 0) {
                (navigationRef as any).navigate('ResetPassword', {
                  token,
                  email: email ? decodeURIComponent(email) : undefined,
                });
              } else if (retries > 0) {
                setTimeout(() => attemptNavigation(retries - 1), 500);
              } else {
                console.log('App - Navigation failed after all retries');
              }
            };
            
            attemptNavigation();
          }
        } catch (error) {
          console.log('App - Error parsing URL manually:', error);
          Alert.alert('Deep Link Error', `Error parsing URL: ${error}`);
        }
      }
    };

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ConfigProvider config={{ baseUrl: config.API_BASE_URL }}>
        <AuthProvider>
          <SubscriptionProvider>
            <PaperProvider theme={defaultTheme}>
              <NotificationProvider>
                <CelebrationProvider>
                  <AppWithCelebration />
                </CelebrationProvider>
              </NotificationProvider>
            </PaperProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ConfigProvider>
    </SafeAreaProvider>
)}

export default App;
