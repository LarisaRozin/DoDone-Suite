/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Animated, Dimensions, ScrollView, Platform } from 'react-native';
import { IconButton, Searchbar } from 'react-native-paper';
import { Appbar } from './StyledText';
import { Text } from './StyledText';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../defaultTheme';
import { TaskItemAssignmentStatusFilter, TaskItemStats, User, useTeam, PagedListRequestBuilder, SortDirection, TaskItemCompletionStatusFilter, TaskItemActiveStatusFilter, TaskItemDueStatusFilter, TaskItemArchivedStatusFilter, useAuth, TaskItemPriorityFilter, useTaskGroups, useGrades, TaskItemStartedStatusFilter, TaskItemEndedStatusFilter, UNLIMITED, SubscriptionTier } from '@larisarozin/dodone-shared';
import UserAvatar from './UserAvatar';
import DropdownComponent from './Dropdown';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { UpgradeModal } from '../components/UpgradeModal';
import { useSubscription } from '../contexts/SubscriptionContext';

interface DashboardTopBarProps {
  isMultiSelectMode?: boolean;
  onExitMultiSelect?: () => void;
  onSelectAll?: () => void;
  stats?: TaskItemStats;
  loading?: boolean;
  onCompletedFilterChange: (value: TaskItemCompletionStatusFilter) => void;
  onActiveFilterChange: (value: TaskItemActiveStatusFilter) => void;
  onPriorityFilterChange: (value: TaskItemPriorityFilter) => void;
  onDueFilterChange: (value: TaskItemDueStatusFilter) => void;
  onStartedFilterChange?: (value: TaskItemStartedStatusFilter) => void;
  onEndedFilterChange?: (value: TaskItemEndedStatusFilter) => void;
  onArchivedFilterChange: (value: TaskItemArchivedStatusFilter) => void;
  onAllFilterPress: () => void;
  allFilterStatus: boolean
  completedFilterStatus: TaskItemCompletionStatusFilter;
  activeFilterStatus: TaskItemActiveStatusFilter;
  priorityFilter: TaskItemPriorityFilter;
  dueFilterStatus: TaskItemDueStatusFilter;
  startedFilterStatus: TaskItemStartedStatusFilter;
  endedFilterStatus: TaskItemEndedStatusFilter;
  archivedFilterStatus: TaskItemArchivedStatusFilter;
  viewMode?: TaskItemAssignmentStatusFilter;
  onViewModeChange?: (mode: TaskItemAssignmentStatusFilter) => void;
  selectedTeamMember?: number | null;
  onTeamMemberChange?: (memberId: number | null) => void;
  selectedGroupId?: number | null;
  selectedKindId?: number | null;
  selectedCategoryId?: number | null;
  selectedGradeId?: number | null;
  selectedCredits?: number | null;
  onGroupFilterChange?: (groupId: number | null) => void;
  onKindFilterChange?: (kindId: number | null) => void;
  onCategoryFilterChange?: (categoryId: number | null) => void;
  onGradeFilterChange?: (gradeId: number | null) => void;
  onCreditsFilterChange?: (credits: number | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  shouldExpand?: boolean;
}

const DashboardTopBar = ({ 
  isMultiSelectMode = false, 
  onExitMultiSelect,
  onSelectAll,
  stats,
  loading = false,
  onAllFilterPress,
  onCompletedFilterChange,
  onActiveFilterChange,
  onPriorityFilterChange,
  onDueFilterChange,
  onStartedFilterChange,
  onEndedFilterChange,
  onArchivedFilterChange,
  completedFilterStatus = TaskItemCompletionStatusFilter.Any,
  activeFilterStatus = TaskItemActiveStatusFilter.Any,
  priorityFilter = TaskItemPriorityFilter.Any,
  dueFilterStatus = TaskItemDueStatusFilter.Any,
  startedFilterStatus = TaskItemStartedStatusFilter.Any,
  endedFilterStatus = TaskItemEndedStatusFilter.Any,
  archivedFilterStatus = TaskItemArchivedStatusFilter.Any,
  viewMode = TaskItemAssignmentStatusFilter.Any,
  onViewModeChange,
  selectedTeamMember = null,
  onTeamMemberChange,
  selectedGroupId = null,
  selectedKindId = null,
  selectedCategoryId = null,
  selectedGradeId = null,
  selectedCredits = null,
  onGroupFilterChange,
  onKindFilterChange,
  onCategoryFilterChange,
  onGradeFilterChange,
  onCreditsFilterChange,
  searchQuery = '',
  onSearchChange,
  shouldExpand = false
}: DashboardTopBarProps) => {
  const { top, right } = useSafeAreaInsets();
  
  // Team paging state and request
  const [teamPage, setTeamPage] = useState(1);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamHasNext, setTeamHasNext] = useState(true);
  const [isLoadingMoreTeam, setIsLoadingMoreTeam] = useState(false);
  const [_forceRefresh, setForceRefresh] = useState(0); // Add force refresh trigger

  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const { limits } = useSubscription();

  const TEAM_PAGE_SIZE = 10;
  const [teamRequest, setTeamRequest] = useState(() =>
    new PagedListRequestBuilder()
      .setPaging(1, TEAM_PAGE_SIZE)
      .setSorting('firstName', SortDirection.Ascending)
      .build()
  );

  const { user } = useAuth();
  const { teamMembersList, loadingTeamMembers, refreshTeamMembers } = useTeam(teamRequest);
  

  // Use ref to store the latest refreshTeam function
  const refreshTeamRef = useRef(refreshTeamMembers);
  refreshTeamRef.current = refreshTeamMembers;

  // Accumulate team members as pages load
  useEffect(() => {
    if (teamMembersList && teamMembersList.data) {
      const hasNext = teamMembersList.paging?.hasNext ?? false;
      const currentPage = teamMembersList.paging?.currentPage ?? 1;
      
      setTeamHasNext(hasNext);
      setTeamPage(currentPage);
      setTeamMembers(prev => {
        // If first page, replace; else, accumulate unique
        if (currentPage === 1) {
          return teamMembersList.data;
        } else {
          const existingIds = new Set(prev.map(m => m.id));
          const newMembers = [...prev, ...teamMembersList.data.filter(m => !existingIds.has(m.id))];
          return newMembers;
        }
      });
      
      // Reset loading state immediately when data is received
      setIsLoadingMoreTeam(false);
    } else if (!loadingTeamMembers && isLoadingMoreTeam) {
      // If not loading but we were trying to load more, reset the loading state
      setIsLoadingMoreTeam(false);
    }
  }, [teamMembersList, loadingTeamMembers, isLoadingMoreTeam]);

  // Reset team pagination when view mode changes
  useEffect(() => {
    // Reset to first page when switching view modes
    const initialRequest = new PagedListRequestBuilder()
      .setPaging(1, TEAM_PAGE_SIZE)
      .setSorting('firstName', SortDirection.Ascending)
      .build();
    
    setTeamRequest(initialRequest);
    setTeamMembers([]);
    setTeamPage(1);
    setTeamHasNext(true);
    setIsLoadingMoreTeam(false);
    setForceRefresh(prev => prev + 1); // Trigger refresh
    
    // Force refresh the team data - use timeout to avoid rapid calls
    setTimeout(() => {
      refreshTeamRef.current(initialRequest);
    }, 100);
  }, []); // Remove viewMode dependency to prevent unnecessary reloads

  // Include current user in team data (sort current user first)
  const filteredTeamMembers = React.useMemo(() => {
    const filtered = teamMembers.slice(); // Create a copy

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
  }, [teamMembers, user?.id, limits]);

  // Priority dropdown data
  const priorityDropdownData = React.useMemo(() => [
    { label: 'Any', value: TaskItemPriorityFilter.Any },
    { label: 'Not Set', value: TaskItemPriorityFilter.None },
    { label: 'Low', value: TaskItemPriorityFilter.Low },
    { label: 'Medium', value: TaskItemPriorityFilter.Medium },
    { label: 'High', value: TaskItemPriorityFilter.High },
    { label: 'Critical', value: TaskItemPriorityFilter.Critical }
  ], []);

  // Grades hook and dropdown data
  const { grades } = useGrades();
  const gradeDropdownData = React.useMemo(() => [
    // { label: 'Any', value: null },
    ...(grades || []).map(grade => ({
      label: grade.letterGrade,
      value: grade.id
    }))
  ], [grades]);

  // Credits dropdown data
  const creditsDropdownData = React.useMemo(() => [
    // { label: 'Any', value: null },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 }
  ], []);

  // Task Groups data for dropdowns
  const [taskGroupsRequest] = useState(() => 
    new PagedListRequestBuilder()
      .setParentId(user?.id || -1)
      .setPaging(1, 100)
      .build()
  );
  
  const { pagedTaskGroups } = useTaskGroups(taskGroupsRequest);
  const taskGroups = React.useMemo(() => pagedTaskGroups?.data || [], [pagedTaskGroups?.data]);
  
  // Find selected objects
  const selectedGroup = React.useMemo(() => 
    taskGroups.find(g => g.id === selectedGroupId) || null, 
    [taskGroups, selectedGroupId]
  );
  const selectedKind = React.useMemo(() => 
    selectedGroup?.kinds?.find((k: any) => k.id === selectedKindId) || null, 
    [selectedGroup, selectedKindId]
  );

  // Prepare dropdown data
  const groupDropdownData = React.useMemo(() => 
    taskGroups
      .map(group => ({
        label: group.name,
        value: group.id,
        originalData: group,
        isActive: group.isActive
      }))
      .filter(group => group.isActive || group.value === selectedGroupId),
    [taskGroups, selectedGroupId]
  );

  const kindDropdownData = React.useMemo(() => {
    const availableKinds = selectedGroup?.kinds || [];
    return availableKinds
      .map((kind: any) => ({
        label: kind.name,
        value: kind.id,
        originalData: kind,
        isActive: kind.isActive
      }))
      .filter((kind: any) => kind.isActive || kind.value === selectedKindId);
  }, [selectedGroup, selectedKindId]);

  const categoryDropdownData = React.useMemo(() => {
    const availableCategories = (selectedKind as any)?.categories || [];
    return availableCategories
      .map((category: any) => ({
        label: category.name,
        value: category.id,
        originalData: category,
        isActive: category.isActive
      }))
      .filter((category: any) => category.isActive || category.value === selectedCategoryId);
  }, [selectedKind, selectedCategoryId]);

  // Infinite scroll for team members
  const handleTeamMembersScroll = async (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const paddingToEnd = 80; // Increased threshold for better UX
    const isNearEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - paddingToEnd;
    
    if (
      isNearEnd &&
      teamHasNext &&
      !isLoadingMoreTeam &&
      !loadingTeamMembers &&
      contentSize.width > layoutMeasurement.width // Ensure content is scrollable
    ) {
      setIsLoadingMoreTeam(true);
      
      const nextPage = (teamPage ?? 1) + 1;
      const newRequest = new PagedListRequestBuilder(teamRequest)
        .setPaging(nextPage, TEAM_PAGE_SIZE)
        .setSorting('firstName', SortDirection.Ascending)
        .build();
      
      setTeamRequest(newRequest);
      refreshTeamRef.current(newRequest);
    }
  };
  
  // Use ref to store the latest onSearchChange function
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [animatedHeight] = useState(new Animated.Value(0)); 
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Track orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isLandscape = dimensions.width > dimensions.height;
  const rightPadding = isLandscape ? right + 10 : right + 8;
  
  // Sync local search query with prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    setDebouncedSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(localSearchQuery);
    }, 1000); // 1000ms delay

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearchChangeRef.current?.(debouncedSearchQuery);
  }, [debouncedSearchQuery]);
  
  const toggleCollapsed = useCallback(() => {
    const toValue = isCollapsed ? 1 : 0; // If currently collapsed, expand to 1; if expanded, collapse to 0
    setIsCollapsed(!isCollapsed);
    
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isCollapsed, animatedHeight]);

  // Auto-expand when shouldExpand is true
  useEffect(() => {
    if (shouldExpand && isCollapsed) {
      toggleCollapsed();
    }
  }, [shouldExpand, isCollapsed, toggleCollapsed]);
  
  if (isMultiSelectMode) {
    return (
      <View 
        style={[styles.container, { paddingTop: top }]}
        accessible={false}
      >
        <Appbar.Header mode="center-aligned" elevated style={styles.topBar}>
          <Appbar.BackAction 
            onPress={onExitMultiSelect}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Exit selection mode"
            accessibilityHint="Double tap to exit multi-select mode"
          />
          <Appbar.Content 
            title={
              <Text 
                style={styles.selectTasksTitle}
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel="Select Tasks mode"
              >
                Select Tasks
              </Text>
            } 
          />
          <Appbar.Action 
            icon="select-all" 
            onPress={onSelectAll}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Select all tasks"
            accessibilityHint="Double tap to select all visible tasks"
          />
        </Appbar.Header>
      </View>
    );
  }

  if (loading) {
    return (
      <View 
        style={[styles.container, { paddingTop: top }]}
        accessible={false}
      >
        <Appbar.Header mode="center-aligned" elevated style={styles.topBar}>
          <Appbar.Content 
            title="Loading..."
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Loading dashboard"
          />
        </Appbar.Header>
      </View>
    );
  }

  const handleCompletedFilterChange = (value: TaskItemCompletionStatusFilter) => {
    onCompletedFilterChange?.(value);
  };

  const handleActiveFilterChange = (value: TaskItemActiveStatusFilter) => {
    onActiveFilterChange?.(value);
  };

  const handlePriorityFilterChange = (value: TaskItemPriorityFilter) => {
    onPriorityFilterChange?.(value);
  };

  const handleDueFilterChange = (value: TaskItemDueStatusFilter) => {
    onDueFilterChange?.(value);
  };

  const handleStartedFilterChange = (value: TaskItemStartedStatusFilter) => {
    onStartedFilterChange?.(value);
  };

  const handleEndedFilterChange = (value: TaskItemEndedStatusFilter) => {
    onEndedFilterChange?.(value);
  };

  const handleArchivedFilterChange = (value: TaskItemArchivedStatusFilter) => {
    onArchivedFilterChange?.(value);
  };

  const handleAllFilterPress = () => {
    onAllFilterPress();
  };

  const handlePriorityDropdownChange = (item: any) => {
    handlePriorityFilterChange(item.value);
  };

  const isAllActive = () => {
    return completedFilterStatus === TaskItemCompletionStatusFilter.Any &&
           activeFilterStatus === TaskItemActiveStatusFilter.Any &&
           dueFilterStatus === TaskItemDueStatusFilter.Any &&
           startedFilterStatus === TaskItemStartedStatusFilter.Any &&
           endedFilterStatus === TaskItemEndedStatusFilter.Any &&
           archivedFilterStatus === TaskItemArchivedStatusFilter.Any &&
           priorityFilter === TaskItemPriorityFilter.Any &&
           viewMode === TaskItemAssignmentStatusFilter.Any &&
           selectedTeamMember === null &&
           selectedGroupId === null &&
           selectedKindId === null &&
           selectedCategoryId === null &&
           selectedGradeId === null &&
           selectedCredits === null &&
           debouncedSearchQuery.trim() === '';
  };

  // const resetFilters = () => {
  //   onGroupFilterChange?.(null);
  //   onKindFilterChange?.(null);
  //   onCategoryFilterChange?.(null);
  //   setLocalSearchQuery('');
  // };

  const handleSearchClear = () => {
    setLocalSearchQuery('');
  };

  const handleViewModeChange = (memberId: number | null) => {
    // Convert team member selection to assignment status filter
    if (memberId === null) {
      onViewModeChange?.(TaskItemAssignmentStatusFilter.Any);
    } else if (memberId === user?.id) {
      onViewModeChange?.(TaskItemAssignmentStatusFilter.Mine);
    } else if (memberId === -1) { // Special case for Unassigned
      onViewModeChange?.(TaskItemAssignmentStatusFilter.Unassigned);
    } else {
      onViewModeChange?.(TaskItemAssignmentStatusFilter.Team);
    }
    
    // Update the selected team member
    onTeamMemberChange?.(memberId === -1 ? null : memberId);
  };

  const handleTeamMemberChange = (memberId: number | null) => {
    handleViewModeChange(memberId);
  };

  // const getUserDisplayName = (member: any) => {
  //   if (member.firstName && member.lastName) {
  //     return `${member.firstName} ${member.lastName}`;
  //   }
  //   return member.userName;
  // };

  return (
    <View 
      style={styles.container}
      accessible={false}
    >
      {/* Header with Search Bar (only when collapsed) */}
      {isCollapsed && (
        <View 
          style={[styles.headerContainer, { 
            paddingTop: Platform.select({
              ios: 12, //Math.max(top - 8, 8), // Respect safe area on iOS with slight adjustment
              android: 12, // Fixed padding for Android
            }),
            paddingRight: rightPadding 
          }]}
          accessible={false}
        >
          <Searchbar
            placeholder="Search tasks..."
            onChangeText={setLocalSearchQuery}
            value={localSearchQuery}
            onClearIconPress={handleSearchClear}
            style={styles.collapsedSearchBar}
            inputStyle={styles.collapsedSearchInput}
            iconColor={colors.primary}
            placeholderTextColor={colors.textSecondary}
            accessible={true}
            accessibilityRole="search"
            accessibilityLabel="Search tasks"
            accessibilityHint="Enter text to search for specific tasks"
          />
          <IconButton
            icon="chevron-down"
            iconColor={colors.secondaryDark}
            size={20}
            onPress={toggleCollapsed}
            style={styles.chevronButtonInline}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isCollapsed ? "Expand filters" : "Collapse filters"}
            accessibilityHint={isCollapsed ? "Double tap to show filter options" : "Double tap to hide filter options"}
          />
        </View>
      )}
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <Animated.View 
          style={[
            styles.collapsibleContainer,
            {
              opacity: animatedHeight,
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500], // Adjust max height as needed
              }),
            }
          ]}
        >
        <>
          {/* Team Member Avatars (when not collapsed) */}
          {!isCollapsed && (
              <View style={styles.teamMembersRowContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teamMembersListScrollContent}
                  style={styles.teamMembersListScrollView}
                  onScroll={handleTeamMembersScroll}
                  scrollEventThrottle={16}
                >
                  {loadingTeamMembers && teamMembers.length === 0 ? (
                    <View style={styles.loadingMoreFooter}>
                      <Text style={styles.loadingMoreText}>Loading team members...</Text>
                    </View>
                  ) : filteredTeamMembers.length > 0 ? (
                    <>
                      {/* All Team Members option */}
                      <TouchableOpacity
                        style={[styles.teamMemberItem, (viewMode === TaskItemAssignmentStatusFilter.Any || selectedTeamMember === null) && styles.selectedTeamMemberItem]}
                        onPress={() => handleTeamMemberChange(null)}
                        accessible={true}
                        accessibilityRole="tab"
                        accessibilityLabel="All team members"
                        accessibilityHint="Double tap to view tasks for all team members"
                        accessibilityState={{ selected: viewMode === TaskItemAssignmentStatusFilter.Any || selectedTeamMember === null }}
                      >
                        <View style={[
                          styles.avatarContainer,
                          styles.teamMemberAvatar,
                          (viewMode === TaskItemAssignmentStatusFilter.Any || selectedTeamMember === null) && styles.selectedTeamMemberAvatar
                        ]}
                          accessible={false}
                        >
                          <Text style={[
                            styles.avatarText,
                            styles.teamAvatarLabel,
                            Platform.OS === 'ios' && { lineHeight: styles.teamAvatarLabel.fontSize }
                          ]}
                            accessible={false}
                          >
                            ALL
                          </Text>
                        </View>
                        <Text
                          variant='bodySmall'
                          style={[
                            styles.teamMemberName,
                            (viewMode === TaskItemAssignmentStatusFilter.Any || selectedTeamMember === null) && styles.selectedTeamMemberName
                          ]}
                          numberOfLines={2}
                          accessible={false}
                        >
                          All
                        </Text>
                      </TouchableOpacity>

                      {/* Individual team members */}
                      {filteredTeamMembers.map((member) => {
                        const isInactive = member.isActive === false;
                        const isSelected = (member.id === user?.id && viewMode === TaskItemAssignmentStatusFilter.Mine) ||
                                         (member.id !== user?.id && viewMode === TaskItemAssignmentStatusFilter.Team && selectedTeamMember === member.id);
                        const memberDisplayName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.userName || 'Unknown';
                        
                        return (
                          <View
                            // @ts-ignore - key is valid in React but not in TS type definitions
                            key={member.id}
                            style={isInactive ? styles.inactiveTeamMember : undefined}
                            accessible={false}
                          >
                            <TouchableOpacity
                              style={[
                                styles.teamMemberItem,
                                isSelected && styles.selectedTeamMemberItem
                              ]}
                              onPress={() => handleTeamMemberChange(member.id)}
                              accessible={true}
                              accessibilityRole="tab"
                              accessibilityLabel={`${memberDisplayName}${isInactive ? ' (inactive)' : ''}`}
                              accessibilityHint={`Double tap to view tasks for ${memberDisplayName}`}
                              accessibilityState={{ selected: isSelected, disabled: isInactive }}
                            >
                              <UserAvatar
                                size={36}
                                imageUri={member.avatarUri}
                                firstName={member.firstName}
                                lastName={member.lastName}
                                userName={member.userName}
                                style={[
                                  styles.teamMemberAvatar,
                                  member.isAdmin && styles.adminTeamMemberAvatar,
                                  ((member.id === user?.id && viewMode === TaskItemAssignmentStatusFilter.Mine) ||
                                   (member.id !== user?.id && viewMode === TaskItemAssignmentStatusFilter.Team && selectedTeamMember === member.id)) && styles.selectedTeamMemberAvatar
                                ]}
                                labelStyle={[
                                  styles.teamAvatarLabel,
                                  ((member.id === user?.id && viewMode === TaskItemAssignmentStatusFilter.Mine) ||
                                   (member.id !== user?.id && viewMode === TaskItemAssignmentStatusFilter.Team && selectedTeamMember === member.id)) && styles.selectedAvatarLabel
                                ]}
                              />
                              <Text
                                variant='bodySmall'
                                style={[
                                  styles.teamMemberName,
                                  ((member.id === user?.id && viewMode === TaskItemAssignmentStatusFilter.Mine) ||
                                   (member.id !== user?.id && viewMode === TaskItemAssignmentStatusFilter.Team && selectedTeamMember === member.id)) && styles.selectedTeamMemberName
                                ]}
                                numberOfLines={2}
                                accessible={false}
                              >
                                {(() => {
                                  const firstName = member.firstName?.trim() || '';
                                  const lastName = member.lastName?.trim() || '';
                                  const displayName = `${firstName} ${lastName}`.trim() || member.userName || 'Unknown';
                                  return member.id === user?.id ? `${displayName}` : displayName;
                                })()}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      
                      {/* Unassigned option */}
                      <TouchableOpacity
                        style={[styles.teamMemberItem, viewMode === TaskItemAssignmentStatusFilter.Unassigned && styles.selectedTeamMemberItem]}
                        onPress={() => handleTeamMemberChange(-1)}
                      >
                        <View style={[
                          styles.avatarContainer,
                          styles.teamMemberAvatar,
                          styles.unassignedAvatar,
                          viewMode === TaskItemAssignmentStatusFilter.Unassigned && styles.selectedTeamMemberAvatar
                        ]}>
                          <Text style={[
                            styles.avatarText,
                            styles.teamAvatarLabel,
                            Platform.OS === 'ios' && { lineHeight: styles.teamAvatarLabel.fontSize }
                          ]}>
                            _
                          </Text>
                        </View>
                        <Text
                          variant='bodySmall'
                          style={[
                            styles.teamMemberName,
                            viewMode === TaskItemAssignmentStatusFilter.Unassigned && styles.selectedTeamMemberName
                          ]}
                          numberOfLines={2}
                        >
                          Unassigned
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Loading indicator for more team members */}
                      {isLoadingMoreTeam && (
                        <View style={styles.loadingMoreFooter}>
                          <Text style={styles.loadingMoreText}>Loading more...</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.loadingMoreFooter}>
                      <Text style={styles.loadingMoreText}>No team members found</Text>
                    </View>
                  )}
                </ScrollView>
                
                {/* Fixed chevron button on the right */}
                <View style={styles.chevronButtonFixed}>
                  <IconButton
                    icon="chevron-up"
                    iconColor={colors.secondaryDark}
                    size={20}
                    onPress={toggleCollapsed}
                    style={styles.chevronButtonInline}
                  />
                </View>
              </View>
          )}

          {/* Priority, Task Group/Kind/Category, Grade, Credits Filters Row */}
          {!isCollapsed && (
            <View style={styles.filtersContainer}>
              <SubscriptionGate 
                requiredTier={SubscriptionTier.Pro}
                // requiresFeature={(limits) => limits.bonuses} 
                overlayWhenLocked
                onUpgradePress={() => setUpgradeModalVisible(true)}
              >
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScrollContent}
                >
                  {/* Priority Filter Dropdown */}
                  <View style={styles.priorityDropdownContainer}>
                    <DropdownComponent
                      data={priorityDropdownData}
                      value={priorityFilter}
                      onValueChange={handlePriorityDropdownChange}
                      placeholder="Priority"
                      label="Priority"
                      searchable={false}
                      textSize="small"
                      allowClear={false}
                    />
                  </View>

                  {/* Group Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <DropdownComponent
                      data={groupDropdownData}
                      value={selectedGroupId}
                      onValueChange={(item) => onGroupFilterChange?.(item.value)}
                      placeholder="Select Group"
                      label="Task Group"
                      searchable={true}
                      textSize="small"
                      allowClear={true}
                    />
                  </View>

                  {/* Kind Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <DropdownComponent
                      data={kindDropdownData}
                      value={selectedKindId}
                      onValueChange={(item) => onKindFilterChange?.(item.value)}
                      placeholder={selectedGroupId ? "Select Kind" : "Select Group first"}
                      label="Task Kind"
                      disabled={!selectedGroupId}
                      searchable={true}
                      textSize="small"
                      allowClear={true}
                    />
                  </View>

                  {/* Category Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <DropdownComponent
                      data={categoryDropdownData}
                      value={selectedCategoryId}
                      onValueChange={(item) => onCategoryFilterChange?.(item.value)}
                      placeholder={selectedKindId ? "Select Category" : "Select Kind first"}
                      label="Task Category"
                      disabled={!selectedKindId}
                      searchable={true}
                      textSize="small"
                      allowClear={true}
                    />
                  </View>

                  {/* Grade Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <DropdownComponent
                      data={gradeDropdownData}
                      value={selectedGradeId}
                      onValueChange={(item) => onGradeFilterChange?.(item.value)}
                      placeholder="Select Grade"
                      label="Grade"
                      searchable={false}
                      textSize="small"
                      allowClear={true}
                    />
                  </View>

                  {/* Credits Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <DropdownComponent
                      data={creditsDropdownData}
                      value={selectedCredits}
                      onValueChange={(item) => onCreditsFilterChange?.(item.value)}
                      placeholder="Select Credits"
                      label="Credits"
                      searchable={false}
                      textSize="small"
                      allowClear={true}
                    />
                  </View>
                </ScrollView>
              </SubscriptionGate >
            </View>
          )}

          {/* Primary Stats Row */}
          {!isCollapsed && (
            <View style={styles.primaryStatsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScrollContent}
              style={styles.statsScrollView}
            >
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <View style={[styles.primaryDualStatItem, ((!isAllActive() && stats?.filteredCount !== stats?.totalCount) || (stats?.filteredCount === stats?.totalCount && stats?.filteredCount !== 0)) && styles.activePrimaryDualStat]}>
                      <Text variant='bodyMedium' style={[styles.primaryDualStatNumber, ((!isAllActive() && stats?.filteredCount !== stats?.totalCount) || (stats?.filteredCount === stats?.totalCount && stats?.filteredCount !== 0)) && styles.activePrimaryFilterText]}>{stats?.filteredCount || 0}</Text>
                    </View>
                    <Text variant='bodyMedium' style={styles.primaryDualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.primaryDualStatItem, (isAllActive() || (stats?.filteredCount === stats?.totalCount && stats?.filteredCount !== 0)) && styles.activePrimaryDualStat]} onPress={() => handleAllFilterPress()}>
                      <Text variant='bodyMedium' style={[styles.primaryDualStatNumber, (isAllActive() || (stats?.filteredCount === stats?.totalCount && stats?.filteredCount !== 0)) && styles.activePrimaryFilterText]}>{stats?.totalCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Filtered / Total</Text>
                </View>
                
                {/* Done / Not Done */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, completedFilterStatus === TaskItemCompletionStatusFilter.Completed && styles.activeDualStat]} onPress={() => handleCompletedFilterChange(TaskItemCompletionStatusFilter.Completed)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, completedFilterStatus === TaskItemCompletionStatusFilter.Completed && styles.activeFilterText]}>{stats?.completedCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, completedFilterStatus === TaskItemCompletionStatusFilter.InProgress && styles.activeDualStat]} onPress={() => handleCompletedFilterChange(TaskItemCompletionStatusFilter.InProgress)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, completedFilterStatus === TaskItemCompletionStatusFilter.InProgress && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.completedCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Done / Not</Text>
                </View>

                {/* Active / Inactive */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, activeFilterStatus === TaskItemActiveStatusFilter.Active && styles.activeDualStat]} onPress={() => handleActiveFilterChange(TaskItemActiveStatusFilter.Active)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, activeFilterStatus === TaskItemActiveStatusFilter.Active && styles.activeFilterText]}>{stats?.activeCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, activeFilterStatus === TaskItemActiveStatusFilter.Inactive && styles.activeDualStat]} onPress={() => handleActiveFilterChange(TaskItemActiveStatusFilter.Inactive)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, activeFilterStatus === TaskItemActiveStatusFilter.Inactive && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.activeCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Active / Not</Text>
                </View>

                {/* Past Due / On Time */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, dueFilterStatus === TaskItemDueStatusFilter.Due && styles.activeDualStat]} onPress={() => handleDueFilterChange(TaskItemDueStatusFilter.Due)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, dueFilterStatus === TaskItemDueStatusFilter.Due && styles.activeFilterText]}>{stats?.dueCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, dueFilterStatus === TaskItemDueStatusFilter.NotDue && styles.activeDualStat]} onPress={() => handleDueFilterChange(TaskItemDueStatusFilter.NotDue)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, dueFilterStatus === TaskItemDueStatusFilter.NotDue && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.dueCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Due / Not</Text>
                </View>

                {/* Started / Not Started */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, startedFilterStatus === TaskItemStartedStatusFilter.Started && styles.activeDualStat]} onPress={() => handleStartedFilterChange(TaskItemStartedStatusFilter.Started)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, startedFilterStatus === TaskItemStartedStatusFilter.Started && styles.activeFilterText]}>{stats?.startedCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, startedFilterStatus === TaskItemStartedStatusFilter.NotStarted && styles.activeDualStat]} onPress={() => handleStartedFilterChange(TaskItemStartedStatusFilter.NotStarted)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, startedFilterStatus === TaskItemStartedStatusFilter.NotStarted && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.startedCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Started / Not</Text>
                </View>

                {/* Ended / Not Ended */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, endedFilterStatus === TaskItemEndedStatusFilter.Ended && styles.activeDualStat]} onPress={() => handleEndedFilterChange(TaskItemEndedStatusFilter.Ended)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, endedFilterStatus === TaskItemEndedStatusFilter.Ended && styles.activeFilterText]}>{stats?.endedCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, endedFilterStatus === TaskItemEndedStatusFilter.NotEnded && styles.activeDualStat]} onPress={() => handleEndedFilterChange(TaskItemEndedStatusFilter.NotEnded)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, endedFilterStatus === TaskItemEndedStatusFilter.NotEnded && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.endedCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Ended / Not</Text>
                </View>

                {/* Archived / Not */}
                <View style={styles.statItem}>
                  <View style={styles.dualStatContainer}>
                    <TouchableOpacity style={[styles.dualStatItem, archivedFilterStatus === TaskItemArchivedStatusFilter.Archived && styles.activeDualStat]} onPress={() => handleArchivedFilterChange(TaskItemArchivedStatusFilter.Archived)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, archivedFilterStatus === TaskItemArchivedStatusFilter.Archived && styles.activeFilterText]}>{stats?.archivedCount || 0}</Text>
                    </TouchableOpacity>
                    <Text variant='bodySmall' style={styles.dualStatSeparator}>/</Text>
                    <TouchableOpacity style={[styles.dualStatItem, archivedFilterStatus === TaskItemArchivedStatusFilter.Unarchived && styles.activeDualStat]} onPress={() => handleArchivedFilterChange(TaskItemArchivedStatusFilter.Unarchived)}>
                      <Text variant='bodySmall' style={[styles.dualStatNumber, archivedFilterStatus === TaskItemArchivedStatusFilter.Unarchived && styles.activeFilterText]}>{(stats?.totalCount || 0) - (stats?.archivedCount || 0)}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text variant='bodySmall' style={styles.statLabel}>Archvd / Not</Text>
                </View>
              </View>
            </ScrollView>
          </View>
          )}


        </>
        </Animated.View>
      )}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
    minHeight: Platform.select({
      ios: 36, // Larger minimum height for iOS to accommodate safe area
      android: 36, // Keep original height for Android
    }),
  },
  headerTitle: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  toggleButtonContainer: {
    marginRight: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  collapsibleContainer: {
    overflow: 'hidden',
  },
  // controlsContainer: {
  //   backgroundColor: colors.primary,
  //   paddingHorizontal: 16,
  //   paddingVertical: 2,
  //   borderBottomWidth: 1,
  //   borderBottomColor: colors.primaryDark,
  // },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
    height: 40,
    maxWidth: 300,
    flex: 1,
  },
  dropdownContainer: {
    paddingHorizontal: 4,
    minWidth: 140,
    maxWidth: 200,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersContainer: {
    backgroundColor: colors.backgroundAccent,
    paddingVertical: 2,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    overflow: 'visible',
  },
  filtersScrollContent: {
    paddingHorizontal: 4,
    paddingTop: Platform.OS === 'ios' ? 7 : 5,
  },
  priorityDropdownContainer: {
    minWidth: 120,
    maxWidth: 140,
    paddingHorizontal: 4,
    overflow: 'visible',
  },
  taskFilterDropdowns: {
    overflow: 'visible',
  },
  primaryStatsContainer: {
    backgroundColor: colors.accentLight,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
    minHeight: 70,
  },
  statsScrollView: {
    flex: 1,
  },
  statsScrollContent: {
    paddingHorizontal: 4,
  },
  topBar: {
    backgroundColor: colors.secondary,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '100%',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 40,
    minWidth: 80,
    marginHorizontal: 4,
  },
  clickableStatItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    fontSize: 18,
  },
  statLabel: {
    color: colors.textOnPrimary,
    marginTop: 2,
    fontSize: 10,
    textAlign: 'center',
  },
  activeFilter: {
    color: colors.primary,
    backgroundColor: colors.backgroundDefault,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  dualStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualStatItem: {
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 36,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualStatNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  dualStatSeparator: {
    color: colors.textOnPrimary,
    paddingHorizontal: 4,
    fontSize: 12,
  },
  activeDualStat: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 6,
  },
  activeFilterText: {
    color: colors.primary,
  },
  primaryDualStatItem: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDualStatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  primaryDualStatSeparator: {
    color: colors.textOnPrimary,
    paddingHorizontal: 3,
    fontSize: 14,
    fontWeight: 'bold',
  },
  activePrimaryDualStat: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 8,
  },
  activePrimaryFilterText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  teamMembersRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
  },
 teamMembersListScrollView: {
    flex: 1,
  },
  teamMembersListScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chevronButtonFixed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chevronButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 90,
  },
  chevronButtonInline: {
    margin: 0,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
  },
  teamMemberItem: {
    alignItems: 'center',
    marginHorizontal: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 90,
  },
  selectedTeamMemberItem: {
    backgroundColor: colors.backgroundDefault,
  },
  teamMemberAvatar: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primaryContrastText,
    marginBottom: 6,
  },
  adminTeamMemberAvatar: {
    borderColor: colors.primaryContrastText,
    backgroundColor: colors.primary,
  },
  selectedTeamMemberAvatar: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  unassignedAvatar: {
    backgroundColor: colors.secondary,
    borderColor: colors.primaryContrastText,
  },
  teamAvatarLabel: {
    color: colors.primaryContrastText,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: fonts.fredoka,
  },
  teamMemberName: {
    color: colors.textOnPrimary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  selectedTeamMemberName: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  inactiveTeamMember: {
    opacity: 0.6,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  selectedAvatarLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
 searchBar: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 40,
    maxHeight: 40,
    paddingVertical: 0,
  },
  searchInput: {
    fontSize: 12,
    color: colors.textPrimary,
    minHeight: 40,
    maxHeight: 40,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  collapsedSearchBar: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 46,
    maxHeight: 46,
    paddingVertical: 0,
    flex: 1,
    marginRight: 12,
  },
  collapsedSearchInput: {
    fontSize: 12,
    color: colors.textPrimary,
    minHeight: 46,
    maxHeight: 46,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  loadingMoreFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  loadingMoreText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectTasksTitle: {
    fontFamily: fonts.fredokaSemiBold,
    fontSize: 18,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
});

export default DashboardTopBar;