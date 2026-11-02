/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { TextInput, Switch, FAB } from 'react-native-paper';
import { Snackbar } from '../../components/StyledText';
import { Text, Button } from '../../components/StyledText';
import { colors, fonts, styles } from '../../defaultTheme';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  TaskGroupCreateRequest, 
  TaskGroupUpdateRequest, 
  TaskKindResponse,
  TaskGroupDetailsResponse,
  useAuth, 
  API_ROUTES, 
  useConfig,
  DataResponse,
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { convertUTCToLocal, formatDateForDisplay } from '../../utils/dateUtils';

type TaskGroupEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskGroupEdit'>;
type TaskGroupEditScreenRouteProp = RouteProp<RootStackParamList, 'TaskGroupEdit'>;

interface TaskGroupEditScreenProps {
  navigation: TaskGroupEditScreenNavigationProp;
  route: TaskGroupEditScreenRouteProp;
}

const systemAdminUserId = 1; 

export default function TaskGroupEditScreen({ navigation, route }: TaskGroupEditScreenProps) {
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const { bottom, right } = useSafeAreaInsets();
  const { taskGroup } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const isEditing = !!taskGroup;

  // Dirty flag for unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = React.useRef<{name: string; description: string; isActive: boolean; isPrivate: boolean} | null>(null);
  
  // Unsaved changes confirmation dialog
  const { dialogState: unsavedChangesDialogState, showDialog: showUnsavedChangesDialog, hideDialog: hideUnsavedChangesDialog } = useConfirmationDialog();
  const navigationActionRef = React.useRef<any>(null);

  // Form state
  const [name, setName] = useState(taskGroup?.name || '');
  const [description, setDescription] = useState(taskGroup?.description || '');
  const [isActive, setIsActive] = useState(taskGroup?.isActive ?? true);
  const [isPrivate, setIsPrivate] = useState(
    isEditing 
      ? (taskGroup?.isPrivate ?? false) // Editing: use server value
      : (user?.isAdmin === false ? true : false) // Creating: auto-set to true if not admin
  );

  // Current task group data state (for refreshing kinds)
  const [currentTaskGroup, setCurrentTaskGroup] = useState<TaskGroupDetailsResponse | null>(taskGroup || null);
  
  // Track if task group has been deleted
  const [isDeleted, setIsDeleted] = useState(false);
  const isDeletingRef = React.useRef(false);

  // Helper function to determine if user can edit inputs
  const canEditInputs = React.useMemo(() => {
    // If creating new task group, always allow editing
    if (!isEditing) return true;
    
    // If user is admin, always allow editing
    if (user?.isAdmin === true) return true;
    
    // If user is not admin and editing existing task group, check if they created it
    if (user?.isAdmin === false && isEditing && taskGroup) {
      return taskGroup.userId === user.id;
    }
    
    return true; // Default to allowing editing
  }, [isEditing, user?.isAdmin, user?.id, taskGroup]);

  // Snackbar state
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Confirmation dialog
  const { dialogState, showDeleteConfirmation, hideDialog } = useConfirmationDialog();

  // Function to fetch updated task group data
  const fetchTaskGroupData = React.useCallback(async () => {
    if (!isEditing || !taskGroup?.id || isDeleted || isDeletingRef.current) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token!);
      const response = await apiClient.get<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.getDetails(taskGroup.id));
      if (!response.success)
      {
        console.error('Failed to fetch task group details:', response.message);
        setError(response.message || 'Failed to fetch task group details');
        return;
      }
      // Double-check that we haven't been deleted while the request was in flight
      if (!isDeleted && !isDeletingRef.current) {
        setCurrentTaskGroup(response.data);
      }
    } catch (err) {
      console.error('Error fetching task group data:', err);
      // Don't show error to user for background refresh
      // If we get a "not found" error, it might mean the task group was deleted
      if (err && typeof err === 'object' && 'message' in err && 
          (err.message as string).toLowerCase().includes('not found')) {
        console.log('Task group not found - it may have been deleted');
        return; // Silently ignore "not found" errors
      }
    }
  }, [isEditing, taskGroup?.id, baseUrl, token, isDeleted]);

  // Use focus effect to refresh data when returning from child screens
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're editing, not on initial load, and not deleted/deleting
      if (isEditing && currentTaskGroup && !isDeleted && !isDeletingRef.current) {
        fetchTaskGroupData();
      }
    }, [isEditing, currentTaskGroup, fetchTaskGroupData, isDeleted])
  );

  // Save initial form values for dirty tracking
  React.useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = { name, description, isActive, isPrivate };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Track form changes for dirty flag
  React.useEffect(() => {
    if (initialValuesRef.current) {
      const hasChanges = 
        name !== initialValuesRef.current.name ||
        description !== initialValuesRef.current.description ||
        isActive !== initialValuesRef.current.isActive ||
        isPrivate !== initialValuesRef.current.isPrivate;
      
      if (hasChanges !== isDirty) {
        setIsDirty(hasChanges);
      }
    }
  }, [name, description, isActive, isPrivate, isDirty]);

  // Prevent navigation when there are unsaved changes
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) {
        return;
      }

      e.preventDefault();
      navigationActionRef.current = e.data.action;

      showUnsavedChangesDialog(
        'Discard changes?',
        'Do you want to discard unsaved changes to this task group?',
        [
          { 
            text: "Cancel", 
            style: 'cancel',
            onPress: () => {
              hideUnsavedChangesDialog();
            }
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setIsDirty(false);
              hideUnsavedChangesDialog();
              if (navigationActionRef.current) {
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, showUnsavedChangesDialog, hideUnsavedChangesDialog]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const apiClient = createApiClient(baseUrl, token!);
      if (isEditing) {
        const updateRequest: TaskGroupUpdateRequest = {
          id: taskGroup!.id,
          isPrivate: isPrivate,
          name: name.trim(),
          description: description.trim(),
          isActive: isActive,
        };
        const response = await apiClient.put<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.update, updateRequest);
        if (!response.success) {
          console.error('Failed to update task group:', response.message);
          setError(response.message || 'Failed to update task group');
          return;
        }
        setSuccess('Task group updated successfully');
      } else {
        const createRequest: TaskGroupCreateRequest = {
          isPrivate: isPrivate,
          name: name.trim(),
          description: description.trim(),
          isActive: isActive,
          userId: user!.id,
        };
        const response = await apiClient.post<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.create, createRequest);
        if (!response.success) {
          console.error('Failed to create task group:', response.message);
          setError(response.message || 'Failed to create task group');
          return;
        }
        setSuccess('Task group created successfully');
      }

      // Reset dirty flag and update initial values snapshot after successful save
      initialValuesRef.current = { name, description, isActive, isPrivate };
      setIsDirty(false);

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err) {
      console.error('Error saving task group:', err);
      setError('Failed to save task group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    const performDelete = async () => {
      setLoading(true);
      isDeletingRef.current = true; // Immediately mark as deleting to prevent any refresh attempts
      try {
        const apiClient = createApiClient(baseUrl, token!);
        const response = await apiClient.delete(API_ROUTES.taskGroups.delete(taskGroup!.id));
        if (!response.success) {
          console.error('Failed to delete task group:', response.message);
          setError(response.message || 'Failed to delete task group');
          isDeletingRef.current = false; // Reset if deletion failed
          setLoading(false);
          return;
        }
        setIsDeleted(true); // Mark as deleted to prevent further refresh attempts
        setSuccess('Task group deleted successfully');

        setTimeout(() => {
        // Navigate back immediately after successful deletion
          navigation.goBack();
        }, 2000); // 2 second delay to show the success message
      } catch (err) {
        console.error('Error deleting task group:', err);
        setError('Failed to delete task group. You might need to delete associated tasks first.');
        isDeletingRef.current = false; // Reset if deletion failed
      } finally {
        setLoading(false);
      }
    };

    showDeleteConfirmation('Task Group', performDelete);
  };

  const handleManageKinds = () => {
    if (!isEditing) {
      setError('Please save the task group before managing kinds.');
      return;
    }
    navigation.navigate('TaskKinds', { 
      groupId: currentTaskGroup!.id, 
      groupName: currentTaskGroup!.name 
    });
  };

  const handleKindPress = (kind: TaskKindResponse) => {
    navigation.navigate('TaskKindEdit', {
      taskKind: kind as any, // Cast to avoid type issues
      groupId: currentTaskGroup!.id,
      // onTaskKindSaved: () => {
      //   // Refresh the task group data when kind is saved (only if not deleted/deleting)
      //   if (!isDeleted && !isDeletingRef.current) {
      //     fetchTaskGroupData();
      //   }
      // }
    });
  };

  return (
    <View style={localStyles.container}>
      <ScrollView style={localStyles.scrollView} contentContainerStyle={localStyles.scrollContent}>
        <View style={localStyles.card}>
          <View style={localStyles.cardContent}>
            <Text variant="displaySmall" style={styles.gameTitle}>
              {isEditing ? 'Edit Task Group' : 'New Task Group'}
            </Text>

            <View>
              <TextInput
                label="Name *"
                value={name}
                onChangeText={setName}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={localStyles.textInputContentStyle}
                textColor={colors.primary}
                mode="outlined"
                theme={{
                  roundness: 12,
                }}
                disabled={loading || !canEditInputs}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Task group name input field"
                accessibilityHint="Enter the name for this task group"
                accessibilityState={{ disabled: loading || !canEditInputs }}
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={localStyles.textInputContentStyle}
                textColor={colors.primary}
                mode="outlined"
                multiline
                numberOfLines={3}
                theme={{
                  roundness: 12,
                }}
                disabled={loading || !canEditInputs}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Task group description input field"
                accessibilityHint="Enter optional description for this task group"
                accessibilityState={{ disabled: loading || !canEditInputs }}
              />

              <View style={localStyles.switchContainer}>
                <Text variant='bodyLarge'>Active</Text>
                <Switch 
                  value={isActive} 
                  onValueChange={setIsActive} 
                  disabled={loading || !canEditInputs}
                  accessible={true}
                  accessibilityRole="switch"
                  accessibilityLabel="Active status for task group"
                  accessibilityHint="Toggle whether this task group is active and available for use"
                  accessibilityState={{ checked: isActive, disabled: loading || !canEditInputs }}
                />
              </View>
              <View style={localStyles.switchContainer}>
                  <Text variant='bodyLarge'>Private</Text>
                  <Switch 
                    value={isPrivate} 
                    onValueChange={setIsPrivate} 
                    disabled={loading || !canEditInputs || user?.isAdmin === false}
                    accessible={true}
                    accessibilityRole="switch"
                    accessibilityLabel="Private status for task group"
                    accessibilityHint="Toggle whether this task group is private to you only"
                    accessibilityState={{ checked: isPrivate, disabled: loading || !canEditInputs || user?.isAdmin === false }}
                  />
              </View>
            </View>
            {isEditing && taskGroup?.id && (
              <View style={localStyles.formSection}>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created By:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskGroup.createdByUser ? `${taskGroup.createdByUser.firstName} ${taskGroup.createdByUser.lastName}` : 
                      (taskGroup.createdBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                  </Text>
                </View>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created At:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskGroup.createdAt ? formatDateForDisplay(convertUTCToLocal(taskGroup.createdAt)) : 'Unknown'}
                  </Text>
                </View>

                {taskGroup.updatedAt && (
                  <>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated By:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskGroup.updatedByUser ? `${taskGroup.updatedByUser.firstName} ${taskGroup.updatedByUser.lastName}` : 
                        (taskGroup.updatedBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                    </Text>
                  </View>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated At:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskGroup.updatedAt ? formatDateForDisplay(convertUTCToLocal(taskGroup.updatedAt)) : 'Unknown'}
                    </Text>
                  </View>
                  </>
                )}
              </View>
            )}

            {isEditing && taskGroup?.id && (
              <View style={localStyles.kindsInfoContainer}>
                <Text variant='titleMedium' style={localStyles.kindsInfoTitle}>
                  Task Kinds ({currentTaskGroup?.kinds?.length || 0})
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleManageKinds}
                  compact
                  style={localStyles.manageButton}
                >
                  Manage All
                </Button>
              </View>
            )}
          </View>
        </View>

        {/* Task Kinds List - Outside Card to allow full width */}
        {isEditing && currentTaskGroup?.kinds && currentTaskGroup.kinds.length > 0 && (
          <FlatList
            data={currentTaskGroup.kinds}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  localStyles.kindItem,
                  !item.isActive && localStyles.inactiveKindItem
                ]}
                onPress={() => handleKindPress(item)}
              >
                <View style={localStyles.kindContent}>
                  <View style={localStyles.kindHeader}>
                    <Text style={localStyles.kindTitle}>
                      {item.name}
                    </Text>
                  </View>
                  {item.description && (
                    <Text variant='bodySmall' style={localStyles.kindDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={localStyles.kindMeta}>
                    <Text variant='bodySmall' style={[localStyles.metaText, { color: item.isActive ? colors.success : colors.textSecondary }]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            contentContainerStyle={localStyles.kindsList}
          />
        )}

        {isEditing && (!currentTaskGroup?.kinds || currentTaskGroup.kinds.length === 0) && (
          <View style={localStyles.emptyKinds}>
            <Text variant='bodyMedium' style={localStyles.emptyText}>
              No kinds yet. Tap "Manage All" to add some.
            </Text>
          </View>
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

      {/* FAB Group for editing (with delete option) or regular FAB for creating */}
      {/* Hide FAB if user can't edit inputs */}
      {canEditInputs && (
        <>
          {isEditing ? (
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-vertical'}
              actions={[
                {
                  icon: 'delete',
                  label: 'Delete',
                  onPress: handleDelete,
                  style: { backgroundColor: colors.error },
                  color: 'white'
                },
                {
                  icon: 'content-save',
                  label: 'Save',
                  onPress: handleSave,
                  style: { backgroundColor: colors.accent },
                  color: 'white'
                },
              ]}
              onStateChange={({ open }) => setFabOpen(open)}
              style={{ paddingBottom: bottom + 16, paddingRight: right + 16 }}
              fabStyle={{ backgroundColor: colors.accent }}
              color="white"
            />
          ) : (
            <FAB
              icon="content-save"
              onPress={handleSave}
              style={[
                localStyles.createFab,
                { 
                  bottom: bottom + 16,
                  right: right + 16,
                }
              ]}
              color="white"
              disabled={loading}
            />
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmationDialog
        visible={unsavedChangesDialogState.visible}
        title={unsavedChangesDialogState.title}
        message={unsavedChangesDialogState.message}
        buttons={unsavedChangesDialogState.buttons}
        onDismiss={hideUnsavedChangesDialog}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  card: {
    backgroundColor: colors.backgroundDefault,
    marginBottom: 0,
    elevation: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    marginBottom: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  textInputStyle: {
    backgroundColor: colors.backgroundPaper,
  },
  textInputContentStyle: {
    paddingHorizontal: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  historyLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 100,
    marginRight: 16,
  },
  historyValue: {
    color: colors.textPrimary,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  kindsInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  kindsInfoTitle: {
    color: colors.textPrimary,
  },
  manageButton: {
    borderColor: colors.primary,
  },
  kindsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  kindItem: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    minHeight: 120,
    marginHorizontal: 0,
  },
  kindContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  kindHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kindTitle: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  kindDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
    fontSize: 12,
  },
  kindMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom of card
  },
  metaText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyKinds: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createFab: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  formSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inactiveKindItem: {
    opacity: 0.5,
  },
});
