/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Switch, FAB } from 'react-native-paper';
import { Snackbar } from '../../components/StyledText';
import { Text } from '../../components/StyledText';
import { colors, styles } from '../../defaultTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  TaskCategoryCreateRequest, 
  TaskCategoryUpdateRequest, 
  TaskKindDetailsResponse,
  TaskGroupDetailsResponse,
  useAuth, 
  API_ROUTES, 
  useConfig,
  DataResponse,
  TaskCategoryDetailsResponse
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { convertUTCToLocal, formatDateForDisplay } from '../../utils/dateUtils';

type TaskCategoryEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskCategoryEdit'>;
type TaskCategoryEditScreenRouteProp = RouteProp<RootStackParamList, 'TaskCategoryEdit'>;

interface TaskCategoryEditScreenProps {
  navigation: TaskCategoryEditScreenNavigationProp;
  route: TaskCategoryEditScreenRouteProp;
}

const systemAdminUserId = 1; 

export default function TaskCategoryEditScreen({ navigation, route }: TaskCategoryEditScreenProps) {
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const { taskCategory, kindId } = route.params;
  const { bottom, right } = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const isEditing = !!taskCategory;

  // isDirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef({ name: '', description: '', isActive: true });
  const navigationActionRef = useRef<any>(null);

  // State for task kind and task group details
  const [_taskKind, setTaskKind] = useState<TaskKindDetailsResponse | null>(null);
  const [taskGroup, setTaskGroup] = useState<TaskGroupDetailsResponse | null>(null);

  // Helper function to determine if user can edit inputs
  const canEditInputs = React.useMemo(() => {
    // If creating new task category, always allow editing
    if (!isEditing) return true;
    
    // If no user or task group loaded yet, don't allow editing
    if (!user || !taskGroup) return false;
    
    // If user is admin, always allow editing
    if (user.isAdmin === true) return true;
    
    // If user is not admin and editing existing task category, check if they created the task group
    if (user.isAdmin === false && isEditing && taskGroup) {
      return taskGroup.userId === user.id;
    }
    
    return true; // Default to allowing editing
  }, [isEditing, user, taskGroup]);

  // Fetch task kind details to get the group ID, then fetch task group details
  const fetchTaskKindAndGroupDetails = React.useCallback(async () => {
    if (!kindId || !token) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      
      // First, fetch task kind details to get the group ID
      const kindResponse = await apiClient.get<DataResponse<TaskKindDetailsResponse>>(API_ROUTES.taskKinds.getDetails(kindId));
      if (!kindResponse.success) {
        console.error('Failed to fetch task kind details:', kindResponse.message);
        setError(kindResponse.message || 'Failed to fetch task kind details');
        return;
      }
      setTaskKind(kindResponse.data);
      
      // Then, fetch task group details using the group ID
      if (kindResponse.data.groupId) {
        const groupResponse = await apiClient.get<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.getDetails(kindResponse.data.groupId));
        if (!groupResponse.success) {
          console.error('Failed to fetch task group details:', groupResponse.message);
          setError(groupResponse.message || 'Failed to fetch task group details');
          return;
        }
        setTaskGroup(groupResponse.data);
      }
    } catch (err) {
      console.error('Error fetching task kind and group details:', err);
    }
  }, [kindId, baseUrl, token]);

  // Load task kind and task group details on mount
  React.useEffect(() => {
    fetchTaskKindAndGroupDetails();
  }, [fetchTaskKindAndGroupDetails]);

  // Form state
  const [name, setName] = useState(taskCategory?.name || '');
  const [description, setDescription] = useState(taskCategory?.description || '');
  const [isActive, setIsActive] = useState(taskCategory?.isActive ?? true);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Confirmation dialog
  const { dialogState, showDeleteConfirmation, showDialog, hideDialog } = useConfirmationDialog();

  // Track initial values for isDirty comparison
  useEffect(() => {
    initialValuesRef.current = {
      name: taskCategory?.name || '',
      description: taskCategory?.description || '',
      isActive: taskCategory?.isActive ?? true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if form has unsaved changes
  useEffect(() => {
    const hasChanges = 
      name !== initialValuesRef.current.name ||
      description !== initialValuesRef.current.description ||
      isActive !== initialValuesRef.current.isActive;
    
    setIsDirty(hasChanges);
  }, [name, description, isActive]);

  // Navigation protection - warn if attempting to navigate with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || loading) {
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
              setIsDirty(false);
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
  }, [isDirty, loading, navigation]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const apiClient = createApiClient(baseUrl, token!);
      if (isEditing) {
        const updateRequest: TaskCategoryUpdateRequest = {
          id: taskCategory!.id,
          name: name.trim(),
          description: description.trim(),
          isActive,
          kindId,
        };
        const response = await apiClient.put<DataResponse<TaskCategoryDetailsResponse>>(API_ROUTES.taskCategories.update, updateRequest);
        if (!response.success) {
          setError(response.message || 'Failed to update task category');
          setLoading(false);
          return;
        }
        setSuccess('Task category updated successfully');
      } else {
        const createRequest: TaskCategoryCreateRequest = {
          name: name.trim(),
          description: description.trim(),
          isActive,
          kindId,
        };
        const response = await apiClient.post<DataResponse<TaskCategoryDetailsResponse>>(API_ROUTES.taskCategories.create, createRequest);
        if (!response.success) {
          setError(response.message || 'Failed to create task category');
          setLoading(false);
          return;
        }
        setSuccess('Task category created successfully');
      }

      // Reset isDirty after successful save
      setIsDirty(false);
      initialValuesRef.current = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      // Navigate back to TaskCategories with savedTaskCategory parameter to trigger refresh
      navigation.navigate('TaskCategories', { 
        kindId,
        kindName: '', // This will be ignored since the TaskCategories screen already has this
        savedTaskCategory: true 
      });
    } catch (err) {
      console.error('Error saving task category:', err);
      setError('Failed to save task category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    const performDelete = async () => {
      setLoading(true);
      try {
        const apiClient = createApiClient(baseUrl, token!);
        const response = await apiClient.delete(API_ROUTES.taskCategories.delete(taskCategory!.id));
        if (!response.success) {
          setError(response.message || 'Failed to delete task category');
          setLoading(false);
          return;
        }
        setSuccess('Task category deleted successfully');
        // Delay navigation to allow the success toast to be visible
        setTimeout(() => {
          // Navigate back to TaskCategories with savedTaskCategory parameter to trigger refresh
          navigation.navigate('TaskCategories', { 
            kindId,
            kindName: '', // This will be ignored since the TaskCategories screen already has this
            savedTaskCategory: true 
          });
        }, 2000); // 2 second delay to show the success message
      } catch (err) {
        console.error('Error deleting task category:', err);
        setError('Failed to delete task category');
      } finally {
        setLoading(false);
      }
    };

    showDeleteConfirmation('Task Category', performDelete);
  };

  return (
    <View style={localStyles.container}>
      <ScrollView style={localStyles.scrollView} contentContainerStyle={localStyles.scrollContent}>
        <View style={localStyles.card}>
          <View style={localStyles.cardContent}>
            <Text variant="displaySmall" style={styles.gameTitle}>
              {isEditing ? 'Edit Task Category' : 'New Task Category'}
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
                accessibilityLabel="Task category name input field"
                accessibilityHint="Enter the name for this task category"
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
                accessibilityLabel="Task category description input field"
                accessibilityHint="Enter optional description for this task category"
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
                  accessibilityLabel="Active status for task category"
                  accessibilityHint="Toggle whether this task category is active and available for use"
                  accessibilityState={{ checked: isActive, disabled: loading || !canEditInputs }}
                />
              </View>
            </View>

            {isEditing && taskCategory?.id && (
              <View style={localStyles.formSection}>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created By:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskCategory.createdByUser ? `${taskCategory.createdByUser.firstName} ${taskCategory.createdByUser.lastName}` : 
                      (taskCategory.createdBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                  </Text>
                </View>
                <View style={localStyles.historyRow}>
                  <Text variant='bodyMedium' style={localStyles.historyLabel}>Created At:</Text>
                  <Text variant='bodyMedium' style={localStyles.historyValue}>
                    {taskCategory.createdAt ? formatDateForDisplay(convertUTCToLocal(taskCategory.createdAt)) : 'Unknown'}
                  </Text>
                </View>

                {taskCategory.updatedAt && (
                  <>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated By:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskCategory.updatedByUser ? `${taskCategory.createdByUser.firstName} ${taskCategory.updatedByUser.lastName}` : 
                        (taskCategory.updatedBy === systemAdminUserId ? 'DoDone' : 'Unknown')}
                    </Text>
                  </View>
                  <View style={localStyles.historyRow}>
                    <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated At:</Text>
                    <Text variant='bodyMedium' style={localStyles.historyValue}>
                      {taskCategory.updatedAt ? formatDateForDisplay(convertUTCToLocal(taskCategory.updatedAt)) : 'Unknown'}
                    </Text>
                  </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

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
    paddingBottom: 20, // Reduced padding since we're removing the bottom bar
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
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
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
