/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Switch, Paragraph, FAB } from 'react-native-paper';
import { Snackbar } from '../../components/StyledText';
import { Text, Card } from '../../components/StyledText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  NotificationType, 
  NotificationChannel, 
  UserNotificationPreferenceResponse,
  BulkNotificationPreferenceUpdateRequest,
  UserNotificationPreferenceUpdateRequest,
  BulkNotificationPreferenceCreateRequest,
  UserNotificationPreferenceCreateRequest,
  useNotificationPreferences,
  useTeam,
  PagedListRequestBuilder,
  SortDirection,
  useAuth
} from '@larisarozin/dodone-shared';
import { colors, styles } from '../../defaultTheme';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';

type NotificationSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NotificationSettings'>;
type NotificationSettingsScreenRouteProp = RouteProp<RootStackParamList, 'NotificationSettings'>;

interface NotificationSettingsScreenProps {
  navigation: NotificationSettingsScreenNavigationProp;
  route: NotificationSettingsScreenRouteProp;
}

// Configuration for notification types and their display information
interface NotificationTypeConfig {
  type: NotificationType;
  title: string;
  description: string;
  category: 'Task' | 'Allowance' | 'Bonus';
}

const getNotificationConfigs = (isBusiness?: boolean): NotificationTypeConfig[] => {
  const teamLabel = isBusiness ? 'Team' : 'Family';
  const teamLabelLower = isBusiness ? 'team' : 'family';
  const allowanceLabel = isBusiness ? 'Incentive' : 'Allowance';
  const allowanceLabelLower = isBusiness ? 'incentive' : 'allowance';

  return [
  // Common Notifications
  {
    type: NotificationType.OptInToTeamEventNotifications,
    title: `${teamLabel} Event Notifications`,
    description: `Get notified about ${teamLabelLower} events and updates`,
    category: 'Task'
  },
  // Task Notifications
  {
    type: NotificationType.TaskCreated,
    title: 'Task Created',
    description: 'Get notified when new tasks are created',
    category: 'Task'
  },
  {
    type: NotificationType.TaskDeleted,
    title: 'Task Deleted',
    description: 'Get notified when tasks are deleted',
    category: 'Task'
  },
  {
    type: NotificationType.TaskAssigned,
    title: 'Task Assigned',
    description: 'Get notified when tasks are assigned',
    category: 'Task'
  },
  {
    type: NotificationType.TaskUnassigned,
    title: 'Task Unassigned',
    description: 'Get notified when tasks are unassigned',
    category: 'Task'
  },
  {
    type: NotificationType.TaskReassigned,
    title: 'Task Reassigned',
    description: 'Get notified when tasks are reassigned',
    category: 'Task'
  },
  {
    type: NotificationType.TaskMarkedCompleted,
    title: 'Task Completed',
    description: 'Get notified when tasks are marked as completed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskMarkedIncomplete,
    title: 'Task Marked Incomplete',
    description: 'Get notified when tasks are marked as incomplete',
    category: 'Task'
  },
  {
    type: NotificationType.TaskProgressUpdated,
    title: 'Task Progress Updated',
    description: 'Get notified when tasks progress is updated',
    category: 'Task'
  },
  {
    type: NotificationType.TaskMarkedActive,
    title: 'Task Marked Active',
    description: 'Get notified when tasks are marked as active',
    category: 'Task'
  },
  {
    type: NotificationType.TaskMarkedInactive,
    title: 'Task Marked Inactive',
    description: 'Get notified when tasks are marked as inactive',
    category: 'Task'
  },
  {
    type: NotificationType.TaskArchived,
    title: 'Task Archived',
    description: 'Get notified when tasks are archived',
    category: 'Task'
  },
  {
    type: NotificationType.TaskUnarchived,
    title: 'Task Unarchived',
    description: 'Get notified when tasks are unarchived',
    category: 'Task'
  },
  {
    type: NotificationType.TaskGroupChanged,
    title: 'Task Group Changed',
    description: 'Get notified when group is changed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskKindChanged,
    title: 'Task Kind Changed',
    description: 'Get notified when tasks kind is changed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCategoryChanged,
    title: 'Task Category Changed',
    description: 'Get notified when tasks category is changed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskDetailsUpdated,
    title: 'Task Details Updated',
    description: 'Get notified when tasks details are changed',
    category: 'Task'
  },
 {
    type: NotificationType.TaskPriorityChanged,
    title: 'Priority Changed',
    description: 'Get notified when task priority is changed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCreditsAssigned,
    title: 'Credits Assigned',
    description: 'Get notified when credits are assigned to tasks',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCreditsRemoved,
    title: 'Credits Removed',
    description: 'Get notified when credits are removed from tasks',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCreditsChanged,
    title: 'Credits Changed',
    description: 'Get notified when task credits are modified',
    category: 'Task'
  },
  {
    type: NotificationType.TaskGraded,
    title: 'Task Graded',
    description: 'Get notified when your tasks are graded',
    category: 'Task'
  },
  {
    type: NotificationType.TaskGradeChanged,
    title: 'Grade Changed',
    description: 'Get notified when task grades are updated',
    category: 'Task'
  },
  {
    type: NotificationType.TaskGradeRemoved,
    title: 'Grade Removed',
    description: 'Get notified when task grades are removed',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCommentCreated,
    title: 'New Comment',
    description: 'Get notified when comments are added to tasks',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCommentUpdated,
    title: 'Comment Updated',
    description: 'Get notified when task comments are edited',
    category: 'Task'
  },
  {
    type: NotificationType.TaskCommentDeleted,
    title: 'Comment Deleted',
    description: 'Get notified when task comments are deleted',
    category: 'Task'
  },

  // Time-based Notifications
  {
    type: NotificationType.TaskDueSoon,
    title: 'Task Due Soon',
    description: 'Get notified when tasks are due within 48 hours',
    category: 'Task'
  },
  {
    type: NotificationType.TaskDue,
    title: 'Task Due',
    description: 'Get notified when tasks are due today',
    category: 'Task'
  },
  {
    type: NotificationType.TaskStartingSoon,
    title: 'Task Starting Soon',
    description: 'Get notified when task start time is approaching',
    category: 'Task'
  },
  {
    type: NotificationType.TaskStarted,
    title: 'Task Started',
    description: 'Get notified when task start time has arrived',
    category: 'Task'
  },
  {
    type: NotificationType.TaskEndingSoon,
    title: 'Task Ending Soon',
    description: 'Get notified when task end time is approaching',
    category: 'Task'
  },
  {
    type: NotificationType.TaskEnded,
    title: 'Task Ended',
    description: 'Get notified when task end time has arrived',
    category: 'Task'
  },
  {
    type: NotificationType.TaskAllowanceIntervalAssigned,
    title: 'Task Allowance Interval Assigned',
    description: 'Get notified when task allowance intervals are assigned to a task',
    category: 'Task'
  },
  {
    type: NotificationType.TaskAllowanceIntervalRemoved,
    title: 'Task Allowance Interval Removed',
    description: 'Get notified when task allowance intervals are removed from a task',
    category: 'Task'
  },
  {
    type: NotificationType.TaskAllowanceIntervalChanged,
    title: 'Task Allowance Interval Changed',
    description: 'Get notified when task allowance intervals are changed on a task',
    category: 'Task'
  },
  
  // Allowance/Incentive Notifications
  {
    type: NotificationType.AllowanceDay,
    title: `${allowanceLabel} Day`,
    description: `Get notified when ${allowanceLabelLower} is available`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.AllowanceDaySoon,
    title: `${allowanceLabel} Day Soon`,
    description: `Get notified when ${allowanceLabelLower} day is approaching`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.TaskAllowanceApproved,
    title: `${allowanceLabel} Approved`,
    description: `Get notified when task is approved for ${allowanceLabelLower}`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.TaskAllowanceRejected,
    title: `${allowanceLabel} Rejected`,
    description: `Get notified when task is rejected for ${allowanceLabelLower}`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.AllowanceClaimed,
    title: `${allowanceLabel} Claimed`,
    description: `Get notified when ${allowanceLabelLower} is claimed`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.AllowanceApproved,
    title: `${allowanceLabel} Approved`,
    description: `Get notified when ${allowanceLabelLower} claims are approved`,
    category: 'Allowance' as const
  },
  {
    type: NotificationType.AllowanceRejected,
    title: `${allowanceLabel} Rejected`,
    description: `Get notified when ${allowanceLabelLower} claims are rejected`,
    category: 'Allowance' as const
  },
  // Bonus Notifications
  {
    type: NotificationType.BonusAssigned,
    title: 'Bonus Assigned',
    description: 'Get notified when bonuses are assigned to a task',
    category: 'Bonus'
  },
  {
    type: NotificationType.BonusRemoved,
    title: 'Bonus Removed',
    description: 'Get notified when bonuses are removed from a task',
    category: 'Bonus'
  },
   {
    type: NotificationType.BonusChanged,
    title: 'Bonus Changed',
    description: 'Get notified when bonuses are changed on a task',
    category: 'Bonus'
  },
  {
    type: NotificationType.BonusClaimed,
    title: 'Bonus Claimed',
    description: 'Get notified when bonuses are claimed',
    category: 'Bonus'
  },
  {
    type: NotificationType.BonusApproved,
    title: 'Bonus Approved',
    description: 'Get notified when bonus claims are approved',
    category: 'Bonus'
  },
  {
    type: NotificationType.BonusRejected,
    title: 'Bonus Rejected',
    description: 'Get notified when bonus claims are rejected',
    category: 'Bonus'
  }
];
};

// Helper function to get notification preference for a specific type and channel
const getPreferenceForTypeAndChannel = (
  preferences: UserNotificationPreferenceResponse[] | null,
  notificationType: NotificationType,
  channel: NotificationChannel
): UserNotificationPreferenceResponse | undefined => {
  return preferences?.find(
    pref => pref.notificationType === notificationType && pref.channel === channel
  );
};

// Helper function to identify trial/system notifications (negative enum values)
const isSystemNotification = (notificationType: NotificationType): boolean => {
  return notificationType < 0;
};

// Trial notification configurations for admin users
const TRIAL_NOTIFICATION_CONFIGS: NotificationTypeConfig[] = [
  {
    type: NotificationType.TrialWelcome,
    title: 'Trial Welcome',
    description: 'Welcome notification when Pro trial begins',
    category: 'Task' // Category doesn't matter for system notifications
  },
  {
    type: NotificationType.Trial3DayWarning,
    title: 'Trial 3-Day Warning',
    description: 'Notification when 3 days remain in Pro trial',
    category: 'Task'
  },
  {
    type: NotificationType.Trial1DayWarning,
    title: 'Trial 1-Day Warning',
    description: 'Notification when 1 day remains in Pro trial',
    category: 'Task'
  },
  {
    type: NotificationType.TrialEndedWarning,
    title: 'Trial Ended',
    description: 'Notification when Pro trial has ended',
    category: 'Task'
  },
];

// Helper function to group configurations by category
const groupConfigsByCategory = (configs: NotificationTypeConfig[]) => {
  return configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, NotificationTypeConfig[]>);
};

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  // Get user for admin check
  const { user } = useAuth();
  
  // Initialize useTeam hook
  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { teamDetails, fetchTeamDetails } = useTeam(teamRequest);

  const {
    notificationPreferences,
    loadingNotificationPreferences: loading,
    updatingNotificationPreferences: updating,
    getUserNotificationPreferences,
    updateUserNotificationPreferences,
    createUserNotificationPreferences
  } = useNotificationPreferences();

  const { bottom, right } = useSafeAreaInsets();

  // Navigation action ref for isDirty handling
  const navigationActionRef = useRef<any>(null);

  // Get dynamic notification configurations based on team type
  const NOTIFICATION_CONFIGS = React.useMemo(() => 
    getNotificationConfigs(teamDetails?.isBusiness), 
    [teamDetails?.isBusiness]
  );

  // Local state for managing changes before saving
  const [localPreferences, setLocalPreferences] = useState<Record<string, { push: boolean, inApp: boolean }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Confirmation dialog
  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();

  // Initialize local preferences when backend preferences are loaded
  useEffect(() => {
    if (notificationPreferences) {
      const local: Record<string, { push: boolean, inApp: boolean }> = {};
      
      // Initialize all notification types with defaults
      NOTIFICATION_CONFIGS.forEach(config => {
        const pushPref = getPreferenceForTypeAndChannel(notificationPreferences, config.type, NotificationChannel.Push);
        const inAppPref = getPreferenceForTypeAndChannel(notificationPreferences, config.type, NotificationChannel.InApp);
        
        local[config.type.toString()] = {
          push: pushPref ? pushPref.isEnabled : true, // Default to true if no preference exists
          inApp: inAppPref ? inAppPref.isEnabled : true // Default to true if no preference exists
        };
      });
      
      setLocalPreferences(local);
      setHasUnsavedChanges(false);
    } else {
      // If no backend preferences, initialize all with defaults (true)
      const local: Record<string, { push: boolean, inApp: boolean }> = {};
      NOTIFICATION_CONFIGS.forEach(config => {
        local[config.type.toString()] = {
          push: true,
          inApp: true
        };
      });
      setLocalPreferences(local);
      setHasUnsavedChanges(false);
    }
  }, [notificationPreferences, NOTIFICATION_CONFIGS]);

  // Load team details when component mounts
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  useEffect(() => {
    getUserNotificationPreferences();
  }, [getUserNotificationPreferences]);

  // Navigation protection - warn if attempting to navigate with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges || updating) {
        return;
      }

      e.preventDefault();
      navigationActionRef.current = e.data.action;

      showDialog(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: hideDialog,
          },
          {
            text: 'Discard',
            onPress: () => {
              setHasUnsavedChanges(false);
              hideDialog();
              if (navigationActionRef.current) {
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, updating, navigation]);

  const handleTogglePreference = useCallback((
    notificationType: NotificationType,
    channel: 'push' | 'inApp'
  ) => {
    const key = notificationType.toString();
    setLocalPreferences(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [channel]: !prev[key]?.[channel]
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Handler for toggling all Push notifications (excluding system notifications)
  const handleToggleAllPush = useCallback((enabled: boolean) => {
    setLocalPreferences(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const notificationType = parseInt(key, 10) as NotificationType;
        // Skip system notifications (negative enum values)
        if (!isSystemNotification(notificationType)) {
          updated[key] = {
            ...updated[key],
            push: enabled
          };
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Handler for toggling all In-App notifications (excluding system notifications)
  const handleToggleAllInApp = useCallback((enabled: boolean) => {
    setLocalPreferences(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const notificationType = parseInt(key, 10) as NotificationType;
        // Skip system notifications (negative enum values)
        if (!isSystemNotification(notificationType)) {
          updated[key] = {
            ...updated[key],
            inApp: enabled
          };
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Check if all Push notifications are enabled (excluding system notifications)
  const allPushEnabled = React.useMemo(() => {
    return Object.entries(localPreferences)
      .filter(([key]) => !isSystemNotification(parseInt(key, 10) as NotificationType))
      .every(([_, pref]) => pref.push);
  }, [localPreferences]);

  // Check if all In-App notifications are enabled (excluding system notifications)
  const allInAppEnabled = React.useMemo(() => {
    return Object.entries(localPreferences)
      .filter(([key]) => !isSystemNotification(parseInt(key, 10) as NotificationType))
      .every(([_, pref]) => pref.inApp);
  }, [localPreferences]);

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) {
      setSuccess('No changes to save');
      return;
    }

    try {
      setError('');
      
      if (notificationPreferences && notificationPreferences.length > 0) {
        // Preferences exist - bulk update all of them
        const updates: UserNotificationPreferenceUpdateRequest[] = [];
        
        Object.entries(localPreferences).forEach(([typeStr, values]) => {
          const notificationType = parseInt(typeStr, 10) as NotificationType;
          
          // Find existing preferences for this notification type
          const pushPref = getPreferenceForTypeAndChannel(notificationPreferences, notificationType, NotificationChannel.Push);
          const inAppPref = getPreferenceForTypeAndChannel(notificationPreferences, notificationType, NotificationChannel.InApp);
          
          // Add push preference update
          if (pushPref) {
            updates.push({
              id: pushPref.id,
              isEnabled: values.push
            });
          }
          
          // Add in-app preference update
          if (inAppPref) {
            updates.push({
              id: inAppPref.id,
              isEnabled: values.inApp
            });
          }
        });

        const updateRequest: BulkNotificationPreferenceUpdateRequest = {
          Preferences: updates
        };
        
        const result = await updateUserNotificationPreferences(updateRequest);
        if (result) {
          setSuccess('Notification preferences updated successfully!');
          setHasUnsavedChanges(false);
        } else {
          setError('Failed to update notification preferences');
        }
      } else {
        // No preferences exist - bulk create all of them
        const creates: UserNotificationPreferenceCreateRequest[] = [];
        
        Object.entries(localPreferences).forEach(([typeStr, values]) => {
          const notificationType = parseInt(typeStr, 10) as NotificationType;
          
          // Create push preference
          creates.push({
            notificationType,
            channel: NotificationChannel.Push,
            isEnabled: values.push
          });
          
          // Create in-app preference
          creates.push({
            notificationType,
            channel: NotificationChannel.InApp,
            isEnabled: values.inApp
          });
        });

        const createRequest: BulkNotificationPreferenceCreateRequest = {
          Preferences: creates
        };
        
        const result = await createUserNotificationPreferences(createRequest);
        if (result) {
          setSuccess('Notification preferences saved successfully!');
          setHasUnsavedChanges(false);
        } else {
          setError('Failed to save notification preferences');
        }
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Error saving notification preferences');
    }
  }, [localPreferences, notificationPreferences, updateUserNotificationPreferences, createUserNotificationPreferences, hasUnsavedChanges]);

  const renderSystemNotificationTypeRow = (config: NotificationTypeConfig) => {
    // System notifications are always enabled and cannot be toggled
    return (
      <View key={config.type} style={localStyles.notificationRow}>
        <View style={localStyles.notificationContent}>
          <Text variant='bodyMedium' style={localStyles.settingTitle}>
            {config.title}
          </Text>
          <Text variant='bodySmall' style={localStyles.settingDescription}>
            {config.description}
          </Text>
          
          <View style={localStyles.channelContainer}>
            <View style={localStyles.channelRow}>
              <Switch
                value={true}
                onValueChange={() => {}} // No-op
                disabled={true}
                style={localStyles.channelSwitch}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={`Push notifications for ${config.title} (always enabled)`}
                accessibilityHint="This system notification cannot be disabled"
                accessibilityState={{ checked: true, disabled: true }}
              />
              <Text variant='bodySmall' style={localStyles.channelLabel}>Push</Text>
            </View>
            
            <View style={localStyles.channelRow}>
              <Switch
                value={true}
                onValueChange={() => {}} // No-op
                disabled={true}
                style={localStyles.channelSwitch}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={`In-app notifications for ${config.title} (always enabled)`}
                accessibilityHint="This system notification cannot be disabled"
                accessibilityState={{ checked: true, disabled: true }}
              />
              <Text variant='bodySmall' style={localStyles.channelLabel}>In-App</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderNotificationTypeRow = (config: NotificationTypeConfig) => {
    // Get current local values for this notification type
    const localValue = localPreferences[config.type.toString()];
    const pushEnabled = localValue?.push ?? true;
    const inAppEnabled = localValue?.inApp ?? true;

    const handlePushToggle = () => {
      handleTogglePreference(config.type, 'push');
    };

    const handleInAppToggle = () => {
      handleTogglePreference(config.type, 'inApp');
    };

    return (
      <View key={config.type} style={localStyles.notificationRow}>
        <View style={localStyles.notificationContent}>
          <Text variant='bodyMedium' style={localStyles.settingTitle}>
            {config.title}
          </Text>
          <Text variant='bodySmall' style={localStyles.settingDescription}>
            {config.description}
          </Text>
          
          <View style={localStyles.channelContainer}>
            <View style={localStyles.channelRow}>
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                disabled={updating}
                style={localStyles.channelSwitch}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={`Push notifications for ${config.title}`}
                accessibilityHint="Toggle push notifications for this notification type"
                accessibilityState={{ checked: pushEnabled, disabled: updating }}
              />
              <Text variant='bodySmall' style={localStyles.channelLabel}>Push</Text>
            </View>
            
            <View style={localStyles.channelRow}>
              <Switch
                value={inAppEnabled}
                onValueChange={handleInAppToggle}
                disabled={updating}
                style={localStyles.channelSwitch}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel={`In-app notifications for ${config.title}`}
                accessibilityHint="Toggle in-app notifications for this notification type"
                accessibilityState={{ checked: inAppEnabled, disabled: updating }}
              />
              <Text variant='bodySmall' style={localStyles.channelLabel}>In-App</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={localStyles.container}>
        <View style={localStyles.centered}>
          <Text variant='bodyLarge'>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedConfigs = groupConfigsByCategory(NOTIFICATION_CONFIGS);

  return (
    <SafeAreaView style={localStyles.container}>
      <ScrollView 
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
      >
        <Text variant="displaySmall" style={styles.gameTitle}>
          Notification Preferences
        </Text>

        <Card style={localStyles.card}>
          <Card.Content>
            <Paragraph style={localStyles.description}>
              Customize which notifications you'd like to receive and how you'd like to receive them.
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Master Switches for All Notifications */}
        <Card style={localStyles.card}>
          <Card.Content>
            <Text variant='titleSmall' style={localStyles.categoryTitle}>
              Master Controls
            </Text>
            
            <View style={localStyles.masterSwitchRow}>
              <View style={localStyles.masterSwitchContent}>
                <Text variant='bodyMedium' style={localStyles.settingTitle}>
                  All Push Notifications
                </Text>
                <Text variant='bodySmall' style={localStyles.settingDescription}>
                  Enable or disable all push notifications at once
                </Text>
              </View>
              <Switch
                value={allPushEnabled}
                onValueChange={handleToggleAllPush}
                disabled={updating}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Master control for all push notifications"
                accessibilityHint="Toggle all push notifications on or off"
                accessibilityState={{ checked: allPushEnabled, disabled: updating }}
              />
            </View>

            <View style={localStyles.divider} />

            <View style={localStyles.masterSwitchRow}>
              <View style={localStyles.masterSwitchContent}>
                <Text variant='bodyMedium' style={localStyles.settingTitle}>
                  All In-App Notifications
                </Text>
                <Text variant='bodySmall' style={localStyles.settingDescription}>
                  Enable or disable all in-app notifications at once
                </Text>
              </View>
              <Switch
                value={allInAppEnabled}
                onValueChange={handleToggleAllInApp}
                disabled={updating}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Master control for all in-app notifications"
                accessibilityHint="Toggle all in-app notifications on or off"
                accessibilityState={{ checked: allInAppEnabled, disabled: updating }}
              />
            </View>
          </Card.Content>
        </Card>


        {Object.entries(groupedConfigs).map(([categoryName, configs]) => {
          // Convert category name to use dynamic terminology
          const displayCategoryName = categoryName === 'Allowance' 
            ? (teamDetails?.isBusiness ? 'Incentive' : 'Allowance')
            : categoryName;
            
          return (
          <Card key={categoryName} style={localStyles.card}>
            <Card.Content>
              <Text variant='titleSmall' style={localStyles.categoryTitle}>
                {displayCategoryName} Notifications
              </Text>
              
              {configs.map((config, index) => (
                <View key={config.type}>
                  {renderNotificationTypeRow(config)}
                  {index < configs.length - 1 && <View style={localStyles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
          );
        })}

        {/* System Notifications (Admin Only) */}
        {user?.isAdmin && (
          <Card style={localStyles.card}>
            <Card.Content>
              <Text variant='titleSmall' style={localStyles.categoryTitle}>
                System Notifications
              </Text>
              
              <Paragraph style={localStyles.infoText}>
                ⚠️ System notifications are important account and subscription alerts that cannot be disabled. 
                You can still disable all notifications at the device level in your phone's settings if needed.
              </Paragraph>
              
              {TRIAL_NOTIFICATION_CONFIGS.map((config, index) => (
                <View key={config.type}>
                  {renderSystemNotificationTypeRow(config)}
                  {index < TRIAL_NOTIFICATION_CONFIGS.length - 1 && <View style={localStyles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
        
        {updating && (
          <Paragraph style={localStyles.infoText}>
            Updating preferences...
          </Paragraph>
        )}
      </ScrollView>

      {/* Snackbar for success */}
      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={{ backgroundColor: colors.success }}
      >
        {success}
      </Snackbar>

      {/* Snackbar for error */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={5000}
        style={{ backgroundColor: colors.error }}
      >
        {error}
      </Snackbar>

      {/* Save FAB */}
      <FAB
        icon="content-save"
        onPress={handleSave}
        style={[
          localStyles.fab,
          {
            bottom: bottom + 26,
            right: right + 26,
            backgroundColor: colors.accent,
          }
        ]}
        color="white"
        disabled={updating}
        loading={updating}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Save notification preferences"
        accessibilityHint="Tap to save your notification setting changes"
        accessibilityState={{ disabled: updating }}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 140, // Add padding to prevent content being hidden behind FAB
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    backgroundColor: colors.backgroundPaper,
  },
  sectionTitle: {
    marginBottom: 8,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  categoryTitle: {
    marginBottom: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  masterSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  masterSwitchContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationRow: {
    paddingVertical: 12,
  },
  notificationContent: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  channelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelSwitch: {
    // No additional styling needed for Switch component
  },
  channelLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.primaryLight,
    marginVertical: 12,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
  },
});
