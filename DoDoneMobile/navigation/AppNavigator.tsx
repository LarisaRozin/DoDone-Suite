/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import MainAppScreen from '../screens/MainAppScreen';
import TaskEditScreen from '../screens/TaskEditScreen';
import TaskCommentsScreen from '../screens/TaskCommentsScreen';
import { colors, fonts } from '../defaultTheme';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { useAuth, useTeam, PagedListRequestBuilder, SortDirection } from '@larisarozin/dodone-shared';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { useSubscription } from '../contexts/SubscriptionContext';
import TeamScreen from '../screens/team/TeamScreen';
import TeamMemberEditScreen from '../screens/team/TeamMemberEditScreen';
import TeamPreferencesScreen from '../screens/team/TeamPreferencesScreen';
import TaskGroupsScreen from '../screens/settings/TaskGroupsScreen';
import TaskGroupEditScreen from '../screens/settings/TaskGroupEditScreen';
import TaskKindsScreen from '../screens/settings/TaskKindsScreen';
import TaskKindEditScreen from '../screens/settings/TaskKindEditScreen';
import TaskCategoriesScreen from '../screens/settings/TaskCategoriesScreen';
import TaskCategoryEditScreen from '../screens/settings/TaskCategoryEditScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import EmojiAvatarScreen from '../screens/EmojiAvatarScreen';
import AllowanceIntervalManagerScreen from '../screens/team/AllowanceIntervalManagerScreen';
import { setAuthDispatch } from '../utils/apiClientWrapper';
import { setGlobalAuthDispatch } from '../utils/globalErrorHandler';
import SubscriptionTestScreen from '../screens/SubscriptionTestScreen';
import { SubscriptionManagementScreen } from '../screens/SubscriptionManagementScreen';
// import TestScreen from '../screens/TestScreen';
import { Menu } from 'react-native-paper';
import { TaskItemDetailsResponse, TaskGroupDetailsResponse, TaskKindDetailsResponse, TaskCategoryDetailsResponse } from '@larisarozin/dodone-shared';
import { User } from '@larisarozin/dodone-shared';
import { UserWithAvatar } from '../types/user-avatar';
import { navigationRef } from '../services/NavigationService';
import { linking } from './LinkingConfiguration';
import UserAvatar from '../components/UserAvatar';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    token: string;
    email?: string;
  };
  MainApp: {
    action?: 'expandDashboard' | 'showAllowances' | 'showBonuses';
  };
  Team: undefined;
  TeamPreferences: undefined;
  Test: undefined;
  TeamMemberEdit: {
    user?: User;
    isNew?: boolean;
  };
  TaskEdit: {
    taskItem?: TaskItemDetailsResponse;
    savedDetails?: string;
  };
  TaskDetails : {
    taskId: number;
    taskName: string;
  };
  TaskComments: {
    taskId: number;
    taskName?: string;
  };
  TaskGroups: undefined;
  TaskGroupEdit: {
    taskGroup?: TaskGroupDetailsResponse;
  };
  TaskKinds: {
    groupId: number;
    groupName: string;
    savedTaskKind?: boolean;
  };
  TaskKindEdit: {
    taskKind?: TaskKindDetailsResponse;
    groupId: number;
  };
  TaskCategories: {
    kindId: number;
    kindName: string;
    savedTaskCategory?: boolean;
  };
  TaskCategoryEdit: {
    taskCategory?: TaskCategoryDetailsResponse;
    kindId: number;
  };
  NotificationSettings: {};
  EmojiAvatar: {
    onSelect: (emoji: string, backgroundColor: string) => void;
    currentEmoji?: string;
    currentBackgroundColor?: string;
  };
  AllowanceIntervalManager: {
    intervalId?: number; // undefined for creating new interval
    teamId: number;
    isBusiness: boolean;
  };
  SubscriptionTest: undefined;
  SubscriptionManagement: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function DoDoneHeaderTitle() {
  const navigation = useNavigation<import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user, dispatch } = useAuth();
  // const { isPro } = useSubscription();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const isMenuOpen = useRef(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isDevBuild, setIsDevBuild] = useState(false);

  // Detect if this is a dev build
  useEffect(() => {
    const appName = DeviceInfo.getApplicationName();
    setIsDevBuild(appName.includes('Dev'));
  }, []);

  // Initialize useTeam hook to get team details only when user is authenticated
  // and we're on screens that need team information
  const needsTeamDetails = user && ['Team', 'TeamPreferences'].includes(route.name);
  
  const teamRequest = useMemo(() => 
    needsTeamDetails ? new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build() : new PagedListRequestBuilder().setPaging(0, 0).build(), // Empty request when not needed
    [needsTeamDetails]
  );

  const { teamDetails } = useTeam(teamRequest);
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      // Close menu when screen orientation changes to prevent positioning issues
      setMenuVisible(false);
    });
    return () => subscription?.remove();
  }, []);

  // Close menu when route changes to prevent menu staying open inappropriately
  useEffect(() => {
    setMenuVisible(false);
  }, [route.name]);

  const isLandscape = dimensions.width > dimensions.height;
  const rightPadding = isLandscape ? insets.right + 34 : insets.right + 4;

  // Helper function to get the correct label based on team type
  const getTeamLabel = () => {
    return teamDetails?.isBusiness ? 'Team' : 'Family';
  };

  const getTeamPreferencesLabel = () => {
    return teamDetails?.isBusiness ? 'Team Preferences' : 'Family Preferences';
  };

  const getPageTitle = () => {
    const routeName = route.name;
    const teamLabel = getTeamLabel();
    switch (routeName) {
      case 'MainApp':
        return 'DoDone';
      case 'Team':
        return `DoDone ${teamLabel}`;
      case 'TeamPreferences':
        return `DoDone ${teamLabel}`;
      case 'TeamMemberEdit':
        return 'DoDone';
      case 'TaskGroups':
        return 'DoDone Groups';
      case 'TaskKinds':
        return 'DoDone Kinds';
      case 'TaskCategories':
        return 'DoDone Categories';
      case 'TaskDetails':
        return 'DoDone Task Details';
      case 'Test':
        return 'DoDone Test';
      case 'TaskEdit':
        return 'DoDone Task';
      case 'Welcome':
        return 'DoDone Welcome';
      case 'Login':
        return 'DoDone Log In';
      case 'Register':
        return 'DoDone Register';
      case 'ForgotPassword':
        return 'DoDone Reset Password';
      case 'ResetPassword':
        return 'DoDone Set New Password';
      case 'EmojiAvatar':
        return 'DoDone Avatar';
      case 'SubscriptionManagement':
        return 'DoDone Subscription';
      default:
        return 'DoDone';
    }
  };

  const handleAvatarPress = useCallback(() => {
    // Force re-render by incrementing key
    setMenuKey(prev => prev + 1);
    isMenuOpen.current = true;
    
    // Use functional update to ensure state change is detected
    setMenuVisible(true);
  }, []);

  const handleMenuDismiss = useCallback(() => {
    isMenuOpen.current = false;
    setMenuVisible(false);
  }, []);

  const handleLogout = useCallback(() => {
    setMenuVisible(false);
    try {
      // Close any open menus and subscriptions first
      setMenuVisible(false);
      
      // Dispatch logout action to clear auth state
      // Wrap in setTimeout to allow UI to respond before state clears
      setTimeout(() => {
        try {
          dispatch({ type: 'LOGOUT' });
        } catch (error) {
          console.error('Error dispatching LOGOUT:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error in handleLogout:', error);
      // Fallback: attempt logout anyway
      dispatch({ type: 'LOGOUT' });
    }
  }, [dispatch]);

  const handleMenuAction = useCallback((action: string) => {
    setMenuVisible(false);
    try {
      switch (action) {
        case 'home':
          navigation.navigate('MainApp', {});
          break;
        case 'team':
          navigation.navigate('Team');
          break;
        case 'teamPreferences':
          navigation.navigate('TeamPreferences');
          break;
        case 'editProfile':
          if (user) {
            navigation.navigate('TeamMemberEdit', { 
              user: user, 
              isNew: false 
            });
          }
          break;
        case 'notificationSettings':
          navigation.navigate('NotificationSettings', {});
          break;
        case 'taskGroups':
          navigation.navigate('TaskGroups');
          break;
        case 'test':
          navigation.navigate('Test');
          break;
        case 'subscriptionTest':
          navigation.navigate('SubscriptionTest');
          break;
        case 'subscriptionManagement':
          navigation.navigate('SubscriptionManagement');
          break;
        case 'logout':
          handleLogout();
          break;
      }
    } catch (error) {
      console.error('Error handling menu action:', action, error);
      // Don't crash on menu action errors
    }
  }, [navigation, user, handleLogout]);

  return (
  <View style={[localStyles.headerTitleContainer, { paddingRight: rightPadding }]}>
    <View style={localStyles.headerLogoContainer}>
      {getPageTitle() ? (
        <>
          <Text variant='headlineLarge' style={[localStyles.headerTitle, isDevBuild && localStyles.devHeaderTitle]}>
            {getPageTitle()}
          </Text>
          {isDevBuild && (
            <View style={localStyles.devBadge}>
              <Text style={localStyles.devBadgeText}>DEV</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text variant="headlineLarge" style={[localStyles.logoTitle, isDevBuild && localStyles.devHeaderTitle]}>
            DoDone
          </Text>
          {isDevBuild && (
            <View style={localStyles.devBadge}>
              <Text style={localStyles.devBadgeText}>DEV</Text>
            </View>
          )}
        </>
      )}
    </View>    
      <View style={localStyles.topMenuContainer}>        
        {user && (
          <Menu
            key={`menu-${menuKey}`}
            visible={menuVisible}
            onDismiss={handleMenuDismiss}
            statusBarHeight={insets.top} // Ensure proper positioning relative to status bar
            anchor={              
              <UserAvatar
                size={52}
                imageUri={(user as UserWithAvatar)?.avatarUri}
                firstName={user?.firstName}
                lastName={user?.lastName}
                userName={user?.userName}
                style={localStyles.avatar}
                labelStyle={localStyles.avatarLabel}
                onPress={handleAvatarPress}
              />
            }
            contentStyle={localStyles.menuContent}
          >
            <Menu.Item 
              onPress={() => handleMenuAction('home')} 
              title="Home" 
              leadingIcon="home"
              titleStyle={localStyles.menuItemText}
            />
            <Menu.Item 
              onPress={() => handleMenuAction('team')} 
              title={getTeamLabel()} 
              leadingIcon="account-group"
              titleStyle={localStyles.menuItemText}
            />
            <Menu.Item 
              onPress={() => handleMenuAction('teamPreferences')} 
              title={getTeamPreferencesLabel()} 
              leadingIcon="cog"
              titleStyle={localStyles.menuItemText}
            />
            <Menu.Item 
              onPress={() => handleMenuAction('taskGroups')} 
              title="Task Groups" 
              leadingIcon="folder-multiple"
              titleStyle={localStyles.menuItemText}
            />
            {/* <Menu.Item 
              onPress={() => handleMenuAction('subscriptionTest')} 
              title="Subscription Test" 
              leadingIcon="flask"
              titleStyle={localStyles.menuItemText}
            /> */}
            {/* <Menu.Item 
              onPress={() => handleMenuAction('test')} 
              title="Test" 
              leadingIcon="account-group"
              titleStyle={localStyles.menuItemText}
            /> */}
            <Menu.Item 
              onPress={() => handleMenuAction('editProfile')} 
              title="Edit Profile" 
              leadingIcon="account-edit"
              titleStyle={localStyles.menuItemText}
            />
            {user?.isAdmin === true && (
              <Menu.Item 
                onPress={() => handleMenuAction('subscriptionManagement')} 
                title="Subscription" 
                leadingIcon="star"
                titleStyle={localStyles.menuItemText}
              />
            )}
            <Menu.Item 
              onPress={() => handleMenuAction('notificationSettings')} 
              title="Notification Preferences" 
              leadingIcon="bell"
              titleStyle={localStyles.menuItemText}
            />
            <Menu.Item 
              onPress={() => handleMenuAction('logout')} 
              title="Log Out" 
              leadingIcon="logout"
              titleStyle={[localStyles.menuItemText, localStyles.logoutText]}
            />
          </Menu>
	)}
      </View>
  </View>
  );
};

const loginScreenProps = {
  authLoading: false,
  setAuthLoading: () => {},
};

function LoginScreenWrapper(props: any) {
  return <LoginScreen {...loginScreenProps} {...props} />;
}

export default function AppNavigator() {
  const { user, authLoading, dispatch } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Set the auth dispatch for both API client wrapper and global error handler
  // This enables automatic logout on 401 errors from anywhere in the app
  useEffect(() => {
    setAuthDispatch(dispatch);
    setGlobalAuthDispatch(dispatch);
  }, [dispatch]);

  if (authLoading) {
    return null;
  }

  return (
    <NavigationContainer
      // @ts-ignore - ref prop type issue in newer TypeScript versions
      ref={navigationRef}
      linking={linking}
      onReady={() => setIsReady(true)}
      onStateChange={(state) => {
        if (isReady && user && state) {
          const currentRoute = state.routes[state.index];
          const currentRouteName = currentRoute?.name;
          
          // Only redirect away from ResetPassword if user is authenticated AND there's no reset token
          // This allows legitimate password reset deep links to work even for authenticated users
          if (currentRouteName === 'ResetPassword') {
            const hasResetToken = currentRoute?.params && 'token' in currentRoute.params;
            if (!hasResetToken) {
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              });
            }
          }
          // For other unauthenticated routes, be less aggressive - only redirect if it seems like a navigation loop
          else if (['Welcome', 'Login', 'Register', 'ForgotPassword'].includes(currentRouteName)) {
            // Only redirect if this seems like an unintended navigation (e.g., after login but before navigation reset)
            // We can detect this by checking if we have multiple routes in the stack with MainApp already present
            const hasMainApp = state.routes.some(route => route.name === 'MainApp');
            if (hasMainApp) {
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              });
            }
          }
        }
      }}
      onUnhandledAction={(action) => {
        console.log('NavigationContainer - Unhandled action:', action);
      }}
    >
      <Stack.Navigator 
          id="RootStack"
          initialRouteName={user ? 'MainApp' : 'Welcome'}
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary, 
            },
            headerTintColor: colors.primaryContrastText, 
            headerTitleStyle: {
              fontFamily: fonts.fredoka,
              fontSize: 24,
            },
          }}>
      {user ? (
          <>
            <Stack.Screen 
              name="MainApp" 
              component={MainAppScreen} 
              options={{
                title: 'DoDone',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="Team" 
              component={TeamScreen} 
              options={{
                title: 'DoDone',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskEdit" 
              component={TaskEditScreen} 
              options={{
                title: 'Edit Task',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskComments" 
              component={TaskCommentsScreen} 
              options={{
                title: 'Task Comments',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            {/* <stack.screen 
              name="settings" 
              component={settingsscreen} 
              options={{
                title: 'dodone',
                headertitle: dodoneheadertitle,
                headertitlealign: 'left',
              }}
            /> 
            <Stack.Screen 
              name="Test" 
              component={TestScreen} 
              options={{
                title: 'Test Screen',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
              }}
            />   */}
            <Stack.Screen 
              name="TaskDetails" 
              component={TaskDetailsScreen} 
              options={{
                title: 'Task Details',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="EmojiAvatar" 
              component={EmojiAvatarScreen} 
              options={{
                title: 'Choose Avatar',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="AllowanceIntervalManager" 
              component={AllowanceIntervalManagerScreen} 
              options={{
                title: 'Interval Manager',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TeamMemberEdit" 
              component={TeamMemberEditScreen} 
              options={{
                title: 'Team Member',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TeamPreferences" 
              component={TeamPreferencesScreen} 
              options={{
                title: 'Team Preferences',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskGroups" 
              component={TaskGroupsScreen} 
              options={{
                title: 'Task Groups',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskGroupEdit" 
              component={TaskGroupEditScreen} 
              options={{
                title: 'Edit Task Group',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskKinds" 
              component={TaskKindsScreen} 
              options={{
                title: 'Task Kinds',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskKindEdit" 
              component={TaskKindEditScreen} 
              options={{
                title: 'Edit Task Kind',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskCategories" 
              component={TaskCategoriesScreen} 
              options={{
                title: 'Task Categories',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="TaskCategoryEdit" 
              component={TaskCategoryEditScreen} 
              options={{
                title: 'Edit Task Category',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />  
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen} 
              options={{
                title: 'Notification Settings',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="SubscriptionTest" 
              component={SubscriptionTestScreen} 
              options={{
                title: '🧪 Subscription Test',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="SubscriptionManagement" 
              component={SubscriptionManagementScreen} 
              options={{
                title: 'Subscription',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
              options={{
                title: 'Set New Password',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{
                title: 'DoDone',
                headerTitle: DoDoneHeaderTitle,            
                headerTitleAlign: 'left'
              }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreenWrapper} 
              options={{
                title: 'Log In',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{
                title: 'Register',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
              }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{
                title: 'Reset Password',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
              options={{
                title: 'Set New Password',
                headerTitle: DoDoneHeaderTitle,
                headerTitleAlign: 'left',
                headerBackTitle: '',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const localStyles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    width: '100%',
    height: '100%',
    marginRight: 16,
    minHeight: Platform.select({
      ios: 56, // Larger minimum height for iOS to accommodate safe area
      android: 36, // Keep original height for Android
    }),
    paddingTop: Platform.select({
      ios: 8, 
      android: 14, 
    }),
    paddingVertical: Platform.select({
      ios: 4, // Less vertical padding for iOS
      android: 8, // Keep original vertical padding for Android
    }),
  },
  headerLogoContainer: {
    flexDirection: 'row',
    height: '100%', // Ensure full height usage
    alignItems: Platform.select({
      ios: 'center', // Center alignment works better for iOS
      android: 'flex-start', // Flex-start alignment for Android
    }),
    justifyContent: 'flex-start',
    gap: 4,
  },
  logoTitle: {
    fontFamily: fonts.fredokaBold,
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryContrastText,
    textAlign: 'left',
    marginLeft: 10,
    height: '100%', // Ensure full height usage
    marginTop: Platform.select({
      ios: -2, // Slight negative margin for iOS to center better
      android: 8, // Positive margin for Android for proper spacing
    }),
  },
  headerTitle: {
    fontFamily: fonts.fredokaBold,
    fontSize: 24,
    fontWeight: '600',
    color: colors.primaryContrastText,
    textAlign: 'left',
    marginLeft: 10,
    height: '100%', // Ensure full height usage
    marginTop: Platform.select({
      ios: -2, // Slight negative margin for iOS to center better
      android: 8, // Positive margin for Android for proper spacing
    }),
  },
  topMenuContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%', // Ensure full height usage
    paddingTop: Platform.select({
      ios: 2, // Small padding adjustment for iOS
      android: 0, // No extra padding for Android
    }),
  },
  topMenuButton: {
    marginHorizontal: 8,
  },  
  searchBar: {
    width: 120,
    height: 32,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarInput: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 0,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  avatar: {
    backgroundColor: colors.avatarBg,
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: Platform.select({
      ios: 'flex-start', // Align to start on iOS to prevent over-centering
      android: 'center', // Keep center alignment for Android
    }),
    marginTop: Platform.select({
      ios: -20, // Slight negative margin for iOS
      android: 0, // No margin adjustment for Android
    }),
  },
  avatarLabel: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.fredoka,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuContent: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    elevation: 10, // Increased elevation to ensure menu appears above other elements
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 }, // Increased shadow for better visibility
    shadowOpacity: 0.25, // Increased shadow opacity
    shadowRadius: 8, // Increased shadow radius
    minWidth: 150,
    zIndex: 9999, // Added high z-index for iOS
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.roboto,
  },
  logoutText: {
    color: colors.error,
  },
  devHeaderTitle: {
    color: '#FFA726', // Orange color for dev builds
  },
  devBadge: {
    backgroundColor: '#FFA726',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    marginTop: Platform.select({
      ios: -2,
      android: 8,
    }),
  },
  devBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: fonts.fredokaBold,
    letterSpacing: 1,
  },
});