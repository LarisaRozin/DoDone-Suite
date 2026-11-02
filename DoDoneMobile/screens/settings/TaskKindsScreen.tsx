/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Searchbar, FAB, Snackbar } from 'react-native-paper';
import { Text } from '../../components/StyledText';
import { colors, fonts } from '../../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { 
  useTaskKinds, 
  TaskKindDetailsResponse, 
  PagedListRequestBuilder,
  useAuth,
  TaskGroupDetailsResponse,
  API_ROUTES,
  useConfig,
  DataResponse
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TaskKindsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskKinds'>;
type TaskKindsScreenRouteProp = RouteProp<RootStackParamList, 'TaskKinds'>;

interface TaskKindsScreenProps {
  navigation: TaskKindsScreenNavigationProp;
  route: TaskKindsScreenRouteProp;
}

export default function TaskKindsScreen({ navigation, route }: TaskKindsScreenProps) {
  const { groupId, groupName, savedTaskKind } = route.params;
  const { bottom, right } = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const taskKindsDisplayRef = React.useRef<{ refresh: () => void }>(null);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Helper function to show snackbar messages
  const showSnackbar = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  }, []);

  // State for task group details
  const [taskGroup, setTaskGroup] = useState<TaskGroupDetailsResponse | null>(null);

  // Helper function to determine if user can edit (create/modify task kinds)
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

  // Fetch task group details
  const fetchTaskGroupDetails = React.useCallback(async () => {
    if (!groupId || !token) return;
    
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.get<DataResponse<TaskGroupDetailsResponse>>(API_ROUTES.taskGroups.getDetails(groupId));
      if (!response.success)
      {
        console.error('Failed to fetch task group details:', response);
        showSnackbar('Failed to load task group details', 'error');
        setTaskGroup(null);
      }
      setTaskGroup(response.data);
    } catch (err) {
      console.error('Error fetching task group details:', err);
      showSnackbar('An error occurred while loading task group details', 'error');
    }
  }, [groupId, baseUrl, token, showSnackbar]);

  // Load task group details on mount
  useEffect(() => {
    fetchTaskGroupDetails();
  }, [fetchTaskGroupDetails]);

  // Handle savedTaskKind parameter from TaskKindEditScreen
  useFocusEffect(
    React.useCallback(() => {
      if (savedTaskKind) {
        if (taskKindsDisplayRef.current) {
          taskKindsDisplayRef.current.refresh();
        }
        // Clear the savedTaskKind param to prevent processing it again
        navigation.setParams({ savedTaskKind: undefined });
      }
    }, [savedTaskKind, navigation])
  );

  const handleNewTaskKind = () => {
    navigation.navigate('TaskKindEdit', { 
      groupId 
    });
  };

  return (
    <>
      <View style={localStyles.screenContainer}>
        <TaskKindsDisplay 
          groupId={groupId}
          groupName={groupName}
          navigation={navigation}
          // @ts-ignore - ref prop type issue in newer TypeScript versions
          ref={taskKindsDisplayRef}
        />
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          localStyles.snackbar,
          { marginBottom: bottom + 16 },
          snackbarType === 'success' && localStyles.snackbarSuccess,
          snackbarType === 'error' && localStyles.snackbarError,
        ]}
        theme={{
          colors: {
            surface: snackbarType === 'success' 
              ? colors.success 
              : snackbarType === 'error' 
                ? colors.error 
                : colors.primary,
            onSurface: colors.textOnPrimary,
          }
        }}
      >
        {snackbarMessage}
      </Snackbar>

      {canEdit && (
        <FAB
          mode="flat"
          size="medium"
          icon="plus"
          onPress={handleNewTaskKind}
          style={[localStyles.fab, { bottom: bottom + 16, right: right + 16, backgroundColor: colors.accent }]}
          color="white"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new task kind"
          accessibilityHint="Tap to create a new task kind"
        />
      )}
    </>
  );
}

const TaskKindsDisplay = React.forwardRef<
  { refresh: () => void },
  { groupId: number, groupName: string, navigation: TaskKindsScreenNavigationProp }
>(({ groupId, groupName, navigation }, ref) => {
  
  const { right: rightInset } = useSafeAreaInsets();
  
  const [pagedRequest, setPagedRequest] = useState(() => 
    new PagedListRequestBuilder()
      .setParentId(groupId)
      .setPaging(1, 50) // Get more items since task kinds are typically fewer
      .build()
  );
  
  const { pagedTaskKinds, loading, refreshTaskKinds } = useTaskKinds(pagedRequest);
  
  // State for accumulated task kinds and pagination
  const [allTaskKinds, setAllTaskKinds] = useState<TaskKindDetailsResponse[]>([]);
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
      .setParentId(groupId)
      .setPaging(page, 50);
    
    if (searchTerm.trim()) {
      requestBuilder.setSearch(searchTerm.trim());
    }
    
    return requestBuilder.build();
  }, [groupId]);

  // Load task kinds when debounced search query changes
  useEffect(() => {
    setAllTaskKinds([]); // Reset accumulated data for new search
    const searchRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(searchRequest);
    refreshTaskKinds(searchRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, createPagedRequest]);

  // Function to refresh the task kinds list
  const refreshTaskKindsData = React.useCallback(() => {
    setAllTaskKinds([]); // Reset accumulated data to refresh the view
    const resetRequest = createPagedRequest(1, debouncedSearchQuery);
    setPagedRequest(resetRequest);
    refreshTaskKinds(resetRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPagedRequest, debouncedSearchQuery]);



  // Effect to handle data accumulation and pagination state
  useEffect(() => {
    if (pagedTaskKinds) {
      const currentPage = pagedTaskKinds.paging.currentPage;
      const hasNext = pagedTaskKinds.paging.hasNext;
      
      if (currentPage === 1) {
        // First page - replace all data
        setAllTaskKinds(pagedTaskKinds.data);
        // Stop refreshing when new data arrives on first page
        setIsRefreshing(false);
      } else {
        // Subsequent pages - append data
        setAllTaskKinds(prev => [...prev, ...pagedTaskKinds.data]);
      }
      
      setHasNextPage(hasNext);
      setIsLoadingMore(false);
    }
  }, [pagedTaskKinds]);

  // Use accumulated task kinds for display
  const displayTaskKinds = allTaskKinds;

  const handleTaskKindPress = (taskKind: TaskKindDetailsResponse) => {
    navigation.navigate('TaskKindEdit', { 
      taskKind, 
      groupId 
    });
  };

  const handleLoadMore = () => {
    if (!hasNextPage || isLoadingMore || loading || !pagedTaskKinds) {
      return;
    }

    const nextPage = pagedTaskKinds.paging.currentPage + 1;
    const nextPageRequest = createPagedRequest(nextPage, debouncedSearchQuery);
    if (nextPageRequest) {
      setIsLoadingMore(true);
      setPagedRequest(nextPageRequest);
      refreshTaskKinds(nextPageRequest);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshTaskKindsData();
  };

  // Expose refresh function to parent component
  React.useImperativeHandle(ref, () => ({
    refresh: refreshTaskKindsData
  }), [refreshTaskKindsData]);

  return (
    <View style={[localStyles.container, { marginRight: rightInset }]}>
      {/* Search Bar */}
      <View style={localStyles.searchContainer}>
        <Searchbar
          placeholder="Search task kinds..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={localStyles.searchBar}
          inputStyle={localStyles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.textSecondary}
          accessible={true}
          accessibilityRole="search"
          accessibilityLabel="Search task kinds"
          accessibilityHint="Enter text to search for task kinds"
        />
      </View>

      {/* Loading Indicator - positioned below search bar */}
      {loading && (
        <View style={localStyles.loadingIndicator}>
          <Text variant='bodyMedium' style={localStyles.loadingText}>Loading task kinds...</Text>
        </View>
      )}

      {/* Scrollable Task Kind List - Full width */}
      <View style={localStyles.taskKindListContainer}>
        {displayTaskKinds.length === 0 ? (
          <View style={localStyles.emptyState}>
            <Text variant='titleMedium' style={{ color: colors.textSecondary }}>
              {searchQuery.trim() ? 'No matching task kinds found' : `No task kinds found for ${groupName}. Add some to get started.`}
            </Text>
            {searchQuery.trim() && (
              <Text variant='bodyMedium' style={localStyles.emptySubText}>
                Try adjusting your search terms
              </Text>
            )}
          </View>
        ) : (
            <FlatList
              data={displayTaskKinds}
              keyExtractor={(item) => item.id.toString()}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    localStyles.taskKindCard,
                    // eslint-disable-next-line react-native/no-inline-styles
                    { opacity: item.isActive ? 1 : 0.5 }
                  ]}
                  onPress={() => handleTaskKindPress(item)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Task kind: ${item.name}. ${item.description ? item.description + '. ' : ''}${item.isActive ? 'Active' : 'Inactive'}`}
                  accessibilityHint="Tap to edit this task kind"
                >
                  <View style={localStyles.taskKindContent}>
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
                    <View style={localStyles.taskKindMeta}>
                      <Text variant='bodySmall' style={localStyles.metaText}>
                        {item.categories?.length || 0} categories
                      </Text>
                      <Text variant='bodySmall' style={[localStyles.metaText, { color: item.isActive ? colors.success : colors.textSecondary }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={localStyles.taskKindListContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={localStyles.loadingMore}>
                    <Text variant='bodyMedium'>Loading more task kinds...</Text>
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
  taskKindListContainer: {
    flex: 1,
  },
  taskKindListContent: {
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
  taskKindCard: {
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
  taskKindContent: {
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
  taskKindMeta: {
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
  snackbar: {
    borderRadius: 12,
  },
  snackbarSuccess: {
    backgroundColor: colors.success,
  },
  snackbarError: {
    backgroundColor: colors.error,
  },
});
