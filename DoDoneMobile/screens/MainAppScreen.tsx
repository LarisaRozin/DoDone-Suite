/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { Icon, FAB } from 'react-native-paper';
import { Chip, Snackbar } from '../components/StyledText';
import { Text } from '../components/StyledText';
import { enableScreens } from 'react-native-screens';
import { refreshGestureHandlers, GestureTracker, debounceGesture } from '../utils/gestureUtils';

// Enable screens for better modal handling
enableScreens(false);
import { colors, styles } from '../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { PagedListRequestBuilder, PagedTaskItemListRequest, PagedTaskItemListRequestBuilder, SortDirection, TaskItemActiveStatusFilter, TaskItemAllowanceAccreditedStatusFilter, TaskItemArchivedStatusFilter, TaskItemAssignmentStatusFilter, TaskItemBonusStatusFilter, TaskItemCompletionStatusFilter, TaskItemDueStatusFilter, TaskItemNeedReviewStatusFilter, TaskItemPagingUtils, TaskItemPriority, useAuth, useConfig, useTaskItems, useTeam, PagedTaskCommentListRequestBuilder, TaskItemPriorityFilter, TaskItemStartedStatusFilter, TaskItemEndedStatusFilter, NotificationType, DELETED_USER_ID, SYSTEM_USER_ID } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import { TouchableOpacity } from 'react-native';
import { FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardBottomBar from '../components/DashboardBottomBar';
import DashboardTopBar from '../components/DashboardTopBar';
import DashboardBottomStatsBar from '../components/DashboardBottomStatsBar';
import { TaskCommentIndicator } from '../components/TaskCommentIndicator';
import { NotificationData, pushNotificationService } from '../services/PushNotificationService';
import { useNotification } from '../contexts/NotificationContext';
import { useCelebration } from '../contexts/CelebrationContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { formatDateForDisplay, convertUTCToLocal } from '../utils/dateUtils';
import { UpgradeModal } from '../components/UpgradeModal';
import { useSubscriptionCheck } from '../hooks/useSubscriptionCheck';

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

const getPriorityColor = (priority: TaskItemPriority): string => {
  switch (priority) {
    case TaskItemPriority.Critical:
      return colors.error;
    case TaskItemPriority.High:
      return colors.warning;
    case TaskItemPriority.Medium:
      return colors.accent;
    case TaskItemPriority.Low:
      return colors.success;
    case TaskItemPriority.None:
    default:
      return colors.textSecondary;
  }
};

const getPriorityLabel = (priority: TaskItemPriority): string => {
  switch (priority) {
    case TaskItemPriority.Critical:
      return 'Critical';
    case TaskItemPriority.High:
      return 'High';
    case TaskItemPriority.Medium:
      return 'Medium';
    case TaskItemPriority.Low:
      return 'Low';
    case TaskItemPriority.None:
    default:
      return 'None';
  }
};

const truncateBonusText = (text: string, maxLength: number = 12): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
};

type BonusStatus = 'approved' | 'rejected' | 'pending';
type AllowanceStatus = 'approved' | 'rejected' | 'pending' | 'not-applicable';

const getBonusStatus = (item: any): BonusStatus => {
  // If there's an approved bonus, it's approved
  if (item.approvedBonus !== null && item.approvedBonus !== undefined && item.approvedBonus.trim() !== "") {
    return 'approved';
  }
  // If there's a max bonus but it's been rejected
  if ((item.maxBonus !== null && item.maxBonus !== undefined && item.maxBonus.trim() !== "") && item.isBonusRejected) {
    return 'rejected';
  }
  // If there's a max bonus but no approval status yet
  if (item.maxBonus !== null && item.maxBonus !== undefined && item.maxBonus.trim() !== "") {
    return 'pending';
  }
  // Should not happen if the chip is being rendered, but fallback
  return 'pending';
};

const getAllowanceApprovalStatus = (item: any, _currentUser: any): AllowanceStatus => {
  // If task is private, allowance approval doesn't apply
  if (item.isPrivate) {
    return 'not-applicable';
  }
  
  // If allowance approval status has been set
  if (item.allowanceApprovalStatusAt) {
    return item.isApprovedForAllowance ? 'approved' : 'rejected';
  }
  
  // If task needs approval but hasn't been reviewed yet
  return 'pending';
};

const getBonusChipColors = (status: BonusStatus) => {
  switch (status) {
    case 'approved':
      return {
        backgroundColor: colors.success + '20', // Light green background
        borderColor: colors.success,
        textColor: colors.success
      };
    case 'rejected':
      return {
        backgroundColor: colors.error + '20', // Light red background
        borderColor: colors.error,
        textColor: colors.error
      };
    case 'pending':
    default:
      return {
        backgroundColor: colors.backgroundAccent, // Default background
        borderColor: colors.accent,
        textColor: colors.textSecondary
      };
  }
};

const getAllowanceApprovalChipColors = (status: AllowanceStatus) => {
  switch (status) {
    case 'approved':
      return {
        backgroundColor: colors.primary + '20', // Light blue background
        borderColor: colors.primary,
        textColor: colors.primary
      };
    case 'rejected':
      return {
        backgroundColor: colors.error + '20', // Light red background
        borderColor: colors.error,
        textColor: colors.error
      };
    case 'pending':
      return {
        backgroundColor: colors.warning + '20', // Light orange background
        borderColor: colors.warning,
        textColor: colors.warning
      };
    case 'not-applicable':
    default:
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'transparent'
      };
  }
};

type MainAppScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;
type MainAppScreenRouteProp = RouteProp<RootStackParamList, 'MainApp'>;

interface MainAppScreenProps {
  navigation: MainAppScreenNavigationProp;
  route: MainAppScreenRouteProp;
}

const allTasksIntervalId = -2;
function BuildTaskItemsBaseRequest() : PagedTaskItemListRequest {
  return new PagedTaskItemListRequestBuilder()
    .setTeamAllowanceIntervalId(allTasksIntervalId) 
    .setArchivedFilter(TaskItemArchivedStatusFilter.Unarchived)
    .setCompletionFilter(TaskItemCompletionStatusFilter.InProgress)
    .setActiveFilter(TaskItemActiveStatusFilter.Active)
    .setPaging(1, 10)
    .build();
}

function TaskItemsDisplay({ navigation, route }: { navigation: MainAppScreenNavigationProp; route: MainAppScreenRouteProp }) {
  const { user, token } = useAuth();
  const { bottom, right } = useSafeAreaInsets();
  const { showPushNotification, setNavigationCallback: setNotificationNavigationCallback } = useNotification();
  const { showCelebration } = useCelebration();
  const { handleSubscriptionUpdate } = useSubscription();
  
  // Counter to force team data refresh
  const [teamRefreshCounter, setTeamRefreshCounter] = useState(0);
  
  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 50) // Get team members
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    [] 
  );
  
  const { teamMembersList, teamDetails, fetchTeamDetails, refreshTeamMembers } = useTeam(teamRequest);
  const team = React.useMemo(() => teamMembersList?.data || [], [teamMembersList?.data]);
  const teamIds = React.useMemo(() => team.map(m => m.id).join(','), [team]);
  const isBusiness = teamDetails?.isBusiness || false;  

  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  const getDueDateStatus = (dueAt: string) => {
    const dueDate = convertUTCToLocal(dueAt);
    if (!dueDate) {
      return null;
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Reset time parts for accurate date comparison
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dueDateOnly < todayOnly) {
      return { label: 'Past Due', color: colors.error };
    } else if (dueDateOnly.getTime() === todayOnly.getTime()) {
      return { label: 'Due Today', color: colors.warning };
    } else if (dueDateOnly.getTime() === tomorrowOnly.getTime()) {
      return { label: 'Due Tomorrow', color: colors.errorLight };
    } else {
      return { label: 'Due', color: colors.textOnBackground };
    }
  };

  const { baseUrl } = useConfig();
  const [pagedRequest, setPagedRequest] = useState<PagedTaskItemListRequest>(BuildTaskItemsBaseRequest()); 
  const { pagedTaskItems, loadingTaskItems, refreshTaskItems } = useTaskItems(pagedRequest);
  
  // Track comment counts for each task
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loadingCommentCounts, setLoadingCommentCounts] = useState<Set<number>>(new Set());
  
  // Real function to get comment count from API
  const fetchCommentCount = React.useCallback(async (taskId: number) => {
    if (loadingCommentCounts.has(taskId) || commentCounts[taskId] !== undefined) {
      return; // Already loading or already have the count
    }
    
    if (!token || !baseUrl) {
      return;
    }
    
    setLoadingCommentCounts(prev => new Set(prev).add(taskId));
    
    try {
      const commentsRequest = new PagedTaskCommentListRequestBuilder(taskId)
        .setPaging(1, 1) // Just get the first page to access total count
        .build();
      
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.comments.getList(commentsRequest);
      
      if (response && response.success) {
        const totalComments = (response as any)?.data?.paging?.totalItems || 0;
        setCommentCounts(prev => ({ ...prev, [taskId]: totalComments }));
      } else {
        setCommentCounts(prev => ({ ...prev, [taskId]: 0 }));
      }
    } catch (error) {
      console.error(`Error fetching comment count for task ${taskId}:`, error);
      setCommentCounts(prev => ({ ...prev, [taskId]: 0 }));
    } finally {
      setLoadingCommentCounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [commentCounts, loadingCommentCounts, token, baseUrl]);
  
  // Function to get comment count - triggers fetch if needed but defers setState
  const getCommentCount = React.useCallback((taskId: number): number => {
    const count = commentCounts[taskId];
    if (count === undefined && !loadingCommentCounts.has(taskId)) {
      // Defer the setState call to avoid updating during render
      setTimeout(() => {
        fetchCommentCount(taskId);
      }, 0);
      return 0; // Return 0 while loading
    }
    return count || 0;
  }, [commentCounts, loadingCommentCounts, fetchCommentCount]);
  
  // Local stats state to allow clearing when filters change
  const [currentStats, setCurrentStats] = useState(pagedTaskItems?.stats);
  const [currentAllowanceStats, setCurrentAllowanceStats] = useState(pagedTaskItems?.allowanceStats);
  const [currentBonusStats, setCurrentBonusStats] = useState(pagedTaskItems?.bonusStats);

  // Update stats when pagedTaskItems changes
  React.useEffect(() => {
    if (pagedTaskItems?.stats) {
      setCurrentStats(pagedTaskItems.stats);
      setCurrentAllowanceStats(pagedTaskItems.allowanceStats);
      setCurrentBonusStats(pagedTaskItems.bonusStats);
    }
  }, [pagedTaskItems?.stats, pagedTaskItems?.allowanceStats, pagedTaskItems?.bonusStats]);

  const stats = currentStats;
  const allowanceStats = currentAllowanceStats;
  const bonusStats = currentBonusStats;

  // Screen dimensions and orientation state
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isLandscape = screenData.width > screenData.height;

  // State for accumulated tasks and pagination
  const [allTaskItems, setAllTaskItems] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTimeoutId, setSearchTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Ref to prevent rapid successive calls to handleLoadMore
  const lastLoadMoreTimeRef = useRef<number>(0);

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<TaskItemAssignmentStatusFilter>(TaskItemAssignmentStatusFilter.Any);
  const [dueFilterStatus, setDueFilterStatus] = useState<TaskItemDueStatusFilter>(TaskItemDueStatusFilter.Any);
  const [startedFilterStatus, setStartedFilterStatus] = useState<TaskItemStartedStatusFilter>(TaskItemStartedStatusFilter.Any);
  const [endedFilterStatus, setEndedFilterStatus] = useState<TaskItemEndedStatusFilter>(TaskItemEndedStatusFilter.Any);
  const [activeFilterStatus, setActiveFilterStatus] = useState<TaskItemActiveStatusFilter>(TaskItemActiveStatusFilter.Active);
  const [archivedFilterStatus, setArchivedFilterStatus] = useState<TaskItemArchivedStatusFilter>(TaskItemArchivedStatusFilter.Unarchived);
  const [completedFilterStatus, setCompletedFilterStatus] = useState<TaskItemCompletionStatusFilter>(TaskItemCompletionStatusFilter.InProgress);
  const [allowanceNeedReviewFilterStatus, setAllowanceNeedReviewFilterStatus] = useState<TaskItemNeedReviewStatusFilter>(TaskItemNeedReviewStatusFilter.Any);
  const [bonusNeedReviewFilterStatus, setBonusNeedReviewFilterStatus] = useState<TaskItemNeedReviewStatusFilter>(TaskItemNeedReviewStatusFilter.Any);
  const [allowanceAccreditedStatusFilter, setAllowanceAccreditedStatusFilter] = useState<TaskItemAllowanceAccreditedStatusFilter>(TaskItemAllowanceAccreditedStatusFilter.Any);
  const [allowanceNeedReviewStatusFilter, setAllowanceNeedReviewStatusFilter] = useState<TaskItemNeedReviewStatusFilter>(TaskItemNeedReviewStatusFilter.Any);
  const [bonusStatusFilter, setBonusStatusFilter] = useState<TaskItemBonusStatusFilter>(TaskItemBonusStatusFilter.Any);
  const [priorityFilter, setPriorityFilter] = useState<TaskItemPriorityFilter>(TaskItemPriorityFilter.Any);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [allFilterStatus, setAllFilterStatus] = useState<boolean>(true);
  const [selectedTeamMember, setSelectedTeamMember] = useState<number | null>(null);
  const [selectedIntervalIndex, setSelectedIntervalIndex] = useState(0);
  // const [selectedIntervalId, setSelectedIntervalId] = useState<number | 0>(0); // 0 = All Intervals
  
  // Task filtering state
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedKindId, setSelectedKindId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);

  // Snackbar state for bulk action feedback
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  
  // Allowance modal state for notifications
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [highlightAllowanceId, setHighlightAllowanceId] = useState<string | undefined>(undefined);
  
  // State for triggered actions from navigation
  const [shouldExpandDashboard, setShouldExpandDashboard] = useState(false);
  const [shouldShowBonusModal, setShouldShowBonusModal] = useState(false);
  
  // State to force FlatList re-render when gestures become unresponsive
  const [flatListKey, setFlatListKey] = useState(0);
  const [modalInteractionCount, setModalInteractionCount] = useState(0);

  const handleAllowanceModalShown = () => {
    // Reset the state after modal is triggered
    setShowAllowanceModal(false);
    // Don't clear highlightAllowanceId immediately - let the modal handle it
    // The modal will use the ID and then it will be cleared when modal closes
    
    // Track modal interaction
    setModalInteractionCount(prev => prev + 1);
    gestureTracker.current.recordModalInteraction();
  };

  const handleAllowanceModalClosed = () => {
    // Clear the highlight ID when modal closes
    setHighlightAllowanceId(undefined);
    
    // Use gesture utility to properly refresh handlers after modal closes
    refreshGestureHandlers(() => {
      setFlatListKey(prev => prev + 1);
    });
  };

  // Helper function to start filtering and reset loading states
  const startFiltering = () => {
    setIsFiltering(true);
    setIsLoadingMore(false); // Reset loading more state to prevent flashing
  };

  // Handle route actions from navigation
  useEffect(() => {
    const action = route.params?.action;
    if (action) {
      // Use setTimeout to ensure UI has rendered before triggering actions
      setTimeout(() => {
        switch (action) {
          case 'expandDashboard':
            setShouldExpandDashboard(true);
            break;
          case 'showAllowances':
            setShowAllowanceModal(true);
            break;
          case 'showBonuses':
            setShouldShowBonusModal(true);
            break;
          default:
            console.warn('Unknown action:', action);
            break;
        }
      }, 500); // 500ms delay to ensure components are ready
    }
  }, [route.params?.action]);

  // Reset shouldExpandDashboard after it's been used
  useEffect(() => {
    if (shouldExpandDashboard) {
      const timer = setTimeout(() => {
        setShouldExpandDashboard(false);
      }, 1000); // Reset after 1 second
      return () => clearTimeout(timer);
    }
  }, [shouldExpandDashboard]);

  // Reset shouldShowBonusModal after it's been used  
  useEffect(() => {
    if (shouldShowBonusModal) {
      const timer = setTimeout(() => {
        setShouldShowBonusModal(false);
      }, 1000); // Reset after 1 second
      return () => clearTimeout(timer);
    }
  }, [shouldShowBonusModal]);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Initialize push notifications when component mounts
  useEffect(() => {
    pushNotificationService.initialize();
    
    // Set up display callback for foreground notifications
    pushNotificationService.setNotificationDisplayCallback((title: string, body: string, data?: any) => {
      showPushNotification(title, body, data);
    });
    
    // Set up celebration callback for approved notifications
    pushNotificationService.setCelebrationCallback((type: NotificationType, title: string, body: string, data: NotificationData) => {
      showCelebration({ type, title, body, data });
    });
    
    // Create a shared navigation handler for both PushNotificationService and NotificationContext
    const handleNotificationNavigation = (taskIdOrAllowance: string) => {
      if (taskIdOrAllowance.startsWith('allowance:')) {
        // Handle allowance notifications
        const allowanceHistoryId = taskIdOrAllowance.replace('allowance:', '');
        
        // Set the state to show the allowance modal
        setHighlightAllowanceId(allowanceHistoryId);
        setShowAllowanceModal(true);
      } else {
        // Handle task notifications
        const taskId = taskIdOrAllowance;

        // Fetch task details and navigate to TaskEditScreen
        const fetchTaskAndNavigate = async () => {
          try {
            if (baseUrl && token) {
              const apiClient = createApiClient(baseUrl, token);
              const taskDetails = await apiClient.tasks.getDetails(parseInt(taskId, 10));
              
              // Use push instead of navigate to force a new screen instance with fresh data
              // This ensures the TaskEditScreen remounts completely when navigating from a notification
              (navigation as any).push('TaskEdit', { 
                taskItem: taskDetails
              });
            } else {
              console.error('Missing baseUrl or token for API call');
            }
          } catch (error) {
            console.error('Error fetching task details:', error);
            // Show error notification if available
            if (showPushNotification) {
              showPushNotification('Error', 'Failed to load task details');
            }
          }
        };

        fetchTaskAndNavigate();
      }
    };
    
    // Set up navigation callback for PushNotificationService (background/quit notifications)
    pushNotificationService.setNavigationCallback(handleNotificationNavigation);
    
    // Set up navigation callback for NotificationContext (foreground in-app notifications)
    setNotificationNavigationCallback(handleNotificationNavigation);
    
    // Set up subscription update callback for PushNotificationService
    pushNotificationService.setSubscriptionUpdateCallback(handleSubscriptionUpdate);
    
    // Cleanup on unmount
    return () => {
      // Clear search timeout if it exists
      if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
      }
      // Optional: unregister device when component is unmounted
      // pushNotificationService.unregisterDevice();
    };
  }, [searchTimeoutId, showPushNotification, showCelebration, handleSubscriptionUpdate, baseUrl, token, navigation, setNotificationNavigationCallback]);

  // Effect to handle data accumulation and pagination state
  React.useEffect(() => {
    if (pagedTaskItems) {
      const currentPage = pagedTaskItems.paging.currentPage;
      const hasNext = pagedTaskItems.paging.hasNext;
      
      if (currentPage === 1) {
        // First page - always replace data to avoid duplicates when task properties change
        setAllTaskItems(pagedTaskItems.data);
        
        // Stop refreshing/filtering when new data arrives on first page
        setIsRefreshing(false);
        setIsFiltering(false);
      } else {
        // Subsequent pages - append data with deduplication
        setAllTaskItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = pagedTaskItems.data.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasNextPage(hasNext);
      setIsLoadingMore(false);
    }
  }, [pagedTaskItems]);

  // Effect to handle loading state changes - stop refreshing when loading is complete
  React.useEffect(() => {
    if (!loadingTaskItems && isRefreshing) {
      setIsRefreshing(false);
    }
  }, [loadingTaskItems, isRefreshing]);

  // Use accumulated task items for display with memoization and deduplication
  const displayTaskItems = React.useMemo(() => {
    // Deduplicate tasks by ID as a safety measure
    const uniqueTasks = allTaskItems.reduce((acc: any[], task: any) => {
      const existing = acc.find((t: any) => t.id === task.id);
      if (!existing) {
        acc.push(task);
      }
      return acc;
    }, [] as any[]);
    return uniqueTasks;
  }, [allTaskItems]);

  // Stable key extractor to maintain item identity
  const keyExtractor = React.useCallback((item: any) => `task_${item.id}`, []);

  const { checkCanAddTaskItem, upgradeModalVisible, hideUpgradeModal  } = useSubscriptionCheck();

  const handleNewTask = async () => {
    const canAdd = await checkCanAddTaskItem({ showUpgradeModal: true });
    if (!canAdd) return;

    shouldRefreshRef.current = true; // Set flag to refresh when we return
    navigation.navigate('TaskEdit', {});
  };

  const handleLoadMore = () => {
    const now = Date.now();
    // Prevent rapid successive calls (within 1 second)
    if (now - lastLoadMoreTimeRef.current < 1000) {
      return;
    }

    // Enhanced guards to prevent unnecessary loading attempts
    if (!hasNextPage || isLoadingMore || loadingTaskItems || !pagedTaskItems || isFiltering) {
      return;
    }

    // Additional check: don't load more if we don't actually have next page from server
    if (!pagedTaskItems.paging.hasNext) {
      return;
    }

    const nextPageRequest = TaskItemPagingUtils.getNextPageRequest(pagedRequest, pagedTaskItems.paging);
    if (nextPageRequest) {
      lastLoadMoreTimeRef.current = now;
      setIsLoadingMore(true);
      setPagedRequest(nextPageRequest);
      refreshTaskItems(nextPageRequest);
    }
  };

  const handleRefresh = React.useCallback((requestOverride?: PagedTaskItemListRequest) => {
    setIsRefreshing(true);
    
    // Clear accumulated data to prevent duplicates
    setAllTaskItems([]);

    const baseRequest = requestOverride || pagedRequest;
    let requestBuilder = new PagedTaskItemListRequestBuilder(baseRequest);
    requestBuilder = requestBuilder
      .setPaging(1, 10); // Reset to page 1
    let request = requestBuilder.build();

    setPagedRequest(request);
    refreshTaskItems(request);
  }, [pagedRequest, refreshTaskItems]); // Add dependencies

  // Add navigation listener to refresh when returning from TaskEdit
  const shouldRefreshRef = React.useRef(false);
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Increment team refresh counter to force team data refresh
      setTeamRefreshCounter(prev => prev + 1);
      
      // Refresh team members list to get latest data
      refreshTeamMembers(teamRequest);
      
      if (shouldRefreshRef.current) {
        handleRefresh();
        shouldRefreshRef.current = false; // Reset the flag
      }
      
      // Refresh notification preferences when screen comes into focus
      // This ensures we have up-to-date preferences if user changed them in settings
      pushNotificationService.refreshNotificationPreferences().catch(error => {
        console.error('Failed to refresh notification preferences on focus:', error);
      });
    });

    return unsubscribe;
  }, [navigation, handleRefresh, refreshTeamMembers, teamRequest]);

  // Initialize gesture tracker
  const gestureTracker = React.useRef(GestureTracker.getInstance());
  
  // Snackbar functions
  const showSuccessMessage = React.useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(false);
    setSnackbarVisible(true);
  }, []);

  const showErrorMessage = React.useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(true);
    setSnackbarVisible(true);
  }, []);

  // Debounced task press handler to prevent conflicts
  const handleTaskPress = React.useMemo(
    () => debounceGesture((taskItem: any) => {
    
      // Record gesture for tracking
      gestureTracker.current.recordGesture();
      
      shouldRefreshRef.current = true; // Set flag to refresh when we return
      navigation.navigate('TaskEdit', { 
        taskItem: taskItem
      });
    }, 200),
    [navigation]
  );
  
  const toggleTaskSelection = React.useCallback((taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    
    if (newSelected.size === 0) {
      setIsMultiSelectMode(false);
    }
  }, [selectedTasks]);

  const handleLongPress = React.useCallback((taskItem: any) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setSelectedTasks(new Set([taskItem.id]));
    } else {
      toggleTaskSelection(taskItem.id);
    }
  }, [isMultiSelectMode, toggleTaskSelection]);

  const handleExitMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedTasks(new Set());
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === displayTaskItems.length) {
      setSelectedTasks(new Set());
      setIsMultiSelectMode(false);
    } else {
      setSelectedTasks(new Set(displayTaskItems.map((item: any) => item.id)));
    }
  };

  const handlePinPress = async (taskItem: any) => {
    const apiClient = createApiClient(baseUrl, token!);
    try {
      const wasPinned = taskItem.isPinned;
      await apiClient.tasks.pin(taskItem.id, !taskItem.isPinned);
      
      showSuccessMessage(`Task "${taskItem.name}" ${wasPinned ? 'unpinned' : 'pinned'} successfully`);
      
      handleRefresh();
    } catch (error) {
      console.error(`Error pinning task ${taskItem.id}:`, error);
      
      showErrorMessage(`Failed to ${taskItem.isPinned ? 'unpin' : 'pin'} task "${taskItem.name}". Please try again.`);
    }
  };

  const handleCompletePress = async (taskItem: any) => {
    const apiClient = createApiClient(baseUrl, token!);
    try {
      const wasCompleted = taskItem.isComplete;
      await apiClient.tasks.setComplete(taskItem.id, !taskItem.isComplete);
      
      showSuccessMessage(`Task "${taskItem.name}" ${wasCompleted ? 'marked incomplete' : 'marked completed'} successfully`);
      
      handleRefresh();
    } catch (error) {
      console.error(`Error completing task ${taskItem.id}:`, error);
      
      showErrorMessage(`Failed to ${taskItem.isComplete ? 'mark as incomplete' : 'complete'} task "${taskItem.name}". Please try again.`);
    }
  };

  const handleActivePress = async (taskItem: any) => {
    const apiClient = createApiClient(baseUrl, token!);
    try {
      const wasActive = taskItem.isActive;
      await apiClient.tasks.setActive(taskItem.id, !taskItem.isActive);
      
      showSuccessMessage(`Task "${taskItem.name}" ${wasActive ? 'deactivated' : 'activated'} successfully`);
      
      handleRefresh();
    } catch (error) {
      console.error(`Error activating task ${taskItem.id}:`, error);
      
      showErrorMessage(`Failed to ${taskItem.isActive ? 'deactivate' : 'activate'} task "${taskItem.name}". Please try again.`);
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedTaskIds = Array.from(selectedTasks);
    
    // Reset multi-select state immediately to prevent further interactions
    setIsMultiSelectMode(false);
    setSelectedTasks(new Set());
    
    try {
      const apiClient = createApiClient(baseUrl, token!);
      let actionMessage = '';
      
      switch (action) {
        case 'delete':
          await apiClient.tasks.deleteList(selectedTaskIds);
          actionMessage = `Successfully deleted ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        case 'pin':
          const selectedTaskItems = displayTaskItems.filter(item => selectedTaskIds.includes(item.id));
          const allSelectedArePinned = selectedTaskItems.every(item => item.isPinned);
          const pinning = !allSelectedArePinned;
          await apiClient.tasks.pinList(pinning, selectedTaskIds);
          actionMessage = `Successfully ${pinning ? 'pinned' : 'unpinned'} ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        case 'copy':
          await apiClient.tasks.copyList(selectedTaskIds);
          actionMessage = `Successfully copied ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        case 'complete':
          const selectedTaskItemsComplete = displayTaskItems.filter(item => selectedTaskIds.includes(item.id));
          const allSelectedAreCompleted = selectedTaskItemsComplete.every(item => item.isComplete);
          const completing = !allSelectedAreCompleted;
          await apiClient.tasks.setCompleteList(completing, selectedTaskIds);
          actionMessage = `Successfully ${completing ? 'completed' : 'marked as incomplete'} ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        case 'activate':
          const selectedTaskItemsActive = displayTaskItems.filter(item => selectedTaskIds.includes(item.id));
          const allSelectedAreActive = selectedTaskItemsActive.every(item => item.isActive);
          const activating = !allSelectedAreActive;
          await apiClient.tasks.setActiveList(activating, selectedTaskIds);
          actionMessage = `Successfully ${activating ? 'activated' : 'deactivated'} ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        case 'archive':
          const selectedTaskItemsArchive = displayTaskItems.filter(item => selectedTaskIds.includes(item.id));
          const allSelectedAreArchived = selectedTaskItemsArchive.every(item => item.isArchived);
          const archiving = !allSelectedAreArchived;
          await apiClient.tasks.archiveList(archiving, selectedTaskIds);
          actionMessage = `Successfully ${archiving ? 'archived' : 'unarchived'} ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`;
          break;
        default:
          console.warn(`Unknown bulk action: ${action}`);
          actionMessage = `Unknown action: ${action}`;
          break;
      }
      
      showSuccessMessage(actionMessage);
      
      handleRefresh();
    } catch (error) {
      console.error(`Error performing bulk action "${action}":`, error);
      
      showErrorMessage(`Failed to ${action} selected tasks. Please try again.`);
    }
  };



  const handleGroupFilterChange = (groupId: number | null) => {
    exitMultiSelectMode();
    setSelectedGroupId(groupId);
    setSelectedKindId(null);
    setSelectedCategoryId(null);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setGroupId(groupId ? groupId : undefined)
      .setKindId(undefined)
      .setCategoryId(undefined)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleKindFilterChange = (kindId: number | null) => {
    exitMultiSelectMode();
    setSelectedKindId(kindId);
    setSelectedCategoryId(null);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setKindId(kindId ? kindId : undefined)
      .setCategoryId(undefined)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleCategoryFilterChange = (categoryId: number | null) => {
    exitMultiSelectMode();
    setSelectedCategoryId(categoryId);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setCategoryId(categoryId ? categoryId : undefined)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleGradeFilterChange = (gradeId: number | null) => {
    exitMultiSelectMode();
    setSelectedGradeId(gradeId);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setGradeId(gradeId ? gradeId : undefined)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleCreditsFilterChange = (credits: number | null) => {
    exitMultiSelectMode();
    setSelectedCredits(credits);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setCredits(credits ? credits : undefined)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const exitMultiSelectMode = () => {
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedTasks(new Set());
    }
  }

  const handleAllowanceNeedReviewFilterChange = (value: TaskItemNeedReviewStatusFilter) => {
    exitMultiSelectMode();
    clearFilters();
    setArchivedFilterStatus(TaskItemArchivedStatusFilter.Unarchived);
    setAllowanceNeedReviewFilterStatus(value);
    setCompletedFilterStatus(TaskItemCompletionStatusFilter.Completed);
    setIsFiltering(true);
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setArchivedFilter(TaskItemArchivedStatusFilter.Unarchived)
          .setCompletionFilter(TaskItemCompletionStatusFilter.Completed)
          .setAllowanceNeedReviewFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleStatsIntervalChange = (intervalIndex: number) => {
    exitMultiSelectMode();
    setSelectedIntervalIndex(intervalIndex);

    if (!allowanceStats || allowanceStats.length === 0 || !allowanceStats[intervalIndex]) return;

    // setSelectedIntervalId(allowanceStats[intervalIndex].teamAllowanceIntervalId);
    startFiltering();
    
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setTeamAllowanceIntervalId(allowanceStats[intervalIndex].teamAllowanceIntervalId)
      .setPaging(1, 10); // Reset to page 1
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleBonusStatusFilterChange = (value: TaskItemBonusStatusFilter) => {
    exitMultiSelectMode();
    setBonusStatusFilter(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);

    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setBonusStatusFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);

    handleRefresh(newRequest);
  };

  const handleCompletedFilterChange = (value: TaskItemCompletionStatusFilter) => {
    exitMultiSelectMode();
    setCompletedFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setCompletionFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleActiveFilterChange = (value: TaskItemActiveStatusFilter) => {
    exitMultiSelectMode();
    setActiveFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setActiveFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handlePriorityFilterChange = (value: TaskItemPriorityFilter) => {
    exitMultiSelectMode();
    setPriorityFilter(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setPriorityFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleDueFilterChange = (value: TaskItemDueStatusFilter) => {
    exitMultiSelectMode();
    setDueFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setDueFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleStartedFilterChange = (value: TaskItemStartedStatusFilter) => {
    exitMultiSelectMode();
    setStartedFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setStartedFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleEndedFilterChange = (value: TaskItemEndedStatusFilter) => {
    exitMultiSelectMode();
    setEndedFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setEndedFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleArchivedFilterChange = (value: TaskItemArchivedStatusFilter) => {
    exitMultiSelectMode();
    setArchivedFilterStatus(value);
    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);
    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setArchivedFilter(value)
          .setPaging(1, 10); // Reset to page 1

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  };

  const handleAllFilterPress = () => {
    clearFiltersAndRefresh();
  }

  const resetFilters = () => {
    exitMultiSelectMode();
    setAllFilterStatus(true);

    // setSelectedIntervalId(0);
    setSelectedTeamMember(null);
    setViewMode(TaskItemAssignmentStatusFilter.Any);
    setArchivedFilterStatus(TaskItemArchivedStatusFilter.Unarchived);
    setActiveFilterStatus(TaskItemActiveStatusFilter.Active);
    setPriorityFilter(TaskItemPriorityFilter.Any);
    setDueFilterStatus(TaskItemDueStatusFilter.Any);
    setStartedFilterStatus(TaskItemStartedStatusFilter.Any);
    setEndedFilterStatus(TaskItemEndedStatusFilter.Any);
    setCompletedFilterStatus(TaskItemCompletionStatusFilter.InProgress);
    setAllowanceNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any);
    setBonusNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any);
    setAllowanceAccreditedStatusFilter(TaskItemAllowanceAccreditedStatusFilter.Any);
    setAllowanceNeedReviewStatusFilter(TaskItemNeedReviewStatusFilter.Any);
    setBonusStatusFilter(TaskItemBonusStatusFilter.Any);
    setSelectedIntervalIndex(0);
    setSelectedGroupId(null);
    setSelectedKindId(null);
    setSelectedCategoryId(null);
    setSelectedGradeId(null);
    setSelectedCredits(null);
    setSearchQuery('');

    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    startFiltering();

    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setTeamAllowanceIntervalId(allTasksIntervalId) 
          .setAssignmentFilter(TaskItemAssignmentStatusFilter.Any)
          .setTeamMemberFilter(undefined)
          .setArchivedFilter(TaskItemArchivedStatusFilter.Unarchived)
          .setPriorityFilter(TaskItemPriorityFilter.Any)
          .setActiveFilter(TaskItemActiveStatusFilter.Active)
          .setCompletionFilter(TaskItemCompletionStatusFilter.InProgress)
          .setDueFilter(TaskItemDueStatusFilter.Any)
          .setAllowanceNeedReviewFilter(TaskItemNeedReviewStatusFilter.Any)
          .setAllowanceAccreditedFilter(TaskItemAllowanceAccreditedStatusFilter.Any)
          .setBonusStatusFilter(TaskItemBonusStatusFilter.Any)
          .setGroupId(undefined)
          .setKindId(undefined)
          .setCategoryId(undefined)
          .setGradeId(undefined)
          .setCredits(undefined)
          .setSearchTerm(undefined);

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);
  }

  const clearFiltersAndRefresh = () => {
    let newRequest = clearFilters();
    handleRefresh(newRequest);
  }

  const clearFilters= () => {
    exitMultiSelectMode();
    setAllFilterStatus(true);

    // setSelectedIntervalId(0);
    setSelectedTeamMember(null);
    setViewMode(TaskItemAssignmentStatusFilter.Any);
    setActiveFilterStatus(TaskItemActiveStatusFilter.Any);
    setPriorityFilter(TaskItemPriorityFilter.Any);
    setDueFilterStatus(TaskItemDueStatusFilter.Any);
    setStartedFilterStatus(TaskItemStartedStatusFilter.Any);
    setEndedFilterStatus(TaskItemEndedStatusFilter.Any);
    setArchivedFilterStatus(TaskItemArchivedStatusFilter.Any);
    setCompletedFilterStatus(TaskItemCompletionStatusFilter.Any);
    setAllowanceNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any);
    setBonusNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any);
    setAllowanceAccreditedStatusFilter(TaskItemAllowanceAccreditedStatusFilter.Any);
    setAllowanceNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any);
    setBonusStatusFilter(TaskItemBonusStatusFilter.Any);
    setSelectedIntervalIndex(0);
    setSelectedGroupId(null);
    setSelectedKindId(null);
    setSelectedCategoryId(null);
    setSelectedGradeId(null);
    setSelectedCredits(null);
    setSearchQuery('');

    // Clear stats immediately to prevent showing stale data
    setCurrentStats(undefined);
    setCurrentAllowanceStats(undefined);
    setCurrentBonusStats(undefined);
    setIsFiltering(true);

    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
        requestBuilder = requestBuilder
          .setTeamAllowanceIntervalId(allTasksIntervalId) 
          .setAssignmentFilter(TaskItemAssignmentStatusFilter.Any)
          .setTeamMemberFilter(undefined)
          .setArchivedFilter(TaskItemArchivedStatusFilter.Any)
          .setActiveFilter(TaskItemActiveStatusFilter.Any)
          .setPriorityFilter(TaskItemPriorityFilter.Any)
          .setStartedFilter(TaskItemStartedStatusFilter.Any)
          .setEndedFilter(TaskItemEndedStatusFilter.Any)
          .setCompletionFilter(TaskItemCompletionStatusFilter.Any)
          .setDueFilter(TaskItemDueStatusFilter.Any)
          // .setBonusNeedReviewFilterStatus(TaskItemNeedReviewStatusFilter.Any) // TODO: doesn't exits in pkg?? - add.
          .setAllowanceNeedReviewFilter(TaskItemNeedReviewStatusFilter.Any)
          .setAllowanceAccreditedFilter(TaskItemAllowanceAccreditedStatusFilter.Any)
          .setBonusStatusFilter(TaskItemBonusStatusFilter.Any)
          .setGroupId(undefined)
          .setKindId(undefined)
          .setCategoryId(undefined)
          .setGradeId(undefined)
          .setCredits(undefined)
          .setSearchTerm(undefined);

    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    // not refreshing here. call clearFiltersAndRefresh() if refreshing too is needed
    return newRequest;
  }

  const handleViewModeChange = (mode: TaskItemAssignmentStatusFilter) => {
    setIsFiltering(true);
    clearFilters();
    setViewMode(mode);
    setArchivedFilterStatus(TaskItemArchivedStatusFilter.Unarchived);

    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest)
      .setAssignmentFilter(mode);

    if (mode === TaskItemAssignmentStatusFilter.Team && selectedTeamMember) {
      requestBuilder = requestBuilder.setTeamMemberFilter(selectedTeamMember);
    }

    const newRequest = requestBuilder
            .setArchivedFilter(TaskItemArchivedStatusFilter.Unarchived)
            .setPaging(1, 10) // Reset to page 1
            .build();

    setPagedRequest(newRequest);
    handleRefresh(newRequest);

    // Exit multi-select mode when view mode changes
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedTasks(new Set());
    }
  };

  const handleTeamMemberChange = (memberId: number | null) => {
    setSelectedTeamMember(memberId);
    setIsFiltering(true);

    let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
    requestBuilder = requestBuilder.setTeamMemberFilter(memberId ? memberId : undefined);
    const newRequest = requestBuilder.build();
    setPagedRequest(newRequest);
    handleRefresh(newRequest);

    // Exit multi-select mode when team member changes
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedTasks(new Set());
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // Clear the previous timeout if it exists
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }
    
    // Set a new timeout to debounce the search
    const timeoutId = setTimeout(() => {
      startFiltering();

      let requestBuilder = new PagedTaskItemListRequestBuilder(pagedRequest);
      requestBuilder = requestBuilder.setSearchTerm(query.trim() || undefined)
        .setPaging(1, 10); // Reset to page 1
      const newRequest = requestBuilder.build();
      setPagedRequest(newRequest);

      handleRefresh(newRequest);

      // Exit multi-select mode when search changes
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedTasks(new Set());
      }
    }, 300); // 300ms delay
    
    setSearchTimeoutId(timeoutId);
  };

  return (
    <View style={localStyles.fullContainer}>
      <DashboardTopBar 
        isMultiSelectMode={isMultiSelectMode}
        onExitMultiSelect={handleExitMultiSelect}
        onSelectAll={handleSelectAll}
        stats={stats}
        loading={loadingTaskItems && displayTaskItems.length === 0 && !isRefreshing}
        onCompletedFilterChange={handleCompletedFilterChange}
        onActiveFilterChange={handleActiveFilterChange}
        onPriorityFilterChange={handlePriorityFilterChange}
        onDueFilterChange={handleDueFilterChange}
        onStartedFilterChange={handleStartedFilterChange}
        onEndedFilterChange={handleEndedFilterChange}
        onArchivedFilterChange={handleArchivedFilterChange}
        onAllFilterPress={handleAllFilterPress}
        allFilterStatus={allFilterStatus}
        completedFilterStatus={completedFilterStatus}
        activeFilterStatus={activeFilterStatus}
        priorityFilter={priorityFilter}
        dueFilterStatus={dueFilterStatus}
        startedFilterStatus={startedFilterStatus}
        endedFilterStatus={endedFilterStatus}
        archivedFilterStatus={archivedFilterStatus}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        selectedTeamMember={selectedTeamMember}
        onTeamMemberChange={handleTeamMemberChange}
        selectedGroupId={selectedGroupId}
        selectedKindId={selectedKindId}
        selectedCategoryId={selectedCategoryId}
        selectedGradeId={selectedGradeId}
        selectedCredits={selectedCredits}
        onGroupFilterChange={handleGroupFilterChange}
        onKindFilterChange={handleKindFilterChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onGradeFilterChange={handleGradeFilterChange}
        onCreditsFilterChange={handleCreditsFilterChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        shouldExpand={shouldExpandDashboard}
      />
      <SafeAreaView style={localStyles.container} edges={[]}>
        <View style={localStyles.content}>
          <View style={localStyles.taskListContainer}>
            {loadingTaskItems && displayTaskItems.length === 0 && !isRefreshing ? (
              <View 
                style={localStyles.loadingContainer}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Loading tasks"
              >
                <ActivityIndicator 
                  size="large" 
                  color={colors.secondary}
                  accessible={false}
                />
                <Text 
                  variant='bodyMedium' 
                  style={[styles.primarySubtitle, localStyles.loadingText]}
                  accessible={false}
                >
                  Loading tasks...
                </Text>
              </View>
            ) : displayTaskItems.length === 0 ? (
              <View 
                style={localStyles.emptyState}
                accessible={false}
              >
                {searchQuery.trim() ? (
                  <Text variant='titleMedium' style={styles.primarySubtitle}>
                    No tasks found matching "{searchQuery}"
                  </Text>
                ) : (!isRefreshing && (selectedGroupId || selectedKindId || selectedCategoryId || 
                       selectedGradeId || selectedCredits ||
                       selectedTeamMember || viewMode !== TaskItemAssignmentStatusFilter.Any ||
                       activeFilterStatus !== TaskItemActiveStatusFilter.Any ||
                       priorityFilter !== TaskItemPriorityFilter.Any ||
                       dueFilterStatus !== TaskItemDueStatusFilter.Any ||
                       startedFilterStatus !== TaskItemStartedStatusFilter.Any ||
                       endedFilterStatus !== TaskItemEndedStatusFilter.Any ||
                       completedFilterStatus !== TaskItemCompletionStatusFilter.Any ||
                       allowanceNeedReviewFilterStatus !== TaskItemNeedReviewStatusFilter.Any ||
                       bonusNeedReviewFilterStatus !== TaskItemNeedReviewStatusFilter.Any ||
                       archivedFilterStatus !== TaskItemArchivedStatusFilter.Unarchived ||
                       bonusStatusFilter !== TaskItemBonusStatusFilter.Any ||
                       allowanceNeedReviewStatusFilter !== TaskItemNeedReviewStatusFilter.Any ||
                       allowanceAccreditedStatusFilter !== TaskItemAllowanceAccreditedStatusFilter.Any)) ? (
                  <View style={localStyles.emptyStateWithAction}>
                    <Text variant='titleMedium' style={[styles.primarySubtitle, localStyles.emptyStateText]} numberOfLines={0}>
                      No tasks found matching the current filters.
                    </Text>
                    <TouchableOpacity 
                      style={localStyles.clearFiltersButton}
                      onPress={() => clearFiltersAndRefresh()}
                    >
                      <Icon source="filter-remove" size={20} color={colors.primary} />
                      <Text variant='labelLarge' style={localStyles.clearFiltersText}>
                        Clear Filters
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text variant='titleMedium' style={styles.primarySubtitle}>
                    {!isRefreshing && allFilterStatus === true && !isRefreshing
                      ? 'Add some tasks to get started!' 
                      : !isRefreshing 
                         ? 'No tasks found.' 
                         : 'Loading...'
                    }
                  </Text>
                )}
              </View>
            ) : (
              <View style={localStyles.taskListWrapper}>
                <FlatList
                  // @ts-ignore - key is valid in React but not in TS type definitions
                  key={`flatlist-${flatListKey}-${modalInteractionCount}`}
                  data={displayTaskItems}
                  keyExtractor={keyExtractor}
                  extraData={`${isMultiSelectMode}-${selectedTasks.size}-${isLandscape}-${modalInteractionCount}-${teamIds}-${teamRefreshCounter}`}
                  accessible={true}
                  accessibilityRole="list"
                  accessibilityLabel={`Task list with ${displayTaskItems.length} tasks`}
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  removeClippedSubviews={false}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  initialNumToRender={10}
                  windowSize={10}
                  scrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    // Compute bonus status once for this item
                    const bonusStatus = getBonusStatus(item);
                    const bonusChipColors = getBonusChipColors(bonusStatus);
                    
                    // Compute allowance approval status for this item
                    const allowanceStatus = getAllowanceApprovalStatus(item, user);
                    const allowanceChipColors = getAllowanceApprovalChipColors(allowanceStatus);
                    const systemAdminUserId = 1; 
                    const createdByUser = item.createdBy && team.find(member => member.id === item.createdBy);
                    const showAllowanceStatus = !item.isPrivate 
                        && (item.createdBy === systemAdminUserId || (createdByUser && createdByUser.isAdmin === false)) 
                        && (item.teamAllowanceIntervalId !== null || (item.assignedTo !== null && item.assignedTo !== item.createdBy));
                    return (
                  <TouchableOpacity 
                    style={[
                      localStyles.taskItem,
                      selectedTasks.has(item.id) && localStyles.selectedTask,
                      isLandscape && localStyles.taskItemLandscape,
                      selectedTasks.has(item.id) && isLandscape && localStyles.selectedTaskLandscape
                    ]}
                    onPress={() => isMultiSelectMode ? toggleTaskSelection(item.id) : handleTaskPress(item)}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={500}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole={isMultiSelectMode ? "checkbox" : "button"}
                    accessibilityLabel={`Task: ${item.name}${isMultiSelectMode ? (selectedTasks.has(item.id) ? ', selected' : ', not selected') : ''}`}
                    accessibilityHint={isMultiSelectMode ? "Double tap to toggle selection" : "Double tap to view details"}
                    accessibilityState={{ selected: selectedTasks.has(item.id), checked: isMultiSelectMode ? selectedTasks.has(item.id) : undefined }}
                  >
                    {isMultiSelectMode && (
                      <View 
                        style={localStyles.checkbox}
                        accessible={false}
                      >
                        <Icon 
                          source={selectedTasks.has(item.id) ? "checkbox-marked" : "checkbox-blank-outline"} 
                          size={24}
                        />
                      </View>
                    )}
                    <View 
                      style={isMultiSelectMode ? localStyles.taskContentWithPadding : undefined}
                      accessible={false}
                    >
                      <View 
                        style={localStyles.taskHeader}
                        accessible={false}
                      >
                        <View 
                          style={localStyles.taskTitle}
                          accessible={false}
                        >
                          <Text 
                            variant='titleMedium' 
                            style={localStyles.taskTitleText} 
                            numberOfLines={1} 
                            ellipsizeMode="tail"
                            accessible={false}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <View 
                          style={localStyles.taskActions}
                          accessible={false}
                        >
                          {item.percentComplete === 100 && 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handleCompletePress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Mark as incomplete"
                              accessibilityHint="Double tap to mark this task as incomplete"
                            >
                              <Icon 
                                source="check" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }
                          {item.percentComplete !== 100 && 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handleCompletePress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Mark as complete"
                              accessibilityHint="Double tap to mark this task as complete"
                            >
                              <Icon 
                                source="check-outline" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }

                          {item.isPinned && 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handlePinPress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Unpin task"
                              accessibilityHint="Double tap to unpin this task"
                            >
                              <Icon 
                                source="pin" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }
                          {!item.isPinned && 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handlePinPress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Pin task"
                              accessibilityHint="Double tap to pin this task"
                            >
                              <Icon 
                                source="pin-outline" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }
                          {item.isActive&& 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handleActivePress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Deactivate task"
                              accessibilityHint="Double tap to deactivate this task"
                            >
                              <Icon 
                                source="play" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }
                          {!item.isActive && 
                            <TouchableOpacity 
                              style={localStyles.actionButton} 
                              onPress={() => handleActivePress(item)}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel="Activate task"
                              accessibilityHint="Double tap to activate this task"
                            >
                              <Icon 
                                source="play-outline" 
                                size={18}
                              />
                            </TouchableOpacity>
                          }
                        </View>
                      </View>
                      
                      {(item.description || item.assignedTo || item.group || item.dueAt || item.startAt || item.endAt) && (
                        <View style={localStyles.metadataContainer}>
                          {(item.description || item.assignedTo) && (
                            <View style={localStyles.descriptionRow}>
                              {item.description && (
                                <Text variant='bodySmall' style={localStyles.descriptionText} numberOfLines={1} ellipsizeMode="tail">
                                  {item.description}
                                </Text>
                              )}
                              {!item.description && item.assignedTo && (
                                <View style={localStyles.descriptionText} />
                              )}
                              {item.assignedTo && (viewMode === TaskItemAssignmentStatusFilter.Any || viewMode === TaskItemAssignmentStatusFilter.Team) && (
                                team.find(member => member.id === item.assignedTo) ? (
                                  <Text variant='bodySmall' style={localStyles.assignedToText}>
                                    {team.find(member => member.id === item.assignedTo)!.firstName} {team.find(member => member.id === item.assignedTo)!.lastName}
                                  </Text>
                                ) : item.assignedTo === DELETED_USER_ID 
                                    ? <Text variant='bodySmall' style={localStyles.assignedToText}>Deleted User</Text> : item.assignedTo === SYSTEM_USER_ID
                                    ? <Text variant='bodySmall' style={localStyles.assignedToText}>System User</Text> : null
                              )}
                            </View>
                          )}

                          {allowanceStatus !== 'not-applicable' && showAllowanceStatus && (
                            <View style={localStyles.allowanceRow}>
                              <View style={localStyles.allowanceContainer}>
                                <Chip
                                  mode="flat"
                                  style={[
                                    localStyles.allowanceChipInline, 
                                    { 
                                      backgroundColor: allowanceChipColors.backgroundColor, 
                                      borderColor: allowanceChipColors.borderColor
                                    }
                                  ]}
                                  textStyle={[
                                    localStyles.allowanceChipText, 
                                    { color: allowanceChipColors.textColor }
                                  ]}
                                  compact
                                >
                                  💲 { isBusiness ? 'Incentive' : 'Allowance' }
                                  {allowanceStatus === 'approved' && ' Approved ✅'}
                                  {allowanceStatus === 'rejected' && ' Rejected ❌'}
                                  {allowanceStatus === 'pending' && ' Approval Pending ⏳'}
                                </Chip>
                              </View>
                            </View>
                          )}

                          {item.isPrivate && (
                            <View style={localStyles.privateIndicator}>
                              <Icon source="lock" size={16} color={colors.primary} />
                              <Text variant='bodySmall' style={localStyles.privateText}>
                                Private
                              </Text>
                            </View>
                          )}

                          
                          {(item.group || item.dueAt) && (
                            <View style={localStyles.categoryRow}>
                              {item.group && (
                                <Text variant='bodySmall' style={[localStyles.sectionTitle, localStyles.categoryText]} numberOfLines={1} ellipsizeMode="tail">
                                  {item.group.name + (item.kind?.name ? ` / ${item.kind.name}` : '') + (item.category?.name ? ` / ${item.category.name}` : '')}
                                </Text>
                              )}
                              {item.dueAt && getDueDateStatus(item.dueAt) && (
                                <View style={localStyles.dateContainer}>
                                  <Text variant='bodySmall' style={[localStyles.dateLabel, { color: getDueDateStatus(item.dueAt)!.color }]}>
                                    {getDueDateStatus(item.dueAt)!.label}:{' '}
                                  </Text>
                                  <Text variant='bodySmall' style={localStyles.dateValue}>
                                    {formatDateForDisplay(item.dueAt)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                          
                          {(item.startAt || item.endAt) && (
                            <View style={localStyles.dateRow}>
                              {item.startAt && (
                                <View style={localStyles.dateContainer}>
                                  <Text variant='bodySmall' style={[localStyles.dateLabel]}>
                                    Start:{' '}
                                  </Text>
                                  <Text variant='bodySmall' style={localStyles.dateValue}>
                                    {formatDateForDisplay(item.startAt)}
                                  </Text>
                                </View>
                              )}
                              {item.endAt && (
                                <View style={localStyles.dateContainer}>
                                  <Text variant='bodySmall' style={[localStyles.dateLabel]}>
                                    End:{' '}
                                  </Text>
                                  <Text variant='bodySmall' style={localStyles.dateValue}>
                                    {formatDateForDisplay(item.endAt)}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}

                          {(item.priority !== TaskItemPriority.None || item.approvedBonus?.trim() || item.maxBonus?.trim()) && (
                            <View style={localStyles.priorityBonusRow}>
                              {item.priority !== TaskItemPriority.None && (
                                <View style={localStyles.priorityContainer}>
                                  <Text variant='bodySmall' style={[localStyles.dateLabel]}>
                                    Priority:{' '}
                                  </Text>
                                  <Text variant='bodySmall' style={[localStyles.priorityValue, { color: getPriorityColor(item.priority) }]}>
                                    {getPriorityLabel(item.priority)}
                                  </Text>
                                </View>
                              )}
                              <View style={localStyles.chipRowContainer}>
                                {((item.approvedBonus !== null && item.approvedBonus !== undefined && item.approvedBonus.trim() !== "") || (item.maxBonus !== null && item.maxBonus !== undefined && item.maxBonus.trim() !== "")) && (
                                  <View style={localStyles.bonusInlineContainer}>
                                    <Chip
                                      mode="flat"
                                      style={[
                                        localStyles.bonusChipInline, 
                                        { 
                                          backgroundColor: bonusChipColors.backgroundColor, 
                                          borderColor: bonusChipColors.borderColor
                                        }
                                      ]}
                                      textStyle={[
                                        localStyles.bonusChipText, 
                                        { color: bonusChipColors.textColor }
                                      ]}
                                      compact
                                      accessibilityLabel={`Bonus ${truncateBonusText(item.approvedBonus?.trim() || item.maxBonus?.trim() || '')}${bonusStatus === 'approved' ? ', approved' : ''}${bonusStatus === 'rejected' ? ', rejected' : ''}${bonusStatus === 'pending' ? ', pending approval' : ''}`}
                                    >
                                      💎 {truncateBonusText(item.approvedBonus?.trim() || item.maxBonus?.trim() || '')}
                                      {bonusStatus === 'approved' && <Text accessibilityLabel=""> ✅</Text>}
                                      {bonusStatus === 'rejected' && <Text accessibilityLabel=""> ❌</Text>}
                                      {bonusStatus === 'pending' && <Text accessibilityLabel=""> ⏳</Text>}
                                    </Chip>
                                  </View>
                                )}
                              </View>
                            </View>
                          )}

                          {item.teamAllowanceIntervalName && item.teamAllowanceIntervalName.trim() !== '' && (
                            <View style={localStyles.intervalRow}>
                              <Text variant='bodySmall' style={[localStyles.dateLabel]}>
                                { isBusiness ? 'Incentive' : 'Allowance' } Interval:
                              </Text>
                              <Text variant='bodySmall' style={localStyles.dateValue}>
                                {item.teamAllowanceIntervalName}
                              </Text>
                            </View>
                          )}

                        </View>
                      )}
                      <View style={[
                        localStyles.taskFooter,
                        !(item.description || item.assignedTo || item.group || item.dueAt || item.startAt || item.endAt || (item.teamAllowanceIntervalName && item.teamAllowanceIntervalName.trim() !== '')) && localStyles.taskFooterNoMetadata
                      ]}>
                        <View style={localStyles.progressContainer}>
                          <View style={localStyles.progressHeaderRow}>
                            {(item.credits || item.grade?.letterGrade) ? (
                              <View style={localStyles.pointsContainer}>
                                {item.credits !== null && item.credits !== undefined && (
                                  <View style={[
                                    localStyles.creditsContainer, 
                                    { 
                                      borderColor: getCreditsColor(item.credits),
                                      backgroundColor: getCreditsColor(item.credits) + '20'
                                    }
                                  ]}>
                                    <Text variant='bodySmall' style={[
                                      localStyles.creditsText,
                                      { color: getCreditsColor(item.credits) }
                                    ]}>
                                      💳 {item.credits}
                                    </Text>
                                  </View>
                                )}
                                {item.grade?.letterGrade && (
                                  <View style={[
                                    localStyles.gradeContainer,
                                    { backgroundColor: getGradeColor(item.grade.letterGrade) }
                                  ]}>
                                    <Text variant='bodySmall' style={localStyles.gradeText}>
                                      {item.grade.letterGrade}
                                    </Text>
                                  </View>
                                )}

                              </View>
                            ) : (
                              <View style={localStyles.pointsContainer} />
                            )}
                            
                            {/* Comments and Details indicators */}
                            <View style={localStyles.commentsDetailsRow}>
                              <TaskCommentIndicator 
                                commentCount={getCommentCount(item.id)} 
                                size="small"
                              />
                              {item.details && item.details.trim() !== '' && (
                                <View style={localStyles.detailsIndicator}>
                                  <Icon source="text-box" size={16} color={colors.primary} />
                                  <Text variant='bodySmall' style={localStyles.detailsText}>
                                    Details
                                  </Text>
                                </View>
                              )}
                            </View>
                            
                            <Text variant='bodySmall' style={[
                              localStyles.percentDoneText,
                              !(item.credits || item.grade?.letterGrade) && { marginBottom: 4 as number }
                            ]}>{item.percentComplete || 0}% Done
                            </Text>
                          </View>
                          <View style={localStyles.progressBar}>
                            <View style={[localStyles.progressFill, { width: `${item.percentComplete || 0}%` }]} />
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={localStyles.taskListContent}
                  onEndReached={hasNextPage && pagedTaskItems?.paging?.hasNext ? (() => {
                  // Only call handleLoadMore if conditions are right
                  if (!isLoadingMore && !loadingTaskItems && !isFiltering && displayTaskItems.length > 0) {
                    handleLoadMore();
                  }
                }) : undefined}
                onEndReachedThreshold={0.1}
                ListFooterComponent={
                  (isLoadingMore && hasNextPage && !isFiltering) ? (
                    <View style={localStyles.loadingMore}>
                      <Text variant='bodyMedium'>Loading more tasks...</Text>
                    </View>
                  ) : null
                }
              />
              {isFiltering && (
                <View style={localStyles.filteringOverlay}>
                  <View style={localStyles.filteringIndicator}>
                    <ActivityIndicator size="small" color={colors.textOnPrimary} style={localStyles.filteringSpinner} />
                    <Text variant='bodySmall' style={localStyles.filteringText}>
                      Filtering...
                    </Text>
                  </View>
                </View>
              )}
              </View>
            )}
          </View>
        </View>
        <SafeAreaView edges={['left', 'right', 'bottom']} style={localStyles.bottomSafeArea}>
          <DashboardBottomBar 
            isMultiSelectMode={isMultiSelectMode}
            selectedTasksCount={selectedTasks.size}
            selectedTasks={displayTaskItems.filter(item => selectedTasks.has(item.id))}
            onBulkAction={handleBulkAction}
            isStatsBarVisible={!isMultiSelectMode}
          />
          {!isMultiSelectMode && (
            <DashboardBottomStatsBar 
              user={user || undefined}
              allowanceStats={allowanceStats}
              bonusStats={bonusStats}
              allowanceIntervalIndex={selectedIntervalIndex}
              onIntervalChange={handleStatsIntervalChange}
              onNeedReviewFilterStatusChange={handleAllowanceNeedReviewFilterChange}
              needReviewFilterStatus={allowanceNeedReviewFilterStatus}
              onBonusStatusFilterChange={handleBonusStatusFilterChange}
              bonusStatusFilter={bonusStatusFilter}
              showAllowanceModal={showAllowanceModal}
              onAllowanceModalShown={handleAllowanceModalShown}
              onAllowanceModalClosed={handleAllowanceModalClosed}
              highlightAllowanceId={highlightAllowanceId}
              shouldShowBonusModal={shouldShowBonusModal}
            />
          )}
        </SafeAreaView>

        {/* FAB Group - only show when not in multi-select mode */}
        {!isMultiSelectMode && (
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-vertical'}
              accessibilityLabel={fabOpen ? "Close action menu" : "Open action menu"}
              actions={[
                {
                  icon: 'plus',
                  label: 'New Task',
                  onPress: () => {
                    handleNewTask();
                    setFabOpen(false);
                  },
                  style: { 
                    backgroundColor: colors.accent, 
                    width: 48, 
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  labelStyle: { textAlign: 'right' },
                  color: 'white'
                },
                {
                  icon: 'refresh',
                  label: 'Reset Filters',
                  onPress: () => {
                    resetFilters();
                    setFabOpen(false);
                  },
                  style: { 
                    backgroundColor: colors.secondary, 
                    width: 48, 
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  labelStyle: { textAlign: 'right' },
                  color: 'white'
                },
                {
                  icon: 'filter-remove',
                  label: 'Clear Filters',
                  onPress: () => {
                    clearFiltersAndRefresh();
                    setFabOpen(false);
                  },
                  style: { 
                    backgroundColor: colors.primary, 
                    width: 48, 
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  labelStyle: { textAlign: 'right' },
                  color: 'white'
                },
              ]}
              onStateChange={({ open }) => setFabOpen(open)}
              style={{ paddingBottom: bottom + 70 + 90, paddingRight: right + 4 }}
              fabStyle={{ backgroundColor: colors.accent }}
              color="white"
            />
        )}

        {/* Success/Error Snackbar */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
          style={[
            localStyles.snackbar,
            snackbarError ? { backgroundColor: colors.error } : { backgroundColor: colors.success }
          ]}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
            labelStyle: { color: 'white' }
          }}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`${snackbarError ? 'Error' : 'Success'}: ${snackbarMessage}`}
        >
          <Text 
            style={localStyles.snackbarText}
            accessible={false}
          >
            {snackbarMessage}
          </Text>
        </Snackbar>
      </SafeAreaView>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={hideUpgradeModal}
        message="Upgrade to Pro to unlock this feature"
      /> 
    </View>
  );
}

function MainAppScreen({ navigation, route }: MainAppScreenProps) {
  return (
    <View style={localStyles.screenContainer}>
      <TaskItemsDisplay navigation={navigation} route={route} />
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
    // padding: 16,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  contentContainer: {
    flex: 1,
  },
  taskListContainer: {
    flex: 1,
    marginBottom: 16,
  },
  taskListContent: {
    paddingBottom: 140, // Increased to clear FAB and bottom bars
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateWithAction: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
    width: '100%',
    maxWidth: '90%',
    lineHeight: 24,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  clearFiltersText: {
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyStateContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  taskItem: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: colors.border,
    elevation: 2,
    backgroundColor: colors.backgroundPaper,
    width: '100%',
    marginBottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskItemLandscape: {
    paddingRight: 60, // Extra right padding in landscape to keep content visible
  },
  selectedTask: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    elevation: 4,
  },
  selectedTaskLandscape: {
    paddingRight: 60, // Extra right padding in landscape for selected tasks too
  },
  checkbox: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    // marginTop: 12,
    color: colors.secondaryDark,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  taskTitle: {
    flex: 1,
    marginRight: 8,
  },
  taskTitleText: {
    color: colors.textPrimary,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    // borderRadius: 4,
    color: colors.textSecondary,
    minWidth: 20,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskFooter: {
    marginTop: 2,
  },
  taskFooterNoMetadata: {
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'column',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.backgroundDefault,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    overflow: 'hidden',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  taskContentWithPadding: {
    paddingLeft: 40,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusChip: {
    borderWidth: 1,
    borderRadius: 18,
  },
  gradeContainer: {
    width: 48,
    height: 38,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  creditsContainer: {
    width: 48,
    height: 38,
    // paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsText: {
    color: colors.secondary,
    fontWeight: '500',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  percentDoneText: {
    marginLeft: 8,
    marginBottom: -8,
    fontWeight: '700',
  },
  descriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  assignedToText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondaryDark,
    flexShrink: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  categoryText: {
    flex: 1,
    marginRight: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  dateLabel: {
    color: colors.secondaryDark,
    fontSize: 10,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metadataContainer: {
    marginTop: 2,
  },
  taskListWrapper: {
    flex: 1,
    position: 'relative',
    paddingBottom: 16,
  },
  filteringOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    margin: 16,
  },
  filteringIndicator: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filteringSpinner: {
    marginRight: 6,
  },
  filteringText: {
    color: colors.textOnPrimary,
    fontWeight: '500',
    fontSize: 12,
  },
  snackbar: {
    position: 'absolute',
    bottom: 50, // Position above the very compact stats bar (~42px + 8px margin)
    left: 0,
    right: 0,
    margin: 16,
    borderRadius: 8,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  snackbarText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  priorityBonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 2,
    gap: 8,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginTop: 2,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  bonusInlineContainer: {
    flexShrink: 0,
    maxWidth: 150,
  },
  bonusChipInline: {
    borderWidth: 1,
    borderRadius: 18,
    maxWidth: 150,
  },
  bonusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  allowanceInlineContainer: {
    flexShrink: 0,
    maxWidth: 120,
  },
  allowanceChipInline: {
    borderWidth: 1,
    borderRadius: 18,
    maxWidth: 320,
  },
  allowanceChipText: {
    fontSize: 9,
    fontWeight: '600',
  },
  chipRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allowanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
  },
  allowanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  privateText: {
    color: colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  commentsDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 12,
  },
  detailsIndicator: {
    paddingLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsIcon: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  detailsText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomSafeArea: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    marginTop: 0,
  },
});

export default MainAppScreen;