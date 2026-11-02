/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Switch, FAB, IconButton } from 'react-native-paper';
import { Snackbar } from '../components/StyledText';
import { Text, Button, Card } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, styles } from '../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { TaskItemCreateRequest, TaskItemUpdateRequest, useAuth, API_ROUTES, useTeam, PagedListRequestBuilder, SortDirection, useGrades, TaskItemPriority, useConfig, BonusApprovalRequest, TaskItemAllowanceApprovalRequest, SubscriptionTier, UNLIMITED, SYSTEM_USER_ID, DELETED_USER_ID } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';
import DropdownComponent from '../components/Dropdown';
import { DatePickerComponent } from '../components/DatePicker';
import { SliderComponent } from '../components/Slider';
import { TaskGroupKindCategoryDropdowns } from '../components/TaskGroupKindCategoryDropdowns';
import Grade from '../components/Grade';
import Credits from '../components/Credits';
import { convertUTCToLocal, convertLocalToUTC, formatDateForDisplay } from '../utils/dateUtils';
import UserAvatar from '../components/UserAvatar';
import TaskCommentsPreview from '../components/TaskCommentsPreview';
import TaskCommentsModal from '../components/TaskCommentsModal';
import TaskDetailsPreview from '../components/TaskDetailsPreview';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { UpgradeModal } from '../components/UpgradeModal';
import { useSubscription } from '../contexts/SubscriptionContext';

type TaskEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskEdit'>;
type TaskEditScreenRouteProp = RouteProp<RootStackParamList, 'TaskEdit'>;

interface TaskEditScreenProps {
  navigation: TaskEditScreenNavigationProp;
  route: TaskEditScreenRouteProp;
}

// Grade color function to match MainAppScreen
const getGradeColor = (letterGrade: string): string => {
  switch (letterGrade) {
    case 'A+':
    case 'A':
    case 'A-':
      return colors.success;
    case 'B+':
    case 'B':
    case 'B-':
      return colors.accent;
    case 'C+':
    case 'C':
    case 'C-':
      return colors.warning;
    case 'D+':
    case 'D':
    case 'F':
      return colors.error;
    default:
      return colors.textSecondary;
  }
};

const getCreditsColor = (credits: number): string => {
  switch (credits) {
    case 5:
      return colors.error;
    case 4:
      return colors.errorLight;
    case 3:
      return colors.warning;
    case 2:
      return colors.accent;
    case 1:
      return colors.success;
    default:
      return colors.textSecondary;
  }
};

export default function TaskEditScreen({ navigation, route }: TaskEditScreenProps) {
  const { baseUrl } = useConfig();
  const { user, token } = useAuth();
  const { grades } = useGrades();

  // if (user) {
  //   user.isAdmin = true;  // TODO: Remove  !!!!!!!!!!!!!!!!!!!!!!!!!!!
  // }

  // Create paged request for team
  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 50) // Get team members
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { limits } = useSubscription();
  const { teamMembersList, teamDetails, allowanceIntervals, fetchTeamDetails } = useTeam(teamRequest);
  const allowanceIntervalsForDropdown = limits && !limits.allowanceIntervalsLimit.canAdd && limits.allowanceIntervalsLimit.max > 0 ? allowanceIntervals.slice(0, limits.allowanceIntervalsLimit.max) : allowanceIntervals;

  // Load team details when component mounts
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  const team = React.useMemo(() => teamMembersList?.data || [], [teamMembersList?.data]);

  const filteredTeam = React.useMemo(() => {
    const filtered = team.slice(); // Create a copy

    // Sort so current user appears first, then active users, then inactive users
    filtered.sort((a, b) => {
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      
      // Sort by active status (active users first)
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      
      // Within the same active status, sort alphabetically by first name
      return a.firstName?.localeCompare(b.firstName || '') || 0;
    });

    if (limits?.teamMembersLimit.canAdd === false && limits.teamMembersLimit.max !== UNLIMITED) {
      filtered.splice(limits.teamMembersLimit.max);
    }
    return filtered;
  }, [team, user?.id, limits]);

  const [_loading, setLoading] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const initialFormDataRef = React.useRef<any>(null);

  // State for dropdowns
  const [selectedPriority, setSelectedPriority] = useState<TaskItemPriority>(TaskItemPriority.Medium);
  const [assignedToTeamMember, setAssignedToTeamMember] = useState<any | null>(user);
  const [selectedAllowanceInterval, setSelectedAllowanceInterval] = useState<any | null>(null);
  const [isTaskDetailsExpanded, setIsTaskDetailsExpanded] = useState(false);

  // Ref to track if allowance interval has been auto-initialized for new tasks
  const allowanceIntervalAutoInitialized = React.useRef(false);

  // State for comments modal
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  // State for bonus approval/rejection dialog
  const [bonusDialogVisible, setBonusDialogVisible] = useState(false);
  const [bonusDialogMode, setBonusDialogMode] = useState<'approve' | 'reject'>('approve');
  const [bonusComment, setBonusComment] = useState('');
  const [approvedBonus, setApprovedBonus] = useState('');

  // State for edit bonus confirmation dialog
  const [editBonusDialogVisible, setEditBonusDialogVisible] = useState(false);

  // State for allowance approval/rejection dialog
  const [allowanceDialogVisible, setAllowanceDialogVisible] = useState(false);
  const [allowanceDialogMode, setAllowanceDialogMode] = useState<'approve' | 'reject'>('approve');
  const [allowanceComment, setAllowanceComment] = useState('');
  const [allowanceDialogIntervalId, setAllowanceDialogIntervalId] = useState<number | null>(null);

  // State for edit allowance approval confirmation dialog
  const [editAllowanceDialogVisible, setEditAllowanceDialogVisible] = useState(false);

  // State for upgrade modal
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  // Confirmation dialog
  const { dialogState, showDeleteConfirmation, hideDialog } = useConfirmationDialog();
  
  // Unsaved changes confirmation dialog
  const { dialogState: unsavedChangesDialogState, showDialog: showUnsavedChangesDialog, hideDialog: hideUnsavedChangesDialog } = useConfirmationDialog();
  const navigationActionRef = React.useRef<any>(null);

  // Handle comments changes to refresh TaskCommentsPreview components
  const handleCommentsChanged = React.useCallback(() => {
    // Increment the refresh key to force re-render of TaskCommentsPreview components
    setCommentsRefreshKey(prev => prev + 1);
  }, []);

  // Accordion icon component
  const AccordionIcon = React.useCallback(() => (
    <View 
      style={localStyles.accordionIconContainer}
      accessibilityLabel="Task settings"
      accessibilityRole="none"
    >
      <Text style={localStyles.accordionIcon} accessibilityLabel="">⚙️</Text>
    </View>
  ), []);

  // Accordion toggle button component
  const AccordionToggleButton = React.useCallback(() => (
    <View style={localStyles.toggleButtonContainer}>
      <IconButton 
        icon={isTaskDetailsExpanded ? "chevron-up" : "chevron-down"} 
        onPress={() => setIsTaskDetailsExpanded(!isTaskDetailsExpanded)}
        style={localStyles.accordionToggle}
        iconColor={colors.primary}
        size={20}
        accessibilityRole="button"
        accessibilityLabel={isTaskDetailsExpanded ? "Collapse task properties" : "Expand task properties"}
        accessibilityHint={isTaskDetailsExpanded ? "Hide task property settings" : "Show task property settings"}
      />
    </View>
  ), [isTaskDetailsExpanded]);

  const { taskItem } = route.params || {};
  const [currentTaskItem, setCurrentTaskItem] = useState(taskItem);
  const [isEditing, setIsEditing] = useState(!!taskItem);
  const [isNew, setIsNew] = useState(!isEditing);

  const createdByMember = React.useMemo(() => {
    if (!isEditing) {
      return user || null;
    }
    
    // Try to find the creator in the team first
    const foundMember = team.find(m => m.id === currentTaskItem?.createdBy);
    if (foundMember) {
      return foundMember;
    }
    
    // If not found in team but the creator is the current user, use the user object
    if (currentTaskItem?.createdBy === user?.id) {
      return user;
    }
    
    return null;
  }, [isEditing, team, currentTaskItem?.createdBy, user]);

  const updatedByMember = isEditing ? 
    team.find(m => m.id === currentTaskItem?.updatedBy) || 
    (currentTaskItem?.updatedBy === user?.id ? user : null) : 
    user || null;

  const allowanceApprovedByMember = isEditing ? 
    team.find(m => m.id === currentTaskItem?.allowanceApprovalStatusBy ) || 
    (currentTaskItem?.allowanceApprovalStatusBy === user?.id ? user : null) : 
    user || null;

  const bonusApprovedByMember = isEditing ? 
    team.find(m => m.id === currentTaskItem?.bonusStatusBy ) || 
    (currentTaskItem?.bonusStatusBy === user?.id ? user : null) : 
    user || null;

  // Reset auto-initialization flag when editing mode changes
  React.useEffect(() => {
    allowanceIntervalAutoInitialized.current = false;
  }, [isEditing]);

  // Function to refresh task data
  const refreshTaskData = React.useCallback(async () => {
    if (!currentTaskItem?.id || !token) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.tasks.getDetails(currentTaskItem.id);
      
      if (response && typeof response === 'object') {
        let updatedTask = null;
        
        if ('Data' in response && response.Success) {
          updatedTask = response.Data;
        } else if (response.id) {
          // Direct task object
          updatedTask = response;
        }
        
        if (updatedTask) {
          setCurrentTaskItem(updatedTask);
          
          // Update form data with the fresh task details
          setFormData((prevFormData: any) => ({
            ...prevFormData,
            details: updatedTask.details,
            // Update other fields that might have changed
            name: updatedTask.name || prevFormData.name,
            description: updatedTask.description || prevFormData.description,
            isActive: updatedTask.isActive ?? prevFormData.isActive,
            isArchived: updatedTask.isArchived ?? prevFormData.isArchived,
            isPinned: updatedTask.isPinned ?? prevFormData.isPinned,
            isPrivate: updatedTask.isPrivate ?? prevFormData.isPrivate,
            priority: updatedTask.priority !== undefined ? updatedTask.priority : prevFormData.priority,
            assignedTo: updatedTask.assignedTo || prevFormData.assignedTo,
            assignedBy: updatedTask.assignedBy || prevFormData.assignedBy,
            assignedAt: updatedTask.assignedAt || prevFormData.assignedAt,
            groupId: updatedTask.groupId || prevFormData.groupId,
            kindId: updatedTask.kindId || prevFormData.kindId,
            categoryId: updatedTask.categoryId || prevFormData.categoryId,
            credits: updatedTask.credits || prevFormData.credits,
            gradeId: updatedTask.gradeId || prevFormData.gradeId,
            gradedAt: updatedTask.gradedAt || prevFormData.gradedAt,
            gradedBy: updatedTask.gradedBy || prevFormData.gradedBy,
            activeAt: updatedTask.activeAt || prevFormData.activeAt,
            activeBy: updatedTask.activeBy || prevFormData.activeBy,
            archivedAt: updatedTask.archivedAt || prevFormData.archivedAt,
            archivedBy: updatedTask.archivedBy || prevFormData.archivedBy,
            teamAllowanceIntervalId: updatedTask.teamAllowanceIntervalId || prevFormData.teamAllowanceIntervalId,
            teamAllowanceIntervalName: updatedTask.teamAllowanceIntervalName || prevFormData.teamAllowanceIntervalName,
            maxBonus: updatedTask.maxBonus || prevFormData.maxBonus,
            approvedBonus: updatedTask.approvedBonus || prevFormData.approvedBonus,
            isBonusRejected: updatedTask.isBonusRejected || prevFormData.isBonusRejected,
            bonusStatusAt: updatedTask.bonusStatusAt || prevFormData.bonusStatusAt,
            bonusStatusBy: updatedTask.bonusStatusBy || prevFormData.bonusStatusBy,
            bonusStatusComment: updatedTask.bonusStatusComment || prevFormData.bonusStatusComment,
            bonusClaimedAt: updatedTask.bonusClaimedAt || prevFormData.bonusClaimedAt,
            isApprovedForAllowance: updatedTask.isApprovedForAllowance || prevFormData.isApprovedForAllowance,
            allowanceApprovalStatusAt: updatedTask.allowanceApprovalStatusAt || prevFormData.allowanceApprovalStatusAt,
            allowanceApprovalStatusBy: updatedTask.allowanceApprovalStatusBy || prevFormData.allowanceApprovalStatusBy,
            allowanceApprovalStatusComment: updatedTask.allowanceApprovalStatusComment || prevFormData.allowanceApprovalStatusComment,
            updatedBy: updatedTask.updatedBy || prevFormData.updatedBy,
            updatedAt: updatedTask.updatedAt || prevFormData.updatedAt,
            dueAt: convertUTCToLocal(updatedTask.dueAt),
            startAt: convertUTCToLocal(updatedTask.startAt),
            endAt: convertUTCToLocal(updatedTask.endAt),
            isCompleted: updatedTask.percentComplete ? updatedTask.percentComplete === 100 : false,
            percentComplete: updatedTask.percentComplete ?? prevFormData.percentComplete,
            completedAt: updatedTask.completedAt || prevFormData.completedAt,
            completedBy: updatedTask.completedBy || prevFormData.completedBy,
          }));
        }
      }
    } catch (refreshError) {
      console.error('TaskEditScreen: Error refreshing task data:', refreshError);
      // Don't show error to user as this is a background refresh
    }
  }, [currentTaskItem?.id, token, baseUrl]);

  // Refresh task data when screen comes into focus (e.g., returning from TaskDetailsScreen)
  useFocusEffect(
    React.useCallback(() => {
      if (isEditing && currentTaskItem?.id) {
        refreshTaskData();
      }
    }, [refreshTaskData, isEditing, currentTaskItem?.id])
  );

  const [letterGrade, setLetterGrade] = React.useState(currentTaskItem?.grade?.letterGrade || '');
  
  // Wrapper to track dirty state when letter grade changes
  const handleLetterGradeChange = React.useCallback((newGrade: string) => {
    setLetterGrade(newGrade);
    if (!isDirty) {
      setIsDirty(true);
    }
  }, [isDirty]);

  const teamDropdownData = filteredTeam
    .filter(member => {
      // Keep all active members
      if (member.isActive !== false) return true;
      // If inactive, only keep if assigned to currentTaskItem
      if (currentTaskItem && currentTaskItem.assignedTo === member.id) return true;
      return false;
    })
    .map(member => ({
      label: member.id === user?.id ? 'Self' : member.firstName + ' ' + member.lastName,
      value: member.id,
      isSelf: member.id === user?.id,
      avatarUri: member.avatarUri,
      firstName: member.firstName,
      lastName: member.lastName,
      userName: member.userName,
    }))
    .sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      return 0;
    })
    .map(({ isSelf: _isSelf, ...item }) => item);

  // Create allowance intervals dropdown data
  const allowanceIntervalsDropdownData = React.useMemo(() => 
    allowanceIntervalsForDropdown
      .filter(interval => interval.isActive)
      .map(interval => ({
        label: interval.name,
        value: interval.id,
        description: interval.description,
      })), 
    [allowanceIntervalsForDropdown]
  );

  // Initialize dropdown selections when editing an existing task
  useEffect(() => {
    if (currentTaskItem) {
      if (currentTaskItem.assignedTo) {
        const assignedMember = team.find(m => m.id === currentTaskItem.assignedTo);
        setAssignedToTeamMember(assignedMember || null);
      }
      if (currentTaskItem.priority !== undefined) {
        setSelectedPriority(currentTaskItem.priority);
      }
      
      // Initialize allowance interval selection
      if (currentTaskItem.teamAllowanceIntervalId) {
        const selectedInterval = allowanceIntervalsForDropdown.find(interval => interval.id === currentTaskItem.teamAllowanceIntervalId);
        setSelectedAllowanceInterval(selectedInterval || null);
      }
      
      // If the task is private, ensure it's assigned to self
      if (currentTaskItem.isPrivate && user) {
        setAssignedToTeamMember(user);
      }
    }
  }, [currentTaskItem, team, user, allowanceIntervalsForDropdown]);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: currentTaskItem?.name || '',
    description: currentTaskItem?.description || '',
    isActive: currentTaskItem?.isActive ?? true,
    isArchived: currentTaskItem?.isArchived ?? false,
    isPinned: currentTaskItem?.isPinned || false,
    isPrivate: currentTaskItem && currentTaskItem.isPrivate || (user && !user.isAdmin && !currentTaskItem) || false,
    priority: currentTaskItem?.priority || TaskItemPriority.Medium,
    teamId: currentTaskItem?.teamId || user?.teamId,
    assignedTo: currentTaskItem?.assignedTo || user?.id || undefined,
    assignedBy: currentTaskItem?.assignedBy || undefined,
    assignedAt: currentTaskItem?.assignedAt || undefined,
    groupId: currentTaskItem?.groupId || undefined,
    kindId: currentTaskItem?.kindId || undefined,
    categoryId: currentTaskItem?.categoryId || undefined,
    credits: currentTaskItem?.credits || undefined,
    gradeId: currentTaskItem?.gradeId || undefined,
    gradedAt: currentTaskItem?.gradedAt || undefined,
    gradedBy: currentTaskItem?.gradedBy || undefined,
    activeAt: currentTaskItem?.activeAt || undefined,
    activeBy: currentTaskItem?.activeBy || undefined,
    archivedAt: currentTaskItem?.archivedAt || undefined,
    archivedBy: currentTaskItem?.archivedBy || undefined,
    details: currentTaskItem?.details || undefined,
    teamAllowanceIntervalId: currentTaskItem?.teamAllowanceIntervalId || undefined,
    teamAllowanceIntervalName: currentTaskItem?.teamAllowanceIntervalName || undefined,
    maxBonus: currentTaskItem?.maxBonus || undefined,
    approvedBonus: currentTaskItem?.approvedBonus || undefined,
    isBonusRejected: currentTaskItem?.isBonusRejected || false,
    bonusStatusAt: currentTaskItem?.bonusStatusAt || undefined,
    bonusStatusBy: currentTaskItem?.bonusStatusBy || undefined,
    bonusStatusComment: currentTaskItem?.bonusStatusComment || undefined,
    bonusClaimedAt: currentTaskItem?.bonusClaimedAt || undefined,
    isApprovedForAllowance: currentTaskItem?.isApprovedForAllowance || false,
    allowanceApprovalStatusAt: currentTaskItem?.allowanceApprovalStatusAt || undefined,
    allowanceApprovalStatusBy: currentTaskItem?.allowanceApprovalStatusBy || undefined,
    allowanceApprovalStatusComment: currentTaskItem?.allowanceApprovalStatusComment || undefined,
    updatedBy: currentTaskItem?.updatedBy || undefined,
    updatedAt: currentTaskItem?.updatedAt || undefined,
    dueAt: convertUTCToLocal(currentTaskItem?.dueAt),
    startAt: convertUTCToLocal(currentTaskItem?.startAt),
    endAt: convertUTCToLocal(currentTaskItem?.endAt),
    isCompleted: currentTaskItem?.percentComplete ? currentTaskItem.percentComplete === 100 : false,
    percentComplete: currentTaskItem?.percentComplete || 0,
    completedAt: currentTaskItem?.completedAt,
    completedBy: currentTaskItem?.completedBy,
    ...(isEditing && currentTaskItem && { 
      id: currentTaskItem.id,
      createdBy: currentTaskItem.createdBy || user?.id || undefined,
      createdAt: currentTaskItem.createdAt || undefined,
    }),
  });

  // Save initial form data snapshot for dirty tracking
  useEffect(() => {
    if (!initialFormDataRef.current) {
      initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permission logic for task editing
  const isTaskCreator = React.useMemo(() => {
    return isNew || (createdByMember && user && createdByMember.id === user.id);
  }, [createdByMember, user, isNew]);

  const isTaskAssignee = React.useMemo(() => {
    return currentTaskItem && user && currentTaskItem.assignedTo === user.id;
  }, [currentTaskItem, user]);

  const canEditAssignmentAndInterval = React.useMemo(() => {
    return user?.isAdmin 
      || isNew
      || (currentTaskItem && isTaskCreator && !currentTaskItem.isPrivate && currentTaskItem.allowanceApprovalStatusAt === null) // not yet approved nor rejected - do whatever you want
  }, [user?.isAdmin, isTaskCreator, currentTaskItem, isNew]);

  const canFullyEdit = React.useMemo(() => {
    return canEditAssignmentAndInterval      
      || (currentTaskItem && isTaskCreator && (currentTaskItem.isPrivate || currentTaskItem.allowanceApprovalStatusAt !== null && !currentTaskItem.isApprovedForAllowance));  // rejected - do whatever you want
  }, [isTaskCreator, currentTaskItem, canEditAssignmentAndInterval]);

  const canEditLimited = React.useMemo(() => {
    return canFullyEdit
      || (isTaskCreator && currentTaskItem && currentTaskItem.allowanceApprovalStatusAt !== null && currentTaskItem.isApprovedForAllowance)
      || isTaskAssignee;
  }, [isTaskCreator, isTaskAssignee, currentTaskItem, canFullyEdit]);

  const handleInputChange = React.useCallback((field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [field]: value
      };
      return newData;
    });
    
    // Mark as dirty when user makes changes
    if (!isDirty) {
      setIsDirty(true);
    }
  }, [isDirty]);

  // Initialize allowance interval for new tasks
  useEffect(() => {
    if (!isEditing && user?.isAdmin && allowanceIntervalsDropdownData.length > 0 && !selectedAllowanceInterval && !allowanceIntervalAutoInitialized.current) {
      const firstInterval = allowanceIntervals.find(interval => interval.id === allowanceIntervalsDropdownData[0].value);
      setSelectedAllowanceInterval(firstInterval || null);
      handleInputChange('teamAllowanceIntervalId', allowanceIntervalsDropdownData[0].value);
      allowanceIntervalAutoInitialized.current = true;
    }
  }, [isEditing, allowanceIntervalsDropdownData, selectedAllowanceInterval, allowanceIntervals, handleInputChange, user?.isAdmin]);

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) {
        // If we don't have unsaved changes, allow navigation
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Store the navigation action to execute later if user confirms
      navigationActionRef.current = e.data.action;

      // Show confirmation dialog
      showUnsavedChangesDialog(
        'Discard changes?',
        'Do you want to discard unsaved changes to this task?',
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
              // Execute the stored navigation action
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


  // Handle bonus approval/rejection
  const handleBonusApproveClick = () => {
    setBonusDialogMode('approve');
    setBonusDialogVisible(true);
    setBonusComment('');
    // Pre-fill with the max bonus amount
    setApprovedBonus(formData.maxBonus || '');
  };

  const handleBonusRejectClick = () => {
    setBonusDialogMode('reject');
    setBonusDialogVisible(true);
    setBonusComment('');
    setApprovedBonus('');
  };

  const handleBonusApproval = async (isApproved: boolean, comment: string, approvedBonusValue: string) => {
    if (!currentTaskItem?.id) return;
    
    setLoading(true);
    setBonusDialogVisible(false);
    
    try {
      const apiClient = createApiClient(baseUrl, token!);
      const request: BonusApprovalRequest = {
        taskItemId: currentTaskItem.id,
        isApproved,
        approvedBonus: (approvedBonusValue && approvedBonusValue !== '') ? approvedBonusValue : (formData.maxBonus || undefined),
        comment: comment.trim() || undefined,
      };
      
      await apiClient.tasks.approveBonus(request);
      
      // Update local state to reflect the changes immediately
      const updatedFormData = {
        ...formData,
        approvedBonus: isApproved ? approvedBonusValue : undefined,
      };
      setFormData(updatedFormData);
      
      // Update currentTaskItem to reflect the new bonus status
      if (currentTaskItem) {
        const updatedTaskItem = {
          ...currentTaskItem,
          approvedBonus: isApproved ? approvedBonusValue : undefined,
          isBonusRejected: !isApproved,
          bonusStatusAt: new Date().toISOString(),
          bonusStatusComment: comment.trim() || undefined,
          bonusStatusByUser: user || undefined, // Current user who made the decision
        };
        setCurrentTaskItem(updatedTaskItem);
      }
      
      setSuccess(`Task bonus ${isApproved ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} bonus:`, err);
      setError(`Failed to ${isApproved ? 'approve' : 'reject'} task bonus. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBonusClaim = async () => {
    if (!currentTaskItem?.id) return;
    
    setLoading(true);
    try {
      const apiClient = createApiClient(baseUrl, token!);
      await apiClient.tasks.claimBonus(currentTaskItem.id);
      const updatedTaskItem = {
        ...currentTaskItem,
        isBonusClaimed: true,
        bonusClaimedAt: new Date().toISOString(),
      };
      setCurrentTaskItem(updatedTaskItem);

      setSuccess('Task bonus claimed successfully!');
    } catch (err) {
      console.error('Error claiming bonus:', err);
      setError('Failed to claim task bonus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBonusDialogCancel = () => {
    setBonusDialogVisible(false);
    setBonusComment('');
    setApprovedBonus('');
  };

  const handleBonusDialogConfirm = () => {
    const isApproved = bonusDialogMode === 'approve';
    
    // Validation for approve mode - only check that it's not empty
    if (isApproved && !approvedBonus.trim()) {
      setError('Please enter an approved bonus value.');
      return;
    }
    
    handleBonusApproval(isApproved, bonusComment, approvedBonus.trim());
  };

  // Handle edit bonus click
  const handleEditBonusClick = () => {
    setEditBonusDialogVisible(true);
  };

  // Handle edit bonus dialog actions
  const handleEditBonusApprove = () => {
    setEditBonusDialogVisible(false);
    setBonusDialogMode('approve');
    setBonusDialogVisible(true);
    // Pre-populate with existing comment if available
    setBonusComment(currentTaskItem?.bonusStatusComment || '');
    // Pre-fill with current approved bonus or max bonus
    setApprovedBonus(formData.approvedBonus || formData.maxBonus || '');
  };

  const handleEditBonusReject = () => {
    setEditBonusDialogVisible(false);
    setBonusDialogMode('reject');
    setBonusDialogVisible(true);
    // Pre-populate with existing comment if available
    setBonusComment(currentTaskItem?.bonusStatusComment || '');
    setApprovedBonus('');
  };

  const handleEditBonusCancel = () => {
    setEditBonusDialogVisible(false);
  };

  // Handle edit allowance approval click
  const handleEditAllowanceApprovalClick = () => {
    setEditAllowanceDialogVisible(true);
  };

  // Handle edit allowance approval dialog actions
  const handleEditAllowanceApprove = () => {
    setEditAllowanceDialogVisible(false);
    setAllowanceDialogMode('approve');
    setAllowanceDialogVisible(true);
    // Pre-populate with existing comment if available
    setAllowanceComment(currentTaskItem?.allowanceApprovalStatusComment || '');
    setAllowanceDialogIntervalId(selectedAllowanceInterval?.id || null);
  };

  const handleEditAllowanceReject = () => {
    setEditAllowanceDialogVisible(false);
    setAllowanceDialogMode('reject');
    setAllowanceDialogVisible(true);
    // Pre-populate with existing comment if available
    setAllowanceComment(currentTaskItem?.allowanceApprovalStatusComment || '');
    setAllowanceDialogIntervalId(selectedAllowanceInterval?.id || null);
  };

  const handleEditAllowanceCancel = () => {
    setEditAllowanceDialogVisible(false);
  };

  // Handle allowance approval/rejection
  const handleAllowanceApproveClick = () => {
    setAllowanceDialogMode('approve');
    setAllowanceDialogVisible(true);
    setAllowanceComment('');
    setAllowanceDialogIntervalId(selectedAllowanceInterval?.id || null);
  };

  const handleAllowanceRejectClick = () => {
    setAllowanceDialogMode('reject');
    setAllowanceDialogVisible(true);
    setAllowanceComment('');
    setAllowanceDialogIntervalId(selectedAllowanceInterval?.id || null);
  };

  const handleAllowanceApproval = async (isApproved: boolean, comment: string, intervalId: number) => {
    if (!currentTaskItem?.id) return;
    
    setLoading(true);
    setAllowanceDialogVisible(false);
    
    try {
      const apiClient = createApiClient(baseUrl, token!);
      const request: TaskItemAllowanceApprovalRequest = {
        taskItemId: currentTaskItem.id,
        isApproved,
        teamAllowanceIntervalId: intervalId,
        comment: comment.trim() || undefined,
      };
      
      await apiClient.tasks.approveTaskItemAllowance(request);
      
      // Update currentTaskItem to reflect the new allowance approval status
      if (currentTaskItem) {
        const updatedTaskItem = {
          ...currentTaskItem,
          isApprovedForAllowance: isApproved,
          allowanceApprovalStatusAt: new Date().toISOString(),
          allowanceApprovalStatusComment: comment.trim() || undefined,
          allowanceApprovalStatusBy: user?.id, // Current user who made the decision
          allowanceApprovalStatusByUser: user || undefined,
          teamAllowanceIntervalId: intervalId,
        };
        setCurrentTaskItem(updatedTaskItem);
      }
      
      // // Update selected allowance interval
      // if (allowanceDialogIntervalId !== selectedAllowanceInterval?.id) {
      //   const selectedInterval = allowanceIntervals.find(interval => interval.id === allowanceDialogIntervalId);
      //   setSelectedAllowanceInterval(selectedInterval);
      //   handleInputChange('teamAllowanceIntervalId', allowanceDialogIntervalId);
      // }
      
      setSuccess(`Task ${isApproved ? 'approved' : 'rejected'} for allowance successfully!`);
    } catch (err) {
      console.error(`Error ${isApproved ? 'approving' : 'rejecting'} task for allowance:`, err);
      setError(`Failed to ${isApproved ? 'approve' : 'reject'} task for allowance. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAllowanceDialogCancel = () => {
    setAllowanceDialogVisible(false);
    setAllowanceComment('');
  };

  const handleAllowanceDialogConfirm = () => {
    const isApproved = allowanceDialogMode === 'approve';
    handleAllowanceApproval(isApproved, allowanceComment, allowanceDialogIntervalId || 0);
  };

  // Helper function to check if 24 hours have passed since bonus was claimed
  const canClaimBonus = () => {
    if (!currentTaskItem?.bonusClaimedAt) return true;
    
    const claimedDate = new Date(currentTaskItem.bonusClaimedAt);
    const now = new Date();
    const timeDiff = now.getTime() - claimedDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  };

  // Helper function to get remaining time until bonus can be claimed again
  const getRemainingTime = () => {
    if (!currentTaskItem?.bonusClaimedAt) return '';
    
    const claimedDate = new Date(currentTaskItem.bonusClaimedAt);
    const now = new Date();
    const timeDiff = now.getTime() - claimedDate.getTime();
    const remainingMs = (24 * 60 * 60 * 1000) - timeDiff; // 24 hours in ms minus elapsed time
    
    if (remainingMs <= 0) return '';
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleSave = React.useCallback(async () => {
    if (!formData.name?.trim()) {
      setError('Please enter a task name');
      return;
    }

    if (!user?.id) {
      setError('User not found');
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && currentTaskItem) {
        // Update existing task
        const updateData: TaskItemUpdateRequest = {
          id: currentTaskItem.id,
          name: formData.name.trim(),
          description: formData.description ?? '',
          isActive: formData.isActive ?? true,
          isArchived: formData.isArchived ?? false,
          isPinned: formData.isPinned ?? false,
          isPrivate: formData.isPrivate ?? false,
          priority: formData.priority ?? TaskItemPriority.Medium,
          teamId: formData.teamId ?? currentTaskItem.teamId,
          assignedTo: formData.assignedTo ?? currentTaskItem.assignedTo,
          groupId: formData.groupId,
          kindId: formData.kindId,
          categoryId: formData.categoryId,
          credits: formData.credits,
          gradeId: letterGrade === '' ? null : (grades.find(g => g.letterGrade === letterGrade)?.id || formData.gradeId),
          maxBonus: formData.maxBonus,
          teamAllowanceIntervalId: formData.teamAllowanceIntervalId,
          dueAt: formData.dueAt ? convertLocalToUTC(typeof formData.dueAt === 'string' ? new Date(formData.dueAt) : formData.dueAt) || undefined : undefined,
          startAt: formData.startAt ? convertLocalToUTC(typeof formData.startAt === 'string' ? new Date(formData.startAt) : formData.startAt) || undefined : undefined,
          endAt: formData.endAt ? convertLocalToUTC(typeof formData.endAt === 'string' ? new Date(formData.endAt) : formData.endAt) || undefined : undefined,
          percentComplete: formData.percentComplete ?? 0,
          completedAt: formData.completedAt,
        };

        const requestBody = JSON.stringify(updateData);

        const url = config.API_BASE_URL + API_ROUTES.taskItems.update;
       
        let response;
        try {
          response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`, 
            },
            body: requestBody,
          });
        } catch (fetchError) {
          console.error('Fetch request failed completely:', fetchError);
          throw new Error(`Network request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
        }
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('API update failed:', response.status, errorData);
          throw new Error(`Failed to update task: ${errorData}`);
        }

        const responseData = await response.json();
        if (!responseData || !responseData.success) {
          console.error('Failed to update task: ', responseData.message || 'Unknown error');
          throw new Error('Failed to update task: ' + (responseData.message || 'Unknown error'));
        }
        const updatedTask = responseData.data;
       
        // Update the current task item with the response from server
        if (updatedTask) {
          setCurrentTaskItem(updatedTask);
          
          // Sync formData with the updated task from server to avoid stale state on subsequent saves
          setFormData((prevFormData: any) => ({
            ...prevFormData,
            // Update all fields with server values to ensure consistency
            name: updatedTask.name || '',
            description: updatedTask.description || '',
            isActive: updatedTask.isActive ?? true,
            isArchived: updatedTask.isArchived ?? false,
            isPinned: updatedTask.isPinned || false,
            isPrivate: updatedTask.isPrivate || false,
            priority: updatedTask.priority || TaskItemPriority.Medium,
            teamId: updatedTask.teamId || prevFormData.teamId,
            assignedTo: updatedTask.assignedTo || undefined,
            assignedBy: updatedTask.assignedBy || undefined,
            assignedAt: updatedTask.assignedAt || undefined,
            groupId: updatedTask.groupId || undefined,
            kindId: updatedTask.kindId || undefined,
            categoryId: updatedTask.categoryId || undefined,
            credits: updatedTask.credits || undefined,
            gradeId: updatedTask.gradeId || undefined,
            gradedAt: updatedTask.gradedAt || undefined,
            gradedBy: updatedTask.gradedBy || undefined,
            activeAt: updatedTask.activeAt || undefined,
            activeBy: updatedTask.activeBy || undefined,
            archivedAt: updatedTask.archivedAt || undefined,
            archivedBy: updatedTask.archivedBy || undefined,
            details: updatedTask.details || undefined,
            teamAllowanceIntervalId: updatedTask.teamAllowanceIntervalId || undefined,
            teamAllowanceIntervalName: updatedTask.teamAllowanceIntervalName || undefined,
            maxBonus: updatedTask.maxBonus || undefined,
            approvedBonus: updatedTask.approvedBonus || undefined,
            isBounusRejected: updatedTask.isBonusRejected || undefined,
            bonusStatusAt: updatedTask.bonusStatusAt || undefined,
            bonusStatusBy: updatedTask.bonusStatusBy || undefined,
            bounusStatusComment: updatedTask.bonusStatusComment || undefined,
            bonusClaimedAt: updatedTask.bonusClaimedAt || undefined,
            isApprovedForAllowance: updatedTask.isApprovedForAllowance || undefined,
            allowanceApprovalStatusAt: updatedTask.allowanceApprovalStatusAt || undefined,
            allowanceApprovalStatusBy: updatedTask.allowanceApprovalStatusBy || undefined,
            allowanceApprovalStatusComment: updatedTask.allowanceApprovalStatusComment || undefined,
            createdBy: updatedTask.createdBy,
            createdAt: updatedTask.createdAt,
            updatedBy: updatedTask.updatedBy,
            updatedAt: updatedTask.updatedAt,
            dueAt: convertUTCToLocal(updatedTask.dueAt),
            startAt: convertUTCToLocal(updatedTask.startAt),
            endAt: convertUTCToLocal(updatedTask.endAt),
            id: updatedTask.id,
            isCompleted: updatedTask.percentComplete ? updatedTask.percentComplete === 100 : false,
            percentComplete: updatedTask.percentComplete || 0,
            completedAt: updatedTask.completedAt,
            completedBy: updatedTask.completedBy,
          }));
        }

        setSuccess('Task updated successfully!');
        setIsDirty(false); // Reset dirty flag after successful save
        // Update initial form data snapshot
        initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
      } else {
        // Create new task
        const taskData: TaskItemCreateRequest = {
          name: formData.name.trim(),
          description: formData.description || '',
          isActive: formData.isActive ?? true,
          isArchived: formData.isArchived ?? false,
          isPinned: formData.isPinned ?? false,
          isPrivate: formData.isPrivate ?? false,
          priority: formData.priority ?? TaskItemPriority.Medium,
          teamId: formData.teamId || 1,
          assignedTo: formData.assignedTo || null,
          groupId: formData.groupId,
          kindId: formData.kindId,
          categoryId: formData.categoryId,
          credits: formData.credits,
          gradeId: letterGrade === '' ? null : (grades.find(g => g.letterGrade === letterGrade)?.id || formData.gradeId),
          maxBonus: formData.maxBonus,
          teamAllowanceIntervalId: formData.teamAllowanceIntervalId,
          dueAt: formData.dueAt ? convertLocalToUTC(typeof formData.dueAt === 'string' ? new Date(formData.dueAt) : formData.dueAt) || undefined : undefined,
          startAt: formData.startAt ? convertLocalToUTC(typeof formData.startAt === 'string' ? new Date(formData.startAt) : formData.startAt) || undefined : undefined,
          endAt: formData.endAt ? convertLocalToUTC(typeof formData.endAt === 'string' ? new Date(formData.endAt) : formData.endAt) || undefined : undefined,
          percentComplete: formData.percentComplete ?? 0,
        };

        const url = config.API_BASE_URL + API_ROUTES.taskItems.create;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`, 
          },
          body: JSON.stringify(taskData),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to create task: ${errorData}`);
        }

        const responseData = await response.json();
        if (!responseData || !responseData.success) {
          console.error('Failed to update task: ', responseData.message || 'Unknown error');
          throw new Error('Failed to update task: ' + (responseData.message || 'Unknown error'));
        }
        const newTask = responseData.data;
        
        // Update the current task item with the response from server
        if (newTask) {
          setCurrentTaskItem(newTask);
          setIsEditing(true); // Switch to editing mode since we now have a task
          setIsNew(false);
          
          // Sync formData with the new task from server
          setFormData((prevFormData: any) => ({
            ...prevFormData,
            // Update with server response values
            name: newTask.name || '',
            description: newTask.description || '',
            isActive: newTask.isActive ?? true,
            isArchived: newTask.isArchived ?? false,
            isPinned: newTask.isPinned || false,
            isPrivate: newTask.isPrivate || false,
            priority: newTask.priority || TaskItemPriority.Medium,
            teamId: newTask.teamId || prevFormData.teamId,
            assignedTo: newTask.assignedTo || undefined,
            assignedBy: newTask.assignedBy || undefined,
            assignedAt: newTask.assignedAt || undefined,
            groupId: newTask.groupId || undefined,
            kindId: newTask.kindId || undefined,
            categoryId: newTask.categoryId || undefined,
            credits: newTask.credits || undefined,
            gradeId: newTask.gradeId || undefined,
            gradedAt: newTask.gradedAt || undefined,
            gradedBy: newTask.gradedBy || undefined,
            activeAt: newTask.activeAt || undefined,
            activeBy: newTask.activeBy || undefined,
            archivedAt: newTask.archivedAt || undefined,
            archivedBy: newTask.archivedBy || undefined,
            details: newTask.details || undefined,
            teamAllowanceIntervalId: newTask.teamAllowanceIntervalId || undefined,
            teamAllowanceIntervalName: newTask.teamAllowanceIntervalName || undefined,
            maxBonus: newTask.maxBonus || undefined,
            approvedBonus: newTask.approvedBonus || undefined,
            isBonusRejected: newTask.isBonusRejected || undefined,
            bonusStatusAt: newTask.bonusStatusAt || undefined,
            bonusStatusBy: newTask.bonusStatusBy || undefined,
            bounusStatusComment: newTask.bonusStatusComment || undefined,
            bonusClaimedAt: newTask.bonusClaimedAt || undefined,
            isApprovedForAllowance: newTask.isApprovedForAllowance || undefined,
            allowanceApprovalStatusAt: newTask.allowanceApprovalStatusAt || undefined,
            allowanceApprovalStatusBy: newTask.allowanceApprovalStatusBy || undefined,
            allowanceApprovalStatusComment: newTask.allowanceApprovalStatusComment || undefined,
            createdBy: newTask.createdBy,
            createdAt: newTask.createdAt,
            updatedBy: newTask.updatedBy,
            updatedAt: newTask.updatedAt,
            dueAt: convertUTCToLocal(newTask.dueAt),
            startAt: convertUTCToLocal(newTask.startAt),
            endAt: convertUTCToLocal(newTask.endAt),
            id: newTask.id,
            isCompleted: newTask.percentComplete ? newTask.percentComplete === 100 : false,
            percentComplete: newTask.percentComplete || 0,
            completedAt: newTask.completedAt,
            completedBy: newTask.completedBy,
          }));
        }

        setSuccess('Task created successfully!');
        setIsDirty(false); // Reset dirty flag after successful save
        // Update initial form data snapshot
        initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} task. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [isEditing, currentTaskItem, formData, user, token, letterGrade, grades]);

  const handleSaveClick = () => {
    handleSave();
  };

  const handleCopy = () => {
    // Copy task data to create a duplicate
    const duplicateData = {
      ...formData,
      name: `Copy of ${formData.name}`,
      id: undefined, // Remove ID to create new task
      isCompleted: false,
      percentComplete: 0,
      completedAt: undefined,
      gradeId: undefined,
    };
    setFormData(duplicateData);
    setIsEditing(false); // Switch to create mode
    setIsNew(true);
  setSuccess('Task data has been copied. You can now save it as a new task.');
  };

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        setLoading(true);

        const apiClient = createApiClient(baseUrl, token!);
        await apiClient.tasks.delete(formData.id);
        navigation.goBack();
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    showDeleteConfirmation('Task', performDelete);
  };

  const { bottom, right } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const createdByMemberValue = currentTaskItem?.createdBy === SYSTEM_USER_ID ? 'DoDone system' 
    : currentTaskItem?.createdBy === DELETED_USER_ID ? 'deleted user' : 'non-administrator';
  const createdByMemberName = currentTaskItem?.createdBy === SYSTEM_USER_ID ? '' 
    : currentTaskItem?.createdBy === DELETED_USER_ID ? 'Deleted User' : createdByMember?.firstName + ' ' + createdByMember?.lastName;
  const createdByDisplayValue = currentTaskItem?.createdBy === SYSTEM_USER_ID ? createdByMemberValue 
    : currentTaskItem?.createdBy === DELETED_USER_ID ? createdByMemberValue : `${createdByMemberName}`;
  const updatedByMemberValue = currentTaskItem?.updatedBy === SYSTEM_USER_ID ? 'DoDone system' 
    : currentTaskItem?.updatedBy === DELETED_USER_ID ? 'deleted user' : 'non-administrator';
  const updatedByMemberName = currentTaskItem?.updatedBy === SYSTEM_USER_ID ? '' 
    : currentTaskItem?.updatedBy === DELETED_USER_ID ? 'Deleted User' : updatedByMember?.firstName + ' ' + updatedByMember?.lastName;
  const updatedByDisplayValue = currentTaskItem?.updatedBy === SYSTEM_USER_ID ? updatedByMemberValue 
    : currentTaskItem?.updatedBy === DELETED_USER_ID ? updatedByMemberValue : `${updatedByMemberName} (${updatedByMemberValue})`;

  const rewardWordCapital = teamDetails?.isBusiness ? 'Incentive' : 'Allowance';
  const rewardWordLowercase = teamDetails?.isBusiness ? 'incentive' : 'allowance';
  const taskApprovalMessageForNonCreator = `This task was created by ${createdByDisplayValue} and requires administrator approval to be included in ${rewardWordLowercase} calculations and bonus counts or to be reassigned to someone else.`;
  const taskApprovalMessageForCreator = `Your task requires administrator approval to be included in ${rewardWordLowercase} calculations and bonus counts or to be reassigned to someone else.`;
  const taskApprovalMessage = !isEditing || currentTaskItem?.createdBy === user?.id ? taskApprovalMessageForCreator : taskApprovalMessageForNonCreator;

  return (
  <View style={localStyles.container}>
      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <Card style={localStyles.taskCard}>
          <Card.Content style={[localStyles.cardContent, isLandscape && { paddingRight: right + 16 }]}>
            <Text variant="displaySmall" style={styles.gameTitle}>
              {isEditing ? 'Edit Task ' : 'New Task'}
            </Text>
            <TextInput
              label="Task Name *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={[localStyles.inputField, localStyles.textInputStyle]}
              contentStyle={localStyles.textInputContentStyle}
              textColor={colors.primary} 
              mode="outlined"
              theme={{
                roundness: 12,
              }}
              disabled={!canFullyEdit}
              accessibilityRole="text"
              accessibilityLabel="Task Name"
              accessibilityHint="Enter the name for this task"
              accessibilityState={{ disabled: !canFullyEdit }}
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={[localStyles.inputField, localStyles.textInputStyle]}
              contentStyle={localStyles.textInputContentStyle}
              textColor={colors.primary} 
              mode="outlined"
              multiline
              numberOfLines={3}
              theme={{
                roundness: 12,
              }}
              disabled={!canFullyEdit}
              accessibilityRole="text"
              accessibilityLabel="Description"
              accessibilityHint="Enter an optional description for this task"
              accessibilityState={{ disabled: !canFullyEdit }}
            />

            <View style={localStyles.inputField}>
              <DropdownComponent
                data={teamDropdownData}
                value={assignedToTeamMember?.id}
                onValueChange={(item) => {
                  // Don't allow changes when task is private
                  if (formData.isPrivate) return;
                  
                  if (item.value === null) {
                    setAssignedToTeamMember(null);
                    handleInputChange('assignedTo', null);
                  } else {
                    const teamMember = team.find((t: any) => t.id === item.value);
                    setAssignedToTeamMember(teamMember || null);
                    handleInputChange('assignedTo', item.value);
                  }
                  
                  // Mark as dirty when dropdown changes
                  if (!isDirty) {
                    setIsDirty(true);
                  }
                }}
                placeholder="Select Assigned To"
                label="Assigned To"
                searchable={true}
                showAvatar={true}
                disabled={!canEditAssignmentAndInterval || formData.isPrivate}
              />
            </View>

            {!isEditing || currentTaskItem?.createdBy === user?.id ? (
              <SubscriptionGate 
                requiredTier={SubscriptionTier.Pro}
                // requiresFeature={(limits) => limits.bonuses} 
                overlayWhenLocked
                onUpgradePress={() => setUpgradeModalVisible(true)}
              >
                <View style={localStyles.privateSwitchContainer}>
                  <Text variant='bodyLarge'>Private </Text>
                  <Switch
                    value={formData.isPrivate || false}
                    onValueChange={(value) => {
                      handleInputChange('isPrivate', value);
                      // When task is set to private, assign it to self and disable assigned to dropdown
                      if (value && user) {
                        setAssignedToTeamMember(user);
                        handleInputChange('assignedTo', user.id);
                        setSelectedAllowanceInterval(null);
                        handleInputChange('teamAllowanceIntervalId', null);
                      }
                      // if (!user?.isAdmin) {
                        // setSuccess('')
                      // }
                    }}
                    disabled={!canFullyEdit}
                    accessibilityRole="switch"
                    accessibilityLabel="Private task"
                    accessibilityHint="Toggle whether this task is private or can be assigned to others"
                    accessibilityState={{ checked: formData.isPrivate || false, disabled: !canFullyEdit }}
                  />
                </View>
                <Text style={localStyles.infoLabel}>ℹ️ Private tasks cannot be assigned to another person and are excluded from {rewardWordLowercase} calculations. </Text>
              </SubscriptionGate>
            ) : null}

            {/* Allowance Interval Section */}
            <View style={[
              localStyles.allowanceIntervalInputField,
              !canEditAssignmentAndInterval ? localStyles.disabledSection : null
            ]}>
              <DropdownComponent
                data={allowanceIntervalsDropdownData}
                value={selectedAllowanceInterval?.id}
                onValueChange={(item) => {
                  // Don't allow changes when task is private
                  if (formData.isPrivate) return;

                  if (item.value === null) {
                    setSelectedAllowanceInterval(null);
                    handleInputChange('teamAllowanceIntervalId', null);
                  } else {
                    const selectedInterval = allowanceIntervals.find(interval => interval.id === item.value);
                    setSelectedAllowanceInterval(selectedInterval || null);
                    handleInputChange('teamAllowanceIntervalId', item.value);
                  }
                  
                  // Mark as dirty when dropdown changes
                  if (!isDirty) {
                    setIsDirty(true);
                  }
                }}
                placeholder={`Select ${rewardWordCapital} Interval`}
                label={`${rewardWordCapital} Interval`}
                searchable={false}
                disabled={!canEditAssignmentAndInterval || formData.isPrivate}
                allowClear={formData.allowanceApprovalStatusAt ? false : true}
              />
            </View>

            {/* Task Allowance Approval Container */}
            {(() => {
              const showAllowanceApprovalContainer = 
                !formData.isPrivate && 
                (!createdByMember?.isAdmin || currentTaskItem?.createdBy === SYSTEM_USER_ID) &&
                (selectedAllowanceInterval !== null ||
                assignedToTeamMember !== null && assignedToTeamMember.id !== createdByMember?.id);
              return showAllowanceApprovalContainer;
            })() && (

              <View style={[
                localStyles.allowanceApprovalContainer, 
                !canFullyEdit ? localStyles.disabledSection : null
              ]}>
                <Text style={localStyles.allowanceApprovalLabel}>Task Approval</Text>
                <Text style={localStyles.allowanceApprovalSecondaryLabel}>ℹ️ {taskApprovalMessage}</Text>
                
                {/* Allowance Status Information */}
                {currentTaskItem?.allowanceApprovalStatusAt ? (
                  <View style={localStyles.allowanceStatusContainer}>
                    <View style={localStyles.allowanceStatusIndicatorRow}>
                      <View style={[localStyles.allowanceStatusIndicator, currentTaskItem.isApprovedForAllowance ? localStyles.approvedStatus : localStyles.rejectedStatus]}>
                        <Text style={[localStyles.allowanceStatusText, currentTaskItem.isApprovedForAllowance ? localStyles.approvedStatusText : localStyles.rejectedStatusText]}>
                          {currentTaskItem.isApprovedForAllowance ? '✅ APPROVED' : '❌ REJECTED'}
                        </Text>
                      </View>
                      {user?.isAdmin && (
                        <IconButton
                          icon="pencil"
                          size={18}
                          onPress={handleEditAllowanceApprovalClick}
                          style={localStyles.approvalEditButton}
                          iconColor={colors.primary}
                          accessibilityRole="button"
                          accessibilityLabel="Edit approval status"
                          accessibilityHint="Change the approval status for this task"
                        />
                      )}
                    </View>
                   
                    {allowanceApprovedByMember && (
                      <Text style={localStyles.allowanceStatusByText}>
                        by {allowanceApprovedByMember.firstName} {allowanceApprovedByMember.lastName}
                      </Text>
                    )}
                    
                    {currentTaskItem.allowanceApprovalStatusComment && (
                      <View style={localStyles.allowanceStatusCommentContainer}>
                        <Text style={localStyles.allowanceStatusCommentLabel}>Comment:</Text>
                        <Text style={localStyles.allowanceStatusComment}>
                          {currentTaskItem.allowanceApprovalStatusComment}
                        </Text>
                      </View>
                    )}
                    
                    {currentTaskItem.allowanceApprovalStatusAt && (
                      <Text style={localStyles.allowanceStatusDateText}>
                        {formatDateForDisplay(convertUTCToLocal(currentTaskItem.allowanceApprovalStatusAt))}
                      </Text>
                    )}
                  </View>
                ) : (
                  /* Show approval buttons for admin users, pending message for non-admin users */
                  <View style={localStyles.allowanceApprovalContent}>
                    {user?.isAdmin && currentTaskItem && !currentTaskItem.isApprovedForAllowance && currentTaskItem.createdBy !== user.id ? (
                      <View style={localStyles.allowanceApprovalButtons}>
                        <Button
                          mode="contained"
                          onPress={handleAllowanceApproveClick}
                          style={[localStyles.allowanceButton, localStyles.approveButton]}
                          labelStyle={localStyles.allowanceButtonLabel}
                          compact
                          accessibilityRole="button"
                          accessibilityLabel="Approve"
                          accessibilityHint="Approve this task for allowance calculation"
                        >
                          Approve
                        </Button>
                        <Button
                          mode="contained"
                          onPress={handleAllowanceRejectClick}
                          style={[localStyles.allowanceButton, localStyles.rejectButton]}
                          labelStyle={localStyles.allowanceButtonLabel}
                          compact
                          accessibilityRole="button"
                          accessibilityLabel="Reject"
                          accessibilityHint="Reject this task for allowance calculation"
                        >
                          Reject
                        </Button>
                      </View>
                    ) : (
                      <View style={localStyles.pendingApprovalContainer}>
                        <Text style={localStyles.pendingApprovalText}>⏳ Pending Approval</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Task Properties Accordion */}
            <Card style={localStyles.accordionCard} mode="contained">
              <Card.Title 
                title="Task Properties"
                titleStyle={localStyles.accordionTitle}
                right={AccordionToggleButton}
                style={isTaskDetailsExpanded ? localStyles.accordionHeaderExpanded : localStyles.accordionHeader}
                left={AccordionIcon}
              />
              
              {isTaskDetailsExpanded && (
                <Card.Content style={localStyles.accordionContent}>
                  {/* Status Settings Section */}
                  <View style={localStyles.accordionSection}>
                    <Text variant='titleSmall' style={localStyles.sectionTitle}>Status Settings</Text>
                    <View style={localStyles.switchContainer}>
                      <Text variant='bodyLarge'>Active </Text>
                      <Switch
                        value={formData.isActive || false}
                        onValueChange={(value) => handleInputChange('isActive', value)}
                        disabled={!canEditLimited}
                        accessibilityRole="switch"
                        accessibilityLabel="Active"
                        accessibilityHint="Toggle whether this task is active or inactive"
                        accessibilityState={{ checked: formData.isActive || false, disabled: !canEditLimited }}
                      />
                    </View>

                    <View style={localStyles.switchContainer}>
                      <Text variant='bodyLarge'>Pinned </Text>
                      <Switch
                        value={formData.isPinned || false}
                        onValueChange={(value) => handleInputChange('isPinned', value)}
                        accessibilityRole="switch"
                        accessibilityLabel="Pinned"
                        accessibilityHint="Toggle whether this task is pinned to the top of lists"
                        accessibilityState={{ checked: formData.isPinned || false }}
                      />
                    </View>

                    <View style={localStyles.switchContainer}>
                      <Text variant='bodyLarge'>Archived </Text>
                      <Switch
                        value={formData.isArchived || false}
                        onValueChange={(value) => handleInputChange('isArchived', value)}
                        disabled={!canFullyEdit}
                        accessibilityRole="switch"
                        accessibilityLabel="Archived"
                        accessibilityHint="Toggle whether this task is archived"
                        accessibilityState={{ checked: formData.isArchived || false, disabled: !canFullyEdit }}
                      />
                    </View>
                    <Text style={localStyles.infoLabel}>ℹ️ Archived tasks are excluded from {rewardWordLowercase} calculations and filtered out by default</Text>
                  </View>

                  {/* Priority & Categories Section */}
                  <View style={localStyles.accordionSection}>
                    <Text variant='titleSmall' style={localStyles.sectionTitle}>Priority & Categories</Text>
                    <View style={localStyles.inputField}>
                      <DropdownComponent
                        data={Object.keys(TaskItemPriority)
                          .filter(key => isNaN(Number(key)))
                          .map(priorityName => ({ 
                            label: priorityName, 
                            value: TaskItemPriority[priorityName as keyof typeof TaskItemPriority] 
                          }))}
                        value={selectedPriority}
                        onValueChange={(item) => {
                          if (item.value === null) {
                            // Clear selection
                            setSelectedPriority(TaskItemPriority.Medium);
                            handleInputChange('priority', TaskItemPriority.Medium);
                          } else {
                            setSelectedPriority(item.value as TaskItemPriority);
                            handleInputChange('priority', item.value);
                          }
                          
                          // Mark as dirty when dropdown changes
                          if (!isDirty) {
                            setIsDirty(true);
                          }
                        }}
                        placeholder="Select Priority"
                        label="Task Priority"
                        searchable={true}
                        disabled={!canFullyEdit}
                      />
                    </View>

                    <SubscriptionGate 
                      requiredTier={SubscriptionTier.Pro}
                      // requiresFeature={(limits) => limits.bonuses} 
                      overlayWhenLocked
                      onUpgradePress={() => setUpgradeModalVisible(true)}
                    >
                      <View style={localStyles.inputField}>
                        <TaskGroupKindCategoryDropdowns
                          userId={user?.id || -1}
                          selectedGroupId={formData.groupId}
                          selectedKindId={formData.kindId}
                          selectedCategoryId={formData.categoryId}
                          onGroupChange={(groupId) => handleInputChange('groupId', groupId)}
                          onKindChange={(kindId) => handleInputChange('kindId', kindId)}
                          onCategoryChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                          disabled={!canFullyEdit}
                        />
                      </View>
                    </SubscriptionGate>
                  </View>

                  {/* Dates & Deadlines Section */}
                  <View style={localStyles.accordionSection}>
                    <Text variant='titleSmall' style={localStyles.sectionTitle}>Dates & Deadlines</Text>
                    <View style={localStyles.inputField}>
                      <DatePickerComponent
                        label="Start Date"
                        initialDate={formData.startAt}
                        onDateChange={(date) => handleInputChange('startAt', date)}
                        disabled={!canFullyEdit}
                      />
                    </View>

                    <View style={localStyles.inputField}>
                      <DatePickerComponent
                        label="End Date"
                        initialDate={formData.endAt}
                        onDateChange={(date) => handleInputChange('endAt', date)}
                        disabled={!canFullyEdit}
                      />
                    </View>

                    <View style={localStyles.inputField}>
                      <DatePickerComponent
                        label="Due Date"
                        initialDate={formData.dueAt}
                        onDateChange={(date) => handleInputChange('dueAt', date)}
                        disabled={!canFullyEdit}
                      />
                    </View>

                  </View>

                  {/* Task History Section - only show when editing */}
                  {isEditing && currentTaskItem && (
                    <View style={localStyles.accordionSection}>
                      <Text variant='titleSmall' style={localStyles.sectionTitle}>Task History</Text>
                      
                      <View style={localStyles.historyRow}>
                        <Text variant='bodyMedium' style={localStyles.historyLabel}>Created By:</Text>
                        <Text variant='bodyMedium' style={localStyles.historyValue}>
                          {createdByDisplayValue}
                        </Text>
                      </View>

                      <View style={localStyles.historyRow}>
                        <Text variant='bodyMedium' style={localStyles.historyLabel}>Created At:</Text>
                        <Text variant='bodyMedium' style={localStyles.historyValue}>
                          {currentTaskItem.createdAt ? formatDateForDisplay(convertUTCToLocal(currentTaskItem.createdAt)) : 'Unknown'}
                        </Text>
                      </View>

                      {(updatedByMember || currentTaskItem.updatedAt) && (
                        <>
                          <View style={localStyles.historyRow}>
                            <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated By:</Text>
                            <Text variant='bodyMedium' style={localStyles.historyValue}>
                              {updatedByMember ? `${updatedByMember.firstName} ${updatedByMember.lastName}` : 
                               (updatedByDisplayValue)}
                            </Text>
                          </View>

                          <View style={localStyles.historyRow}>
                            <Text variant='bodyMedium' style={localStyles.historyLabel}>Updated At:</Text>
                            <Text variant='bodyMedium' style={localStyles.historyValue}>
                              {currentTaskItem.updatedAt ? formatDateForDisplay(convertUTCToLocal(currentTaskItem.updatedAt)) : 'Unknown'}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </Card.Content>
              )}
            </Card>

            {isEditing && currentTaskItem?.id && (
              <>
                <TaskDetailsPreview
                  taskDetails={formData.details}
                  onPress={() => {
                    const task = currentTaskItem || taskItem;
                    if (task?.id) {
                      navigation.navigate('TaskDetails', { 
                        taskId: task.id, 
                        taskName: task.name || 'Task'
                      });
                    }
                  }}
                  disabled={!canEditLimited}
                />
              </>
            )}

            <View style={[
              localStyles.percentCompleteInputField,
              !canEditLimited ? localStyles.disabledSection : null
            ]}>
              <SliderComponent
                value={formData.percentComplete || 0}
                title='% Complete'
                onValueChange={(value) => handleInputChange('percentComplete', value)}
                disabled={!canEditLimited}
              />
            </View>

            {/* Task Bonus Container with border */}
            <SubscriptionGate 
              requiredTier={SubscriptionTier.Pro}
              // requiresFeature={(limits) => limits.bonuses} 
              overlayWhenLocked
              onUpgradePress={() => setUpgradeModalVisible(true)}
            >
              <View style={localStyles.bonusApprovalContainer}>
                <Text style={localStyles.bonusApprovalLabel}>Task Bonus</Text>
                
                {/* Check if bonus is approved/rejected and should be styled as chip */}
                {currentTaskItem?.bonusStatusAt ? (
                  <View style={[localStyles.bonusChipContainer, { backgroundColor: colors.backgroundAccent, borderColor: colors.accent }]}>
                    <Text style={localStyles.bonusChipText}>
                      <Text accessibilityLabel="">💎 </Text>{currentTaskItem?.isBonusRejected ? formData.maxBonus : formData.approvedBonus}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={[
                      localStyles.bonusInputWrapper,
                      !canFullyEdit ? localStyles.disabledSection : null
                    ]}>
                      <Text style={localStyles.bonusJewelIcon}>💎</Text>
                      <TextInput
                        value={formData.maxBonus}
                        onChangeText={(value) => handleInputChange('maxBonus', value)}
                        style={[localStyles.textInputStyle, localStyles.bonusInputField, localStyles.bonusTextInputStyle]}
                        contentStyle={[localStyles.textInputContentStyle, localStyles.bonusTextInputContentStyle]}
                        textColor={colors.accent} 
                        mode="flat"
                        placeholder="Enter bonus reward"
                        theme={{
                          roundness: 0,
                          colors: {
                            primary: colors.accent,
                            onSurface: colors.accent,
                            surface: 'transparent',
                            background: 'transparent',
                            outline: colors.accent,
                            onSurfaceVariant: colors.accentLight,
                          }
                        }}
                        disabled={!canFullyEdit}
                      />
                    </View>
                    {!currentTaskItem?.bonusStatusAt && !currentTaskItem?.bonusClaimedAt && currentTaskItem?.percentComplete !== 100 && !currentTaskItem?.isPrivate && (
                      <Text style={localStyles.infoLabel}>ℹ️ Bonus can be approved once the task is completed.</Text>
                    )}
                  </>
                )}

                {/* Bonus Status Information */}
                {currentTaskItem?.bonusStatusAt && (
                  <View style={localStyles.bonusStatusContainer}>
                    <View style={localStyles.bonusStatusIndicatorRow}>
                      <View style={[localStyles.bonusStatusIndicator, currentTaskItem.isBonusRejected ? localStyles.rejectedStatus : localStyles.approvedStatus]}>
                        <Text style={[localStyles.bonusStatusText, currentTaskItem.isBonusRejected ? localStyles.rejectedStatusText : localStyles.approvedStatusText]}>
                          {currentTaskItem.isBonusRejected ? '❌ REJECTED' : '✅ APPROVED'}
                        </Text>
                      </View>
                      
                      {user?.isAdmin && (
                        <IconButton
                          icon="pencil"
                          size={18}
                          onPress={handleEditBonusClick}
                          style={localStyles.approvalEditButton}
                          iconColor={colors.primary}
                        />
                      )}
                    </View>
                    
                    {bonusApprovedByMember && (
                      <Text style={localStyles.bonusStatusByText}>
                        by {bonusApprovedByMember.firstName} {bonusApprovedByMember.lastName}
                      </Text>
                    )}
                    
                    {currentTaskItem.bonusStatusComment && (
                      <View style={localStyles.bonusStatusCommentContainer}>
                        <Text style={localStyles.bonusStatusCommentLabel}>Comment:</Text>
                        <Text style={localStyles.bonusStatusComment}>
                          {currentTaskItem.bonusStatusComment}
                        </Text>
                      </View>
                    )}
                    
                    {currentTaskItem.bonusStatusAt && (
                      <Text style={localStyles.bonusStatusDateText}>
                        {formatDateForDisplay(convertUTCToLocal(currentTaskItem.bonusStatusAt))}
                      </Text>
                    )}
                  </View>
                )}

                {/* Last Claimed At Information - only show if bonus not approved/rejected yet */}
                {!currentTaskItem?.bonusStatusAt && currentTaskItem?.bonusClaimedAt && !isDirty && (
                  <View style={localStyles.bonusClaimedContainer}>
                    <View style={localStyles.bonusClaimedRow}>
                      <Text style={localStyles.bonusClaimedLabel}>Last Claimed At:</Text>
                      <Text style={localStyles.bonusClaimedDateText}>
                        {formatDateForDisplay(convertUTCToLocal(currentTaskItem.bonusClaimedAt))}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Task Bonus Approval Buttons */}
                {formData.percentComplete === 100 && 
                formData.maxBonus && 
                !currentTaskItem?.bonusStatusAt && 
                isEditing &&
                !isDirty && (
                  <>
                    <View style={localStyles.bonusApprovalButtons}>
                      {user?.isAdmin && !currentTaskItem?.isPrivate ? (
                        <>
                          <Button
                            mode="contained"
                            onPress={handleBonusApproveClick}
                            style={[localStyles.bonusButton, localStyles.approveButton]}
                            labelStyle={localStyles.bonusButtonLabel}
                            compact
                          >
                            Approve
                          </Button>
                          <Button
                            mode="contained"
                            onPress={handleBonusRejectClick}
                            style={[localStyles.bonusButton, localStyles.rejectButton]}
                            labelStyle={localStyles.bonusButtonLabel}
                            compact
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        (currentTaskItem?.assignedTo && user?.id === currentTaskItem?.assignedTo && !isDirty && !currentTaskItem?.isPrivate && (
                          <Button
                            mode="contained"
                            onPress={handleBonusClaim}
                            disabled={!canClaimBonus()}
                            style={[
                              localStyles.bonusButton, 
                              localStyles.claimButton,
                              !canClaimBonus() && { backgroundColor: colors.textSecondary }
                            ]}
                            labelStyle={localStyles.bonusButtonLabel}
                            compact
                          >
                            {!canClaimBonus() ? `Wait 24h (${getRemainingTime()} left...)` : 'Claim'}
                          </Button>
                        ))
                      )}
                    </View>
                  </>
                )}
              </View>
            </SubscriptionGate>

            {/* Credits and Grade Section */}
            <View style={[
              localStyles.creditsGradeSection,
              !canFullyEdit ? localStyles.disabledSection : null
            ]}>
              <Credits
                value={formData.credits}
                onCreditsChange={(credits: number | null) => handleInputChange('credits', credits)}
                size="small"
                disabled={!canFullyEdit}
              />
              <Grade
                value={letterGrade}
                onGradeChange={handleLetterGradeChange}
                size="small"
                disabled={!canFullyEdit}
              />
            </View>

            <SubscriptionGate 
              requiredTier={SubscriptionTier.Pro}
              // requiresFeature={(limits) => limits.comments} 
              overlayWhenLocked
              onUpgradePress={() => setUpgradeModalVisible(true)}
            >
              {isEditing && currentTaskItem?.id && (
                <>
                  <TaskCommentsPreview
                    // @ts-ignore - key is valid in React but not in TS type definitions
                    key={`comments-preview-main-${commentsRefreshKey}`}
                    taskId={currentTaskItem.id}
                    onPress={() => setCommentsModalVisible(true)}
                  />
                </>
              )}
            </SubscriptionGate>
          </Card.Content>
        </Card>
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

      {/* FAB for save only when not editing, FAB.Group when editing */}
      {isEditing ? (
        <FAB.Group
          open={fabOpen}
          visible={true}
          icon={fabOpen ? 'close' : 'dots-vertical'}
          actions={[
            ...(currentTaskItem?.id ? [{
              icon: 'comment-multiple-outline',
              label: 'Comments',
              onPress: () => setCommentsModalVisible(true),
              style: { backgroundColor: colors.secondary },
              color: 'white',
              accessibilityLabel: 'Comments',
              accessibilityHint: 'View and manage task comments'
            }] : []),
            ...(!isNew && currentTaskItem?.id && canEditLimited ? [{
              icon: 'details',
              label: 'Details',
              onPress: () => {
                if (!currentTaskItem) return;

                navigation.navigate('TaskDetails', { 
                  taskId: currentTaskItem.id, 
                  taskName: currentTaskItem.name || 'Task'
                });
              },
              style: { backgroundColor: colors.secondary },
              color: 'white',
              accessibilityLabel: 'Details',
              accessibilityHint: 'View detailed task information'
            }] : []),
            {
              icon: 'content-copy',
              label: 'Copy',
              onPress: handleCopy,
              style: { backgroundColor: colors.primary },
              color: 'white',
              accessibilityLabel: 'Copy',
              accessibilityHint: 'Create a copy of this task'
            },
            ...(canFullyEdit ? [{
              icon: 'delete',
              label: 'Delete',
              onPress: handleDelete,
              style: { backgroundColor: colors.error },
              color: 'white',
              accessibilityLabel: 'Delete',
              accessibilityHint: 'Delete this task permanently'
            }] : []),
            ...(canFullyEdit || canEditLimited ? [{
              icon: 'content-save',
              label: 'Save',
              onPress: handleSaveClick,
              style: { backgroundColor: colors.accent },
              color: 'white',
              accessibilityLabel: 'Save',
              accessibilityHint: 'Save changes to this task'
            }] : []),
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={{ paddingBottom: bottom + 16, paddingRight: right + 16 }}
          fabStyle={{ backgroundColor: colors.accent }}
          color="white"
          accessibilityLabel={fabOpen ? 'Close menu' : 'Open task actions menu'}
        />
      ) : (
        <FAB
          icon="content-save"
          // label="Save"
          onPress={handleSaveClick}
          style={[
            localStyles.fabAbsolute,
            { right: right + 16, bottom: bottom + 16, backgroundColor: colors.accent }
          ]}
          color="white"
          accessibilityRole="button"
          accessibilityLabel="Save task"
          accessibilityHint="Save this new task"
        />
      )}

      {/* Comments Modal */}
      {isEditing && currentTaskItem?.id && (
        <TaskCommentsModal
          visible={commentsModalVisible}
          onClose={() => setCommentsModalVisible(false)}
          taskId={currentTaskItem.id}
          taskName={currentTaskItem.name || formData.name}
          onCommentsChanged={handleCommentsChanged}
        />
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

      {/* Bonus Approval/Rejection Dialog */}
      <Modal
        transparent
        visible={bonusDialogVisible}
        animationType="fade"
        onRequestClose={handleBonusDialogCancel}
      >
        <TouchableWithoutFeedback onPress={handleBonusDialogCancel}>
          <View style={localStyles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.bonusDialogCard}>
            <ScrollView 
              style={localStyles.bonusDialogScrollView}
              contentContainerStyle={localStyles.bonusDialogScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={localStyles.bonusDialogHeader}>
                <Text variant="headlineSmall" style={localStyles.bonusDialogTitle}>
                  {bonusDialogMode === 'approve' ? 'Approve Bonus' : 'Reject Bonus'}
                </Text>
              </View>

              {/* User Info Section */}
              <View style={localStyles.userSection}>
                <UserAvatar
                  size={60}
                  firstName={assignedToTeamMember?.firstName}
                  lastName={assignedToTeamMember?.lastName}
                  imageUri={assignedToTeamMember?.avatarUri}
                />
                <View style={localStyles.userInfo}>
                  <Text variant="bodyLarge" style={localStyles.userName}>
                    {(() => {
                      const firstName = assignedToTeamMember?.firstName?.trim() || '';
                      const lastName = assignedToTeamMember?.lastName?.trim() || '';
                      return `${firstName} ${lastName}`.trim() || assignedToTeamMember?.userName || 'Unknown User';
                    })()}
                  </Text>
                  <Text variant="bodySmall" style={localStyles.userDates}>
                    {formData.name || 'No task name specified'}
                  </Text>
                  {(letterGrade && letterGrade !== '' && formData.credits) && (
                    <View style={localStyles.gradeCreditsContainer}>
                      <View style={[
                        localStyles.gradeContainer,
                        { backgroundColor: getGradeColor(letterGrade) }
                      ]}>
                        <Text style={localStyles.gradeText}>
                          {letterGrade}
                        </Text>
                      </View>
                      <View style={[
                        localStyles.creditsContainer, 
                        { 
                          borderColor: getCreditsColor(formData.credits || 0),
                          backgroundColor: getCreditsColor(formData.credits || 0) + '20'
                        }
                      ]}>
                        <Text style={[
                          localStyles.creditsText,
                          { color: getCreditsColor(formData.credits || 0) }
                        ]}>
                          💳 {formData.credits}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Task Info Section */}
              <View style={localStyles.taskInfoSection}>
                {formData.dueAt && (
                  <View style={localStyles.infoRow}>
                    <Text variant="bodyMedium" style={localStyles.infoLabel}>Due Date:</Text>
                    <View style={localStyles.dueDateContainer}>
                      <Text variant="bodyMedium" style={localStyles.infoValue}>
                        {formatDateForDisplay(formData.dueAt)}
                      </Text>
                      {new Date() > new Date(formData.dueAt) && !formData.completedAt && (
                        <Text style={localStyles.pastDueLabel}>Past Due</Text>
                      )}
                    </View>
                  </View>
                )}

                {formData.completedAt && (
                  <View style={localStyles.infoRow}>
                    <Text variant="bodyMedium" style={localStyles.infoLabel}>Completed:</Text>
                    <Text variant="bodyMedium" style={localStyles.infoValue}>
                      {formatDateForDisplay(formData.completedAt)}
                    </Text>
                  </View>
                )}

                {formData.maxBonus && (
                  <View style={localStyles.infoRow}>
                    <Text variant="bodyMedium" style={localStyles.infoLabel}>Max Bonus:</Text>
                    <Text variant="bodyMedium" style={localStyles.infoValue}>{formData.maxBonus}</Text>
                  </View>
                )}
              </View>

              {bonusDialogMode === 'approve' && (
                <View style={localStyles.approvedBonusContainer}>
                  <Text variant="bodyMedium" style={localStyles.approvedBonusLabel}>
                    Approved Bonus *
                  </Text>
                  <View style={localStyles.bonusInputWrapper}>
                    <Text style={localStyles.jewelSign} accessibilityLabel="">💎</Text>
                    <TextInput
                      mode="outlined"
                      value={approvedBonus}
                      onChangeText={setApprovedBonus}
                      placeholder={formData.maxBonus || "Enter bonus reward"}
                      style={localStyles.bonusAmountInput}
                      contentStyle={localStyles.bonusAmountInputContent}
                      outlineStyle={localStyles.bonusAmountInputOutline}
                      multiline
                      numberOfLines={2}
                      accessibilityRole="text"
                      accessibilityLabel="Approved bonus amount"
                      accessibilityHint="Enter the amount of bonus to award for this task"
                    />
                  </View>
                </View>
              )}

              <View style={localStyles.bonusCommentSection}>
                <Text variant="bodyMedium" style={localStyles.bonusCommentLabel}>
                  Comment {bonusDialogMode === 'approve' ? '(optional)' : '*'}
                </Text>
                <TextInput
                  mode="outlined"
                  value={bonusComment}
                  onChangeText={setBonusComment}
                  placeholder={bonusDialogMode === 'approve' 
                    ? "Add a comment..."
                    : "Reason for rejection..."
                  }
                  multiline
                  numberOfLines={2}
                  style={[localStyles.bonusCommentInput, localStyles.commentInput]}
                  outlineStyle={localStyles.commentInputOutline}
                  accessibilityRole="text"
                  accessibilityLabel="Bonus comment"
                  accessibilityHint={bonusDialogMode === 'approve' ? "Add an optional comment about this bonus approval" : "Enter the reason for rejecting this bonus"}
                />
              </View>

              {/* Action Buttons - Inside ScrollView */}
              <View style={localStyles.bonusDialogButtons}>
                <Button
                  mode="outlined"
                  onPress={handleBonusDialogCancel}
                  style={localStyles.bonusDialogCancelButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Cancel bonus approval process"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleBonusDialogConfirm}
                  style={[
                    localStyles.bonusDialogSubmitButton,
                    bonusDialogMode === 'approve' 
                      ? { backgroundColor: colors.success }
                      : { backgroundColor: colors.error }
                  ]}
                  labelStyle={localStyles.bonusDialogSubmitButtonLabel}
                  accessibilityRole="button"
                  accessibilityLabel={bonusDialogMode === 'approve' ? 'Approve bonus' : 'Reject bonus'}
                  accessibilityHint={bonusDialogMode === 'approve' ? 'Approve the bonus for this task' : 'Reject the bonus for this task'}
                >
                  {bonusDialogMode === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Bonus Confirmation Dialog */}
      <Modal
        transparent
        visible={editBonusDialogVisible}
        animationType="fade"
        onRequestClose={handleEditBonusCancel}
      >
        <TouchableWithoutFeedback onPress={handleEditBonusCancel}>
          <View style={localStyles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text variant="titleLarge" style={localStyles.modalTitle}>
              Edit Bonus Decision
            </Text>
            <Text variant="bodyMedium" style={localStyles.modalMessage}>
              What would you like to do with this bonus?
            </Text>
            <View style={localStyles.modalActions}>
              <Button
                mode="contained"
                onPress={handleEditBonusApprove}
                style={[localStyles.editModalButton, localStyles.approveButton]}
                labelStyle={localStyles.editModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Approve"
                accessibilityHint="Change bonus decision to approved"
              >
                Approve
              </Button>
              <Button
                mode="contained"
                onPress={handleEditBonusReject}
                style={[localStyles.editModalButton, localStyles.rejectButton]}
                labelStyle={localStyles.editModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Reject"
                accessibilityHint="Change bonus decision to rejected"
              >
                Reject
              </Button>
              <Button
                mode="outlined"
                onPress={handleEditBonusCancel}
                style={[localStyles.editModalButton, localStyles.cancelModalButton]}
                labelStyle={localStyles.cancelModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                accessibilityHint="Cancel editing bonus decision"
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Allowance Approval Confirmation Dialog */}
      <Modal
        transparent
        visible={editAllowanceDialogVisible}
        animationType="fade"
        onRequestClose={handleEditAllowanceCancel}
      >
        <TouchableWithoutFeedback onPress={handleEditAllowanceCancel}>
          <View style={localStyles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text variant="titleLarge" style={localStyles.modalTitle}>
              Edit {rewardWordCapital} Approval
            </Text>
            <Text variant="bodyMedium" style={localStyles.modalMessage}>
              What would you like to do with this task's {rewardWordLowercase} approval?
            </Text>
            <View style={localStyles.modalActions}>
              <Button
                mode="contained"
                onPress={handleEditAllowanceApprove}
                style={[localStyles.editModalButton, localStyles.approveButton]}
                labelStyle={localStyles.editModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Approve"
                accessibilityHint="Change allowance decision to approved"
              >
                Approve
              </Button>
              <Button
                mode="contained"
                onPress={handleEditAllowanceReject}
                style={[localStyles.editModalButton, localStyles.rejectButton]}
                labelStyle={localStyles.editModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Reject"
                accessibilityHint="Change allowance decision to rejected"
              >
                Reject
              </Button>
              <Button
                mode="outlined"
                onPress={handleEditAllowanceCancel}
                style={[localStyles.editModalButton, localStyles.cancelModalButton]}
                labelStyle={localStyles.cancelModalButtonLabel}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                accessibilityHint="Cancel editing allowance decision"
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Allowance Approval/Rejection Dialog */}
      <Modal
        transparent
        visible={allowanceDialogVisible}
        animationType="fade"
        onRequestClose={handleAllowanceDialogCancel}
      >
        <TouchableWithoutFeedback onPress={handleAllowanceDialogCancel}>
          <View style={localStyles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.allowanceDialogCard}>
            <ScrollView 
              style={localStyles.bonusDialogScrollView}
              contentContainerStyle={localStyles.bonusDialogScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={localStyles.bonusDialogHeader}>
                <Text variant="headlineSmall" style={localStyles.bonusDialogTitle}>
                  {allowanceDialogMode === 'approve' ? `Approve Task for ${rewardWordCapital}` : `Reject Task for ${rewardWordCapital}`}
                </Text>
              </View>

              {/* User Info Section */}
              <View style={localStyles.userSection}>
                <UserAvatar
                  size={60}
                  firstName={assignedToTeamMember?.firstName}
                  lastName={assignedToTeamMember?.lastName}
                  imageUri={assignedToTeamMember?.avatarUri}
                />
                <View style={localStyles.userInfo}>
                  <Text variant="bodyLarge" style={localStyles.userName}>
                    {(() => {
                      const firstName = assignedToTeamMember?.firstName?.trim() || '';
                      const lastName = assignedToTeamMember?.lastName?.trim() || '';
                      return `${firstName} ${lastName}`.trim() || assignedToTeamMember?.userName || 'Unknown User';
                    })()}
                  </Text>
                  <Text variant="bodySmall" style={localStyles.userDates}>
                    {formData.name || 'No task name specified'}
                  </Text>
                </View>
              </View>

              {/* Allowance Interval Section */}
              <View style={localStyles.taskInfoSection}>
                <DropdownComponent
                  data={allowanceIntervalsDropdownData}
                  value={allowanceDialogIntervalId}
                  onValueChange={(item) => {
                    if (item.value !== null) {
                      setAllowanceDialogIntervalId(item.value);
                    }
                  }}
                  placeholder={`Select ${rewardWordCapital} Interval`}
                  label={`${rewardWordCapital} Interval`}
                  searchable={false}
                  disabled={allowanceDialogMode === 'reject'}
                  allowClear={false}
                />
              </View>

              <View style={localStyles.bonusCommentSection}>
                <Text variant="bodyMedium" style={localStyles.bonusCommentLabel}>
                  Comment {allowanceDialogMode === 'approve' ? '(optional)' : '*'}
                </Text>
                <TextInput
                  mode="outlined"
                  value={allowanceComment}
                  onChangeText={setAllowanceComment}
                  placeholder={allowanceDialogMode === 'approve' 
                    ? "Add a comment..."
                    : "Reason for rejection..."
                  }
                  multiline
                  numberOfLines={2}
                  style={[localStyles.bonusCommentInput, localStyles.commentInput]}
                  outlineStyle={localStyles.commentInputOutline}
                  accessibilityRole="text"
                  accessibilityLabel="Allowance comment"
                  accessibilityHint={allowanceDialogMode === 'approve' ? "Add an optional comment about this allowance approval" : "Enter the reason for rejecting this allowance"}
                />
              </View>

              {/* Action Buttons - Inside ScrollView */}
              <View style={localStyles.bonusDialogButtons}>
                <Button
                  mode="outlined"
                  onPress={handleAllowanceDialogCancel}
                  style={localStyles.bonusDialogCancelButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Cancel allowance approval process"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAllowanceDialogConfirm}
                  style={[
                    localStyles.bonusDialogSubmitButton,
                    allowanceDialogMode === 'approve' 
                      ? { backgroundColor: colors.success }
                      : { backgroundColor: colors.error }
                  ]}
                  labelStyle={localStyles.bonusDialogSubmitButtonLabel}
                  accessibilityRole="button"
                  accessibilityLabel={allowanceDialogMode === 'approve' ? 'Approve allowance' : 'Reject allowance'}
                  accessibilityHint={allowanceDialogMode === 'approve' ? 'Approve this task for allowance calculation' : 'Reject this task for allowance calculation'}
                >
                  {allowanceDialogMode === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  title: {
    marginBottom: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 140, 
  },
  cardContent: {
    // Base card content style
  },
  section: {
    marginBottom: 16,
    padding: 6,
    backgroundColor: 'transparent',
  },
  disabledSection: {
    opacity: 0.6,
  },
  creditsGradeSection: {
    marginBottom: 16,
    padding: 6,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
  },
  taskCard: {
    backgroundColor: colors.backgroundDefault,
    width: '100%',
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  allowanceIntervalInputField: {
    marginTop: 20,
    marginBottom: 18,
  },
  inputField: {
    marginBottom: 16,
  },
  percentCompleteInputField: {
    marginVertical: 22,
  },
  bonusInputField: {
    marginBottom: 16,
  },
  textInputStyle: {
    backgroundColor: colors.backgroundPaper,
  },
  bonusTextInputStyle: {
    fontWeight: '700',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  textInputContentStyle: {
    paddingHorizontal: 12,
  },
  bonusTextInputContentStyle: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'left',
    fontWeight: '700',
    color: colors.accent,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  privateSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  disabledSwitchHelpText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 12,
  },
  fabAbsolute: {
    position: 'absolute',
  },
  taskDetailsButton: {
    borderColor: colors.primary,
    marginBottom: 24,
  },
  accordionCard: {
    marginBottom: 16,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  accordionTitle: {
    color: colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  accordionToggle: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  toggleButtonContainer: {
    marginRight: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
  },
  accordionHeaderExpanded: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accordionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundPaper,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  accordionIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  accordionContent: {
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: colors.backgroundDefault,
  },
  accordionSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  accordionSectionLast: {
    marginBottom: 0,
    paddingBottom: 16,
  },
  bonusApprovalContainer: {
    marginTop: 8,
    marginBottom: 26,
    padding: 12,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  bonusApprovalLabel: {
    fontFamily: fonts.fredokaSemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  bonusApprovalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingTop: 12,
  },
  bonusButton: {
    minWidth: 80,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  bonusButtonLabel: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlignVertical: 'center',
    includeFontPadding: false,
    textAlign: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  claimButton: {
    backgroundColor: colors.primary,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalOverlayKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 50, // Position modal higher when keyboard is visible
  },
  allowanceDialogCard: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%', // Change from fixed height to maxHeight to allow flexibility
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bonusDialogCard: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%', // Change from fixed height to maxHeight to allow flexibility
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bonusDialogScrollView: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bonusDialogScrollContent: {
    paddingBottom: 20,
  },
  bonusDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  bonusDialogHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bonusDialogTitle: {
    fontFamily: 'Fredoka-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  bonusDialogMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  bonusCommentSection: {
    marginBottom: 20,
  },
  bonusCommentLabel: {
    marginBottom: 8,
    color: colors.textOnBackground,
    fontWeight: '600',
  },
  bonusCommentInput: {
    backgroundColor: colors.backgroundPaper,
    minHeight: 60,
    borderRadius: 8,
  },
  commentInput: {
    borderRadius: 8,
  },
  commentInputOutline: {
    borderRadius: 8,
  },
  bonusDialogCancelButton: {
    flex: 1,
    borderColor: colors.divider,
  },
  bonusDialogSubmitButton: {
    flex: 1,
  },
  bonusDialogSubmitButtonLabel: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  // Edit Bonus Modal Styles
  modalContent: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontFamily: 'Fredoka-SemiBold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    gap: 12,
  },
  editModalButton: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  editModalButtonLabel: {
    color: colors.textOnPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelModalButton: {
    borderColor: colors.textSecondary,
    backgroundColor: 'transparent',
  },
  cancelModalButtonLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Enhanced Approved Bonus Styles
  approvedBonusContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundAccent,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 18,
    shadowColor: colors.accent,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  approvedBonusLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  bonusInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 48,
  },
  jewelSign: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 12,
    lineHeight: 28,
  },
  bonusAmountInput: {
    flex: 1,
    backgroundColor: colors.backgroundPaper,
    minHeight: 60,
    textAlign: 'center',
  },
  bonusAmountInputContent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 16,
    lineHeight: 22,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  bonusAmountInputOutline: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  // User info section styles
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  userDates: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Task info section styles
  taskInfoSection: {
    marginBottom: 20,
  },
  taskInfoHeader: {
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  // infoLabel: {
  //   color: colors.textSecondary,
  //   fontSize: 14,
  //   flex: 0.4,
  // },
  infoValue: {
    color: colors.textOnBackground,
    fontSize: 14,
    fontWeight: '700',
    flex: 0.6,
    textAlign: 'right',
  },
  gradeCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  gradeContainer: {
    width: 48,
    height: 38,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gradeText: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  creditsContainer: {
    width: 48,
    height: 38,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsText: {
    color: colors.secondary,
    fontWeight: '500',
    fontSize: 12,
  },
  dueDateContainer: {
    flex: 0.6,
    alignItems: 'flex-end',
  },
  pastDueLabel: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    backgroundColor: colors.backgroundAccent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  // Bonus Status Styles
  bonusStatusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  bonusStatusIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bonusStatusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  approvalEditButton: {
    margin: 0,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    width: 32,
    height: 32,
  },
  approvedStatus: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  rejectedStatus: {
    backgroundColor: colors.error + '20',
    borderWidth: 1,
    borderColor: colors.error,
  },
  bonusStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  approvedStatusText: {
    color: colors.success,
  },
  rejectedStatusText: {
    color: colors.error,
  },
  bonusStatusByText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  bonusStatusCommentContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  bonusStatusCommentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  bonusStatusComment: {
    fontSize: 13,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bonusStatusDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '400',
  },
  bonusChipContainer: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  bonusJewelIcon: {
    fontSize: 16,
    marginRight: 8,
    marginLeft: 2,
  },
  // Bonus Claimed Styles
  bonusClaimedContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  bonusClaimedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusClaimedLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bonusClaimedDateText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Allowance Approval Styles
  allowanceApprovalContainer: {
    marginTop: 0,
    marginBottom: 26,
    padding: 16,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary + '80',
    borderStyle: 'dashed',
  },
  allowanceApprovalLabel: {
    fontFamily: fonts.fredokaSemiBold,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  allowanceApprovalSecondaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
 
  allowanceStatusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  allowanceStatusIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allowanceStatusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  allowanceStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  allowanceStatusByText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  allowanceStatusCommentContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  allowanceStatusCommentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  allowanceStatusComment: {
    fontSize: 13,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  allowanceStatusDateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '400',
  },
  allowanceApprovalContent: {
    alignItems: 'center',
  },
  allowanceApprovalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  allowanceButton: {
    minWidth: 80,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  allowanceButtonLabel: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlignVertical: 'center',
    includeFontPadding: false,
    textAlign: 'center',
  },
  pendingApprovalContainer: {
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  pendingApprovalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    textAlign: 'center',
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
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
