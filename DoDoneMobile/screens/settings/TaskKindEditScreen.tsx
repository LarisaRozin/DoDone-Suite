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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  TaskKindCreateRequest, 
  TaskKindUpdateRequest, 
  TaskCategoryResponse,
  TaskKindDetailsResponse,
  TaskGroupDetailsResponse,
  useAuth, 
  API_ROUTES, 
  useConfig,
  DataResponse
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { convertUTCToLocal, formatDateForDisplay } from '../../utils/dateUtils';

type TaskKindEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskKindEdit'>;
type TaskKindEditScreenRouteProp = RouteProp<RootStackParamList, 'TaskKindEdit'>;

interface TaskKindEditScreenProps {
  navigation: TaskKindEditScreenNavigationProp;
  route: TaskKindEditScreenRouteProp;
}

const systemAdminUserId = 1; 

export default function TaskKindEditScreen({ navigation, route }: TaskKindEditScreenProps) {
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const { taskKind, groupId } = route.params;
  const { bottom, right } = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const isEditing = !!taskKind;

  // Dirty flag for unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = React.useRef<{name: string; description: string; isActive: boolean} | null>(null);
  
  // Unsaved changes confirmation dialog
  const { dialogState: unsavedChangesDialogState, showDialog: showUnsavedChangesDialog, hideDialog: hideUnsavedChangesDialog } = useConfirmationDialog();
  const navigationActionRef = React.useRef<any>(null);

  // State for task group details
  const [taskGroup, setTaskGroup] = useState<TaskGroupDetailsResponse | null>(null);

  // Helper function to determine if user can edit inputs
  const canEditInputs = React.useMemo(() => {
    // If creating new task kind, always allow editing
    if (!isEditing) return true;
    
    // If no user or task group loaded yet, don't allow editing
    if (!user || !taskGroup) return false;
    
    // If user is admin, always allow editing
    if (user.isAdmin === true) return true;
    
    // If user is not admin and editing existing task kind, check if they created the task group
    if (user.isAdmin === false && isEditing && taskGroup) {
      return taskGroup.userId === user.id;
    }
    
    return true; // Default to allowing editing
  }, [isEditing, user, taskGroup]);

  // Form state
  const [name, setName] = useState(taskKind?.name || '');
  const [description, setDescription] = useState(taskKind?.description || '');
  const [isActive, setIsActive] = useState(taskKind?.isActive ?? true);

  // Current task kind data state (for refreshing categories)
  const [currentTaskKind, setCurrentTaskKind] = useState<TaskKindDetailsResponse | null>(taskKind || null);
  
  // Track if task kind has been deleted
  const [isDeleted, setIsDeleted] = useState(false);
  const isDeletingRef = React.useRef(false);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Confirmation dialog
  const { dialogState, showDeleteConfirmation, hideDialog } = useConfirmationDialog();

  // Fetch task group details to determine edit permissions
  const fetchTaskGroupDetails = React.useCallback(async () => {
    if (!groupId || !token) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.get<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.getDetails(groupId));
      if (!response.success) {
        console.error('Failed to fetch task group details:', response.message);
        setError(response.message || 'Failed to fetch task group details');
        return;
      }
      setTaskGroup(response.data);
    } catch (err) {
      console.error('Error fetching task group details:', err);
    }
  }, [groupId, baseUrl, token]);

  // Load task group details on mount
  React.useEffect(() => {
    fetchTaskGroupDetails();
  }, [fetchTaskGroupDetails]);

  // Function to fetch updated task kind data
  const fetchTaskKindData = React.useCallback(async () => {
    if (!isEditing || !taskKind?.id || isDeleted || isDeletingRef.current) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token!);
      const response = await apiClient.get<DataResponse<TaskKindDetailsResponse>>(API_ROUTES.taskKinds.getDetails(taskKind.id));
      if (!response.success) {
        console.error('Failed to fetch task kind details:', response.message);
        setError(response.message || 'Failed to fetch task kind details');
        return;
      }
      // Double-check that we haven't been deleted while the request was in flight
      if (!isDeleted && !isDeletingRef.current) {
        setCurrentTaskKind(response.data);
      }
    } catch (err) {
      console.error('Error fetching task kind data:', err);
      // Don't show error to user for background refresh
      // If we get a "not found" error, it might mean the task kind was deleted
      if (err && typeof err === 'object' && 'message' in err && 
          (err.message as string).toLowerCase().includes('not found')) {
        console.log('Task kind not found - it may have been deleted');
        return; // Silently ignore "not found" errors
      }
    }
  }, [isEditing, taskKind?.id, baseUrl, token, isDeleted]);

  // Use focus effect to refresh data when returning from child screens
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're editing, not on initial load, and not deleted/deleting
      if (isEditing && currentTaskKind && !isDeleted && !isDeletingRef.current) {
        fetchTaskKindData();
      }
    }, [isEditing, currentTaskKind, fetchTaskKindData, isDeleted])
  );

  // Save initial form values for dirty tracking
  React.useEffect(() => {
    if (!initialValuesRef.current) {
      initialValuesRef.current = { name, description, isActive };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Track form changes for dirty flag
  React.useEffect(() => {
    if (initialValuesRef.current) {
      const hasChanges = 
        name !== initialValuesRef.current.name ||
        description !== initialValuesRef.current.description ||
        isActive !== initialValuesRef.current.isActive;
      
      if (hasChanges !== isDirty) {
        setIsDirty(hasChanges);
      }
    }
  }, [name, description, isActive, isDirty]);

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
        'Do you want to discard unsaved changes to this task kind?',
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
        const updateRequest: TaskKindUpdateRequest = {
          id: taskKind!.id,
          name: name.trim(),
          description: description.trim(),
          isActive,
          groupId,
        };
        await apiClient.put(API_ROUTES.taskKinds.update, updateRequest);
        setSuccess('Task kind updated successfully');
      } else {
        const createRequest: TaskKindCreateRequest = {
          name: name.trim(),
          description: description.trim(),
          isActive,
          groupId,
        };
        await apiClient.post(API_ROUTES.taskKinds.create, createRequest);
        setSuccess('Task kind created successfully');
      }

      // Reset dirty flag and update initial values snapshot after successful save
      initialValuesRef.current = { name, description, isActive };
      setIsDirty(false);

      // Navigate back to TaskKinds with savedTaskKind parameter to trigger refresh
      navigation.navigate('TaskKinds', { 
        groupId,
        groupName: '', // This will be ignored since the TaskKinds screen already has this
        savedTaskKind: true 
      });
    } catch (err) {
      console.error('Error saving task kind:', err);
      setError('Failed to save task kind');
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
        await apiClient.delete(API_ROUTES.taskKinds.delete(taskKind!.id));
        setIsDeleted(true); // Mark as deleted to prevent further refresh attempts
        setSuccess('Task kind deleted successfully');
        // Navigate back to TaskKinds with savedTaskKind parameter to trigger refresh

        setTimeout(() => {
          navigation.navigate('TaskKinds', { 
            groupId,
            groupName: '', // This will be ignored since the TaskKinds screen already has this
            savedTaskKind: true 
          });
        }, 2000); // 2 second delay to show the success message
      } catch (err) {
        console.error('Error deleting task kind:', err);
        setError('Failed to delete task kind. You might need to delete associated tasks first.');
        isDeletingRef.current = false; // Reset if deletion failed
      } finally {
        setLoading(false);
      }
    };

    showDeleteConfirmation('Task Kind', performDelete);
  };

  const handleManageCategories = () => {
    if (!isEditing) {
      setError('Please save the task kind before managing categories.');
      return;
    }
    navigation.navigate('TaskCategories', { 
      kindId: currentTaskKind!.id, 
      kindName: currentTaskKind!.name 
    });
  };

  const handleCategoryPress = (category: TaskCategoryResponse) => {
    navigation.navigate('TaskCategoryEdit', {
      taskCategory: category as any, // Cast to avoid type issues
      kindId: currentTaskKind!.id,
      // onTaskCategorySaved: () => {
      //   // Refresh the task kind data when category is saved (only if not deleted/deleting)
      //   if (!isDeleted && !isDeletingRef.current) {
      //     fetchTaskKindData();
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
              {isEditing ? 'Edit Task Kind' : 'New Task Kind'}
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
                accessibilityLabel="Task kind name input field"
                accessibilityHint="Enter the name for this task kind"
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
                accessibilityLabel="Task kind description input field"
                accessibilityHint="Enter optional description for this task kind"
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
                  accessibilityLabel="Active status for task kind"
                  accessibilityHint="Toggle whether this task kind is active and available for use"
                  accessibilityState={{ checked: isActive, disabled: loading || !canEditInputs }}
                />
              </View>
            </View>

            {isEditing && taskKind?.id && (
              <View style={localStyles.formSection}>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created By:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskKind.createdByUser ? `${taskKind.createdByUser.firstName} ${taskKind.createdByUser.lastName}` : 
                      (taskKind.createdBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                  </Text>
                </View>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created At:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskKind.createdAt ? formatDateForDisplay(convertUTCToLocal(taskKind.createdAt)) : 'Unknown'}
                  </Text>
                </View>

                {taskKind.updatedAt && (
                  <>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated By:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskKind.updatedByUser ? `${taskKind.updatedByUser.firstName} ${taskKind.updatedByUser.lastName}` : 
                        (taskKind.updatedBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                    </Text>
                  </View>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated At:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskKind.updatedAt ? formatDateForDisplay(convertUTCToLocal(taskKind.updatedAt)) : 'Unknown'}
                    </Text>
                  </View>
                  </>
                )}
              </View>
            )}

            {isEditing && taskKind?.id && (
              <View style={localStyles.categoriesInfoContainer}>
                <Text variant='titleMedium' style={localStyles.categoriesInfoTitle}>
                  Task Categories ({currentTaskKind?.categories?.length || 0})
                </Text>
                <Button
                  mode="outlined"
                  onPress={handleManageCategories}
                  compact
                  style={localStyles.manageButton}
                >
                  Manage All
                </Button>
              </View>
            )}
          </View>
        </View>

        {/* Task Categories List - Outside Card to allow full width */}
        {isEditing && currentTaskKind?.categories && currentTaskKind.categories.length > 0 && (
          <FlatList
            data={currentTaskKind.categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  localStyles.categoryItem,
                  // eslint-disable-next-line react-native/no-inline-styles
                  { opacity: item.isActive ? 1 : 0.5 }
                ]}
                onPress={() => handleCategoryPress(item)}
              >
                <View style={localStyles.categoryContent}>
                  <View style={localStyles.categoryHeader}>
                    <Text style={localStyles.categoryTitle}>
                      {item.name}
                    </Text>
                  </View>
                  {item.description && (
                    <Text variant='bodySmall' style={localStyles.categoryDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={localStyles.categoryMeta}>
                    <Text variant='bodySmall' style={[localStyles.metaText, { color: item.isActive ? colors.success : colors.textSecondary }]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            contentContainerStyle={localStyles.categoriesList}
          />
        )}

        {isEditing && (!currentTaskKind?.categories || currentTaskKind.categories.length === 0) && (
          <View style={localStyles.emptyCategories}>
            <Text variant='bodyMedium' style={localStyles.emptyText}>
              No categories yet. Tap "Manage All" to add some.
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
              loading={loading}
              disabled={loading}
              color="white"
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
    marginBottom: 20,
    paddingVertical: 8,
  },
  categoriesInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  categoriesInfoTitle: {
    color: colors.textPrimary,
  },
  manageButton: {
    borderColor: colors.primary,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categoryItem: {
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
  categoryContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryTitle: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  categoryDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
    fontSize: 12,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom of card
  },
  metaText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyCategories: {
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
    marginTop: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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

});
