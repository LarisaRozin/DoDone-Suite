/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { Text } from '../../components/StyledText';
import { colors, fonts } from '../../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth, useTaskGroups, TaskGroupDetailsResponse, PagedListRequestBuilder, SortDirection, useTeam } from '@larisarozin/dodone-shared';

type TaskGroupsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TaskGroupsScreenProps {
  navigation: TaskGroupsScreenNavigationProp;
}

const TaskGroupsDisplay = React.forwardRef<
  { refresh: () => void, setShouldRefresh: (value: boolean) => void },
  { user: any, navigation: TaskGroupsScreenNavigationProp, isLandscape: boolean }
>(({ user, navigation, isLandscape }, ref) => {
  const [pagedRequest, setPagedRequest] = useState(() => 
    new PagedListRequestBuilder()
      .setParentId(user?.id || -1)
      .setPaging(1, 50) // Get more items since task groups are typically fewer
      .build()
  );
  
  const { pagedTaskGroups, taskGroupsLoading, refreshTaskGroups } = useTaskGroups(pagedRequest);

  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1) // we don't need team members on this screen
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );
  const { teamDetails } = useTeam(teamRequest);
  
  const groupsInfoText = teamDetails?.isBusiness
    ? "Groups, Kinds and Categories help in organizing and filtering tasks. Example Groups: Sales & Marketing, Operations, Human Resources."
    : "Groups, Kinds and Categories help in organizing and filtering tasks. Example Groups: Shopping, Household, School Work.";
  const kindsInfoText = teamDetails?.isBusiness
    ? "Example Kinds: Lead Generation, Sales Outreach. Example Categories: Recruitment, Client Outreach"
    : "Example Kinds: Math or Science (School Work Group), Groceries (Shopping Group). Example Categories: Homework, Reading";

  // State for accumulated task groups and pagination
  const [allTaskGroups, setAllTaskGroups] = useState<TaskGroupDetailsResponse[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000); // 1000ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Function to create paged request with search
  const createPagedRequest = React.useCallback((page: number = 1, searchTerm: string = '') => {
    const requestBuilder = new PagedListRequestBuilder()
      .setParentId(user?.id || -1)
      .setPaging(page, 50);

    if (searchTerm.trim()) {
      requestBuilder.setSearch(searchTerm.trim());
    }
    
    return requestBuilder.build();
  }, [user?.id]);

  // Function to refresh the task groups list
  const refreshTaskGroupsList = React.useCallback(() => {
    setAllTaskGroups([]); // Reset accumulated data to refresh the view
    const resetRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(resetRequest);
    refreshTaskGroups(resetRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPagedRequest, debouncedSearchQuery]);

  // Add navigation listener to refresh when returning from TaskGroupEdit
  const shouldRefreshRef = React.useRef(false);
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (shouldRefreshRef.current) {
        refreshTaskGroupsList();
        shouldRefreshRef.current = false; // Reset the flag
      }
    });

    return unsubscribe;
  }, [navigation, refreshTaskGroupsList]);

  // Load task groups when debounced search query changes
  useEffect(() => {
    setAllTaskGroups([]); // Reset accumulated data for new search
    const searchRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(searchRequest);
    refreshTaskGroups(searchRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, createPagedRequest]);

  // Effect to handle data accumulation and pagination state
  useEffect(() => {
    if (pagedTaskGroups) {
      const currentPage = pagedTaskGroups.paging.currentPage;
      const hasNext = pagedTaskGroups.paging.hasNext;
      
      if (currentPage === 1) {
        // First page - replace all data
        setAllTaskGroups(pagedTaskGroups.data);
        // Stop refreshing when new data arrives on first page
        setIsRefreshing(false);
      } else {
        // Subsequent pages - append data
        setAllTaskGroups(prev => [...prev, ...pagedTaskGroups.data]);
      }
      setHasNextPage(hasNext);
      setIsLoadingMore(false);
    } else {
      // If no data is returned (e.g., after a refresh with no results), stop refreshing
      setIsRefreshing(false);
    }
  }, [pagedTaskGroups]);

  // Use accumulated task groups for display
  const displayTaskGroups = allTaskGroups;
  
  // Debug logging
  // useEffect(() => {
  //   console.log('Display task groups updated:', {
  //     count: displayTaskGroups.length,
  //     items: displayTaskGroups.map(tg => ({ id: tg.id, name: tg.name }))
  //   });
  // }, [displayTaskGroups]);

  const handleTaskGroupPress = (taskGroup: TaskGroupDetailsResponse) => {
    shouldRefreshRef.current = true; // Set flag to refresh when we return
    navigation.navigate('TaskGroupEdit', { 
      taskGroup
    });
  };

  const handleLoadMore = () => {
    if (!hasNextPage || isLoadingMore || taskGroupsLoading || !pagedTaskGroups) {
      return;
    }

    const nextPage = pagedTaskGroups.paging.currentPage + 1;
    const nextPageRequest = createPagedRequest(nextPage, debouncedSearchQuery);
    if (nextPageRequest) {
      setIsLoadingMore(true);
      setPagedRequest(nextPageRequest);
      refreshTaskGroups(nextPageRequest);
    }
  };

  const handleRefresh = () => {
    if (isRefreshing) {
      return; // Prevent multiple simultaneous refreshes
    }
    setIsRefreshing(true);
    refreshTaskGroupsList();
  };

  // Expose refresh function to parent component
  React.useImperativeHandle(ref, () => ({
    refresh: refreshTaskGroupsList,
    setShouldRefresh: (value: boolean) => {
      shouldRefreshRef.current = value;
    }
  }), [refreshTaskGroupsList]);

  return (
    <View style={localStyles.container}>
      {/* Search Bar */}
      <View style={[
        localStyles.searchContainer,
        isLandscape ? localStyles.landscapeSearch : localStyles.portraitSearch
      ]}>
        <Searchbar
          placeholder="Search task groups..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={localStyles.searchBar}
          inputStyle={localStyles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.textSecondary}
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel="Search task groups"
          accessibilityHint="Enter text to search for task groups"
        />
      </View>

      {/* Loading Indicator - positioned below search bar */}
      {taskGroupsLoading && (
        <View style={localStyles.loadingIndicator}>
          <Text variant='bodyMedium' style={localStyles.loadingText}>Loading task groups...</Text>
        </View>
      )}

      {/* Scrollable Task Group List - Card Layout */}
      <View style={localStyles.taskGroupListContainer}>

        <Text style={localStyles.infoLabel}>ℹ️ {groupsInfoText} ️{kindsInfoText}</Text>
        {displayTaskGroups.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Text variant='titleMedium' style={{ color: colors.textSecondary }}>
              {searchQuery.trim() ? 'No matching task groups found' : 'Add some task groups to get started!'}
            </Text>
            {searchQuery.trim() && (
              <Text variant='bodyMedium' style={localStyles.emptySubText}>
                Try adjusting your search terms
              </Text>
            )}
          </View>
        ) : (
            <FlatList
              data={displayTaskGroups}
              keyExtractor={(item) => item.id.toString()}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              key={`${isLandscape ? 'landscape' : 'portrait'}-${displayTaskGroups.length}`} // Force re-render when orientation or data changes
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    localStyles.taskGroupCard,
                    isLandscape ? localStyles.landscapeCard : localStyles.portraitCard,
                    // eslint-disable-next-line react-native/no-inline-styles
                    { opacity: item.isActive ? 1 : 0.5 }
                  ]}
                  onPress={() => handleTaskGroupPress(item)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Task group: ${item.name}. ${item.isPrivate ? 'Private' : 'Public'}. ${item.isActive ? 'Active' : 'Inactive'}`}
                  accessibilityHint="Tap to edit this task group"
                >
                  <View style={localStyles.taskGroupContent}>
                    <View style={localStyles.cardHeader}>
                      <Text style={localStyles.cardTitle}>
                        {item.name}
                      </Text>
                      <Text variant='bodySmall' style={localStyles.visibilityText}>
                        {item.isPrivate ? 'Private' : 'Public'}
                      </Text>
                    </View>
                    {item.description && (
                      <Text variant='bodySmall' style={localStyles.cardDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={localStyles.taskGroupMeta}>
                      <Text variant='bodySmall' style={localStyles.metaText}>
                        {item.kinds?.length || 0} kinds
                      </Text>
                      <Text variant='bodySmall' style={[localStyles.metaText, { color: item.isActive ? colors.success : colors.textSecondary }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                localStyles.taskGroupListContent, 
                localStyles.contentWithFabPadding,
                isLandscape ? localStyles.landscapeContent : localStyles.portraitContent
              ]}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={localStyles.loadingMore}>
                    <Text variant='bodyMedium'>Loading more task groups...</Text>
                  </View>
                ) : null
              }
            />
        )}
      </View>
    </View>
  );
});

export default function TaskGroupsScreen({ navigation }: TaskGroupsScreenProps) {
  const { user } = useAuth();
  const taskGroupsDisplayRef = React.useRef<{ refresh: () => void, setShouldRefresh: (value: boolean) => void }>(null);
  
  // Detect orientation
  const [screenData, setScreenData] = useState(Dimensions.get('screen'));
  const isLandscape = screenData.width > screenData.height;
  
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.screen);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const handleNewTaskGroup = () => {
    // Set the flag via ref to refresh when we return
    if (taskGroupsDisplayRef.current) {
      taskGroupsDisplayRef.current.setShouldRefresh(true);
    }
    navigation.navigate('TaskGroupEdit', {});
  };
  
  return (
    <>
      <View style={[
        localStyles.screenContainer,
        isLandscape ? localStyles.landscapeContainer : localStyles.portraitContainer
      ]}>
        <TaskGroupsDisplay 
          user={user} 
          navigation={navigation} 
          isLandscape={isLandscape}
          // @ts-ignore - ref prop type issue in newer TypeScript versions
          ref={taskGroupsDisplayRef}
        />
      </View>
      <FAB
        icon="plus"
        style={[
          localStyles.fab,
          isLandscape && localStyles.fabLandscape
        ]}
        onPress={handleNewTaskGroup}
        // label="Add Group"
        color="white"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add new task group"
        accessibilityHint="Tap to create a new task group"
      />
    </>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
    minHeight: 58,
  },
  searchBar: {
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
  },
  searchInput: {
    fontSize: 12,
    color: colors.textPrimary,
    minHeight: 46,
    maxHeight: 46,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  taskGroupListContainer: {
    flex: 1,
  },
  taskGroupListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptySubText: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  taskGroupCard: {
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
    marginHorizontal: 0, // No horizontal margin for single column
  },
  // Card layout variations - single column layout
  portraitCard: {
    // Single column - no additional styles needed
  },
  landscapeCard: {
    // Single column - no additional styles needed
  },
  taskGroupContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  visibilityText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'right',
  },
  cardDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
    fontSize: 12,
  },
  taskGroupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto', // Push to bottom of card
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    alignContent: 'stretch',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingIndicator: {
    backgroundColor: colors.backgroundPaper,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  debugInfo: {
    backgroundColor: colors.accent,
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  debugText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 42, // Positioned to avoid bottom navigation
    backgroundColor: colors.accent,
  },
  fabLandscape: {
    right: 34, // Increased right margin for landscape mode
  },
  // Orientation-specific styles
  portraitContainer: {
    paddingTop: 0, // Remove gap above search bar in portrait
  },
  landscapeContainer: {
    paddingTop: 0, // No extra padding in landscape
    paddingLeft: 0, // Remove gap to the left in landscape
    paddingRight: 44, // Keep right padding for notch/safe area
  },
  portraitContent: {
    paddingHorizontal: 16, // Standard padding for single column
  },
  landscapeContent: {
    paddingHorizontal: 24, // More padding for landscape to center content better
  },
  // Search container orientation styles
  portraitSearch: {
    paddingTop: 16, // Keep some padding for visual breathing room
  },
  landscapeSearch: {
    paddingTop: 8,
    paddingLeft: 16, // Ensure consistent padding from left edge
  },
  // Content padding for FAB
  contentWithFabPadding: {
    paddingBottom: 120,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
    marginHorizontal: 16,
  },
});
