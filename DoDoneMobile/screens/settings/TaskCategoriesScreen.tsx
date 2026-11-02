/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { Text } from '../../components/StyledText';
import { colors, fonts } from '../../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  useTaskCategories, 
  TaskCategoryDetailsResponse, 
  PagedListRequestBuilder,
  useAuth,
  TaskKindDetailsResponse,
  TaskGroupDetailsResponse,
  API_ROUTES,
  useConfig,
  DataResponse
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateForDisplay } from '../../utils/dateUtils';

type TaskCategoriesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskCategories'>;
type TaskCategoriesScreenRouteProp = RouteProp<RootStackParamList, 'TaskCategories'>;

interface TaskCategoriesScreenProps {
  navigation: TaskCategoriesScreenNavigationProp;
  route: TaskCategoriesScreenRouteProp;
}

export default function TaskCategoriesScreen({ navigation, route }: TaskCategoriesScreenProps) {
  const { kindId, kindName, savedTaskCategory } = route.params;
  const { bottom, right } = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const taskCategoriesDisplayRef = React.useRef<{ refresh: () => void }>(null);

  // State for task kind and task group details
  const [_taskKind, setTaskKind] = useState<TaskKindDetailsResponse | null>(null);
  const [taskGroup, setTaskGroup] = useState<TaskGroupDetailsResponse | null>(null);

  // Helper function to determine if user can edit (create categories)
  const canEdit = React.useMemo(() => {
    // If no user or task group loaded yet, don't allow editing
    if (!user || !taskGroup) return false;
    
    // If user is admin, always allow editing
    if (user.isAdmin === true) return true;
    
    // If user is not admin, check if they created the task group
    if (user.isAdmin === false) {
      return taskGroup.userId === user.id;
    }
    
    return true; // Default to allowing editing
  }, [user, taskGroup]);

  // Fetch task kind details to get the group ID
  const fetchTaskKindDetails = React.useCallback(async () => {
    if (!kindId || !token) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.get<DataResponse<TaskKindDetailsResponse>>(API_ROUTES.taskKinds.getDetails(kindId));
      setTaskKind(response.data);
      
      // Once we have the task kind, fetch the task group details
      if (response.data.groupId) {
        const groupResponse = await apiClient.get<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.getDetails(response.data.groupId));
        setTaskGroup(groupResponse.data);
      }
    } catch (err) {
      console.error('Error fetching task kind details:', err);
      setTaskKind(null);
      setTaskGroup(null);
    }
  }, [kindId, baseUrl, token]);

  // Load task kind and task group details on mount
  React.useEffect(() => {
    fetchTaskKindDetails();
  }, [fetchTaskKindDetails]);

  // Handle savedTaskCategory parameter from TaskCategoryEditScreen
  useFocusEffect(
    React.useCallback(() => {
      if (savedTaskCategory) {
        if (taskCategoriesDisplayRef.current) {
          taskCategoriesDisplayRef.current.refresh();
        }
        // Clear the savedTaskCategory param to prevent processing it again
        navigation.setParams({ savedTaskCategory: undefined });
      }
    }, [savedTaskCategory, navigation])
  );

  const handleNewTaskCategory = () => {
    navigation.navigate('TaskCategoryEdit', { 
      kindId 
    });
  };

  return (
    <>
      <View style={localStyles.screenContainer}>
        <TaskCategoriesDisplay 
          kindId={kindId}
          kindName={kindName}
          navigation={navigation}
          // @ts-ignore - ref prop type issue in newer TypeScript versions
          ref={taskCategoriesDisplayRef}
        />
      </View>
      {canEdit && (
        <FAB
          mode="flat"
          size="medium"
          icon="plus"
          onPress={handleNewTaskCategory}
          style={[localStyles.fab, { bottom: bottom + 16, right: right + 16, backgroundColor: colors.accent }]}
          color="white"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new task category"
          accessibilityHint="Tap to create a new task category"
        />
      )}
    </>
  );
}

const TaskCategoriesDisplay = React.forwardRef<
  { refresh: () => void },
  { kindId: number, kindName: string, navigation: TaskCategoriesScreenNavigationProp }
>(({ kindId, kindName, navigation }, ref) => {
  
  const { right: rightInset } = useSafeAreaInsets();
  
  const [pagedRequest, setPagedRequest] = useState(() => 
    new PagedListRequestBuilder()
      .setParentId(kindId)
      .setPaging(1, 50) // Get more items since task categories are typically fewer
      .build()
  );
  
  const { pagedTaskCategories, loading, refreshTaskCategories } = useTaskCategories(pagedRequest);
  
  // State for accumulated task categories and pagination
  const [allTaskCategories, setAllTaskCategories] = useState<TaskCategoryDetailsResponse[]>([]);
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
      .setParentId(kindId)
      .setPaging(page, 50);
    
    if (searchTerm.trim()) {
      requestBuilder.setSearch(searchTerm.trim());
    }
    
    return requestBuilder.build();
  }, [kindId]);

  // Load task categories when debounced search query changes
  useEffect(() => {
    setAllTaskCategories([]); // Reset accumulated data for new search
    const searchRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(searchRequest);
    refreshTaskCategories(searchRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, createPagedRequest]);

  // Function to refresh the task categories list
  const refreshTaskCategoriesData = React.useCallback(() => {
    setAllTaskCategories([]); // Reset accumulated data to refresh the view
    const resetRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(resetRequest);
    refreshTaskCategories(resetRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPagedRequest, debouncedSearchQuery]);



  // Effect to handle data accumulation and pagination state
  useEffect(() => {
    if (pagedTaskCategories) {
      const currentPage = pagedTaskCategories.paging.currentPage;
      const hasNext = pagedTaskCategories.paging.hasNext;
      
      if (currentPage === 1) {
        // First page - replace all data
        setAllTaskCategories(pagedTaskCategories.data);
        // Stop refreshing when new data arrives on first page
        setIsRefreshing(false);
      } else {
        // Subsequent pages - append data
        setAllTaskCategories(prev => [...prev, ...pagedTaskCategories.data]);
      }
      
      setHasNextPage(hasNext);
      setIsLoadingMore(false);
    }
  }, [pagedTaskCategories]);

  // Use accumulated task categories for display
  const displayTaskCategories = allTaskCategories;

  const handleTaskCategoryPress = (taskCategory: TaskCategoryDetailsResponse) => {
    navigation.navigate('TaskCategoryEdit', { 
      taskCategory, 
      kindId 
    });
  };

  const handleLoadMore = () => {
    if (!hasNextPage || isLoadingMore || loading || !pagedTaskCategories) {
      return;
    }

    const nextPage = pagedTaskCategories.paging.currentPage + 1;
    const nextPageRequest = createPagedRequest(nextPage, debouncedSearchQuery);
    if (nextPageRequest) {
      setIsLoadingMore(true);
      setPagedRequest(nextPageRequest);
      refreshTaskCategories(nextPageRequest);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshTaskCategoriesData();
  };

  // Expose refresh function to parent component
  React.useImperativeHandle(ref, () => ({
    refresh: refreshTaskCategoriesData
  }), [refreshTaskCategoriesData]);

  return (
    <View style={[localStyles.container, { marginRight: rightInset }]}>
      {/* Search Bar */}
      <View style={localStyles.searchContainer}>
        <Searchbar
          placeholder="Search task categories..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={localStyles.searchBar}
          inputStyle={localStyles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.textSecondary}
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel="Search task categories"
          accessibilityHint="Enter text to search for task categories"
        />
      </View>

      {/* Loading Indicator - positioned below search bar */}
      {loading && (
        <View style={localStyles.loadingIndicator}>
          <Text variant='bodyMedium' style={localStyles.loadingText}>Loading task categories...</Text>
        </View>
      )}

      {/* Scrollable Task Category List - Full width */}
      <View style={localStyles.taskCategoryListContainer}>
        {displayTaskCategories.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Text variant='titleMedium' style={{ color: colors.textSecondary }}>
              {searchQuery.trim() ? 'No matching task categories found' : `No task categories found for task kind '${kindName}'. Add some to get started.`}
            </Text>
            {searchQuery.trim() && (
              <Text variant='bodyMedium' style={localStyles.emptySubText}>
                Try adjusting your search terms
              </Text>
            )}
          </View>
        ) : (
            <FlatList
              data={displayTaskCategories}
              keyExtractor={(item) => item.id.toString()}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    localStyles.taskCategoryCard,
                    // eslint-disable-next-line react-native/no-inline-styles
                    { opacity: item.isActive ? 1 : 0.5 }
                  ]}
                  onPress={() => handleTaskCategoryPress(item)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Task category: ${item.name}. ${item.description ? item.description + '. ' : ''}${item.isActive ? 'Active' : 'Inactive'}`}
                  accessibilityHint="Tap to edit this task category"
                >
                  <View style={localStyles.taskCategoryContent}>
                    <View style={localStyles.cardHeader}>
                      <Text style={localStyles.cardTitle}>
                        {item.name}
                      </Text>
                    </View>
                    {item.description && (
                      <Text variant='bodySmall' style={localStyles.cardDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={localStyles.taskCategoryMeta}>
                      <Text variant='bodySmall' style={localStyles.metaText}>
                        Created: {formatDateForDisplay(item.createdAt)}
                      </Text>
                      <Text variant='bodySmall' style={[localStyles.metaText, { color: item.isActive ? colors.success : colors.textSecondary }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={localStyles.taskCategoryListContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={localStyles.loadingMore}>
                    <Text variant='bodyMedium'>Loading more task categories...</Text>
                  </View>
                ) : null
              }
            />
        )}
      </View>
    </View>
  );
});

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
  taskCategoryListContainer: {
    flex: 1,
  },
  taskCategoryListContent: {
    paddingBottom: 140,
    paddingHorizontal: 16,
    paddingTop: 8,
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
  taskCategoryCard: {
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
  taskCategoryContent: {
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
  cardDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 16,
    fontSize: 12,
  },
  taskCategoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom of card
  },
  metaText: {
    color: colors.textSecondary,
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
  fab: {
    position: 'absolute',
  },
});
