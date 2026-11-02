/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, useWindowDimensions, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { Snackbar } from '../../components/StyledText';
import { Text, Card } from '../../components/StyledText';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, User, PagedListRequestBuilder, SortDirection, useTeam } from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import config from '../../config/config';
import UserAvatar from '../../components/UserAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { colors, styles } from '../../defaultTheme';
import { UpgradeModal } from '../../components/UpgradeModal';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSubscriptionCheck } from '../../hooks/useSubscriptionCheck';

type TeamScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Team'>;

interface TeamScreenProps {
  navigation: TeamScreenNavigationProp;
}

export default function TeamScreen({ navigation }: TeamScreenProps) {
  const { user, token } = useAuth();
  const { width, height } = useWindowDimensions();
  const { bottom, right } = useSafeAreaInsets();
  const isLandscape = width > height;
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { limits } = useSubscription();

  // Initialize useTeam hook to get team details
  const teamRequest = useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { teamDetails, fetchTeamDetails } = useTeam(teamRequest);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const apiClient = createApiClient(config.API_BASE_URL, token || '');

  // Load team details when component mounts or user changes
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000); // 1000ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load team members when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
    setHasNextPage(true);
    setTeamMembers([]);
    loadTeamMembers(debouncedSearchQuery, 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const loadTeamMembers = async (searchTerm: string = '', page: number = 1, replace: boolean = false) => {
    if (!user?.teamId) {
      setError(`No ${teamDetails?.isBusiness ? 'team' : 'family'} selected`);
      return;
    }
    if (page === 1) setLoading(true);
    setError('');
    try {
      const requestBuilder = new PagedListRequestBuilder()
        .setPaging(page, 10)
        .setSorting('firstName', SortDirection.Ascending);
      if (searchTerm.trim()) {
        requestBuilder.setSearch(searchTerm.trim());
      }
      const requestToFetch = requestBuilder.build();
      const data = await apiClient.teams.getTeamMembers(
        requestToFetch
      );
      if (!data || data.success === false) {
        console.error(`Failed to fetch ${teamDetails?.isBusiness ? 'team' : 'family'} members:`, data?.message || "Unknown error");
        setError(`Error loading ${getMembersLabel()}`);
        setHasNextPage(false);
        return;
      }
      setHasNextPage(data.paging?.hasNext ?? false);
      setCurrentPage(page);
      if (replace) {
        setTeamMembers(data.data || []);
      } else {
        setTeamMembers(prev => [...prev, ...(data.data || [])]);
      }
    } catch (err) {
      console.error(`Error loading ${teamDetails?.isBusiness ? 'team' : 'family'} members:`, err);
      setError(`Error loading ${getMembersLabel()}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setCurrentPage(1);
      setHasNextPage(true);
      setTeamMembers([]);
      loadTeamMembers(debouncedSearchQuery, 1, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery])
  );

  // const handleRefresh = () => {
  //   setRefreshing(true);
  //   loadTeamMembers();
  // };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasNextPage(true);
    setTeamMembers([]);
    loadTeamMembers(debouncedSearchQuery, 1, true);
  };

  const handleLoadMore = () => {
    if (!hasNextPage || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    loadTeamMembers(debouncedSearchQuery, currentPage + 1, false);
  };

  const getUserDisplayName = (member: User) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.userName;
  };

  const handleMemberPress = (member: User) => {
    navigation.navigate('TeamMemberEdit', { user: member, isNew: false });
  };

  const { checkCanAddTeamMember, upgradeModalVisible, hideUpgradeModal  } = useSubscriptionCheck();

  const handleAddMember = async () => {
    const canAdd = await checkCanAddTeamMember({ showUpgradeModal: true });
    if (!canAdd) return;

    navigation.navigate('TeamMemberEdit', { isNew: true });
  };

  const handleTeamPreferences = () => {
    navigation.navigate('TeamPreferences');
  };

  // Helper function to get the correct text based on team type
  const getSearchPlaceholder = () => {
    return teamDetails?.isBusiness ? 'Search team members...' : 'Search family members...';
  };

  const getMembersLabel = () => {
    return teamDetails?.isBusiness ? 'team members' : 'family members';
  };

  if (loading && !refreshing && teamMembers.length === 0) {
    return (
      <View style={localStyles.screenContainer}>
        <View style={localStyles.loadingContainer}>
          <Text style={styles.primarySubtitle}>Loading {getMembersLabel()}...</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: User }) => (
    <Card
      key={item.id}
      style={[
        localStyles.memberCard,
        !item.isActive && localStyles.inactiveMemberCard
      ]}
      onPress={() => handleMemberPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${getUserDisplayName(item)}${!item.isActive ? ' (inactive)' : ''}${item.isAdmin ? ' (admin)' : ''}`}
      accessibilityHint="Tap to view and edit member details"
      accessibilityState={{ disabled: !item.isActive }}
    >
      <Card.Content style={localStyles.memberCardContent}>
        <UserAvatar
          size={60}
          imageUri={item.avatarUri}
          firstName={item.firstName}
          lastName={item.lastName}
          userName={item.userName}
          style={[
            localStyles.memberAvatar,
            item.isAdmin && localStyles.adminAvatar,
            !item.isActive && localStyles.inactiveAvatar
          ]}
          labelStyle={[
            localStyles.avatarLabel,
            !item.isActive && localStyles.inactiveAvatarLabel
          ]}
        />
        <Text style={localStyles.memberName} numberOfLines={1}>
          {getUserDisplayName(item)}
        </Text>
        <Text style={localStyles.memberUsername} numberOfLines={1}>
          @{item.userName}
        </Text>
        <View style={localStyles.badgeContainer}>
          {item.isAdmin && (
            <View style={[localStyles.badge, localStyles.businessBadge]}>
              <Text style={localStyles.badgeText}>Admin</Text>
            </View>
          )}
          {!item.isActive && (
            <View style={[localStyles.badge, localStyles.inactiveBadge]}>
              <Text style={localStyles.badgeText}>Inactive</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={localStyles.screenContainer}>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={5000}
        style={localStyles.errorSnackbar}
      >
        {error}
      </Snackbar>

      {/* Search Bar */}
      <View style={localStyles.searchContainer}>
        <Searchbar
          placeholder={getSearchPlaceholder()}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            localStyles.searchBar,
            isLandscape && localStyles.searchBarLandscape
          ]}
          inputStyle={localStyles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.textSecondary}
          accessibilityRole="search"
          accessibilityLabel={getSearchPlaceholder()}
          accessibilityHint="Type to search for team members"
        />
      </View>

      {limits && !limits.teamMembersLimit.canAdd && limits.teamMembersLimit.max > 0 && teamMembers.length >= limits.teamMembersLimit.max && (
        <TouchableOpacity onPress={() => setShowUpgradeModal(true)} activeOpacity={0.7}>
          <Card style={localStyles.warningCard}>
            <Card.Content style={localStyles.warningCardContent}>
              <Text style={localStyles.warningText}>
                🔒 First {`${limits.teamMembersLimit.max}`} active {teamDetails?.isBusiness ? 'team members' : 'family members'} will be available in your current subscription tier. Please mark 'Active' up to {limits.teamMembersLimit.max} members you want to use and deactivate the rest, or upgrade to Pro for unlimited access. Tap to upgrade.
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      )}

      {teamMembers.length === 0 ? (
        <View style={localStyles.emptyContainer}>
          <Text style={styles.primarySubtitle}>
            {searchQuery.trim() ? `No matching ${getMembersLabel()}` : `No ${getMembersLabel()} found`}
          </Text>
          <Text style={localStyles.emptyText}>
            {searchQuery.trim()
              ? 'Try adjusting your search terms'
              : `Get started by adding your first ${teamDetails?.isBusiness ? 'team member' : 'family member'}`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={teamMembers}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={localStyles.scrollContent}
          columnWrapperStyle={localStyles.membersGrid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={localStyles.loadingMoreFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={localStyles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {user?.isAdmin === false ? (
        // Non-admin users get a simple FAB with only Team/Family Preferences
        <FAB
          icon="cog"
          onPress={handleTeamPreferences}
          style={[
            localStyles.singleFab,
            { right: right + 28, bottom: bottom + 28 }
          ]}
          color="white"
          accessibilityRole="button"
          accessibilityLabel={`${teamDetails?.isBusiness ? 'Team' : 'Family'} Preferences`}
          accessibilityHint="Manage team preferences and settings"
        />
      ) : (
        <FAB.Group
          open={fabOpen}
          visible={true}
          icon={fabOpen ? 'close' : 'dots-vertical'}
          actions={[
            {
              icon: 'account-plus',
              label: `Add ${teamDetails?.isBusiness ? 'Team Member' : 'Family Member'}`,
              onPress: handleAddMember,
              style: { backgroundColor: colors.secondary },
              labelStyle: { textAlign: 'right' },
              color: 'white',
              accessibilityLabel: `Add ${teamDetails?.isBusiness ? 'Team Member' : 'Family Member'}`,
              accessibilityHint: 'Create a new team member account'
            },
            {
              icon: 'cog',
              label: `${teamDetails?.isBusiness ? 'Team' : 'Family'} Preferences`,
              onPress: handleTeamPreferences,
              style: { backgroundColor: colors.primary },
              labelStyle: { textAlign: 'right' },
              color: 'white',
              accessibilityLabel: `${teamDetails?.isBusiness ? 'Team' : 'Family'} Preferences`,
              accessibilityHint: 'Manage team preferences and settings'
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={{ paddingBottom: bottom + 16, paddingRight: right + 16 }}
          fabStyle={{ backgroundColor: colors.accent }}
          color="white"
          accessibilityLabel={fabOpen ? 'Close menu' : 'Open team actions menu'}
        />
      )}

      <UpgradeModal
        visible={upgradeModalVisible || showUpgradeModal}
        onClose={() => upgradeModalVisible ? hideUpgradeModal() : setShowUpgradeModal(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  searchBarLandscape: {
    // Remove extra right margin for landscape mode
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
  errorSnackbar: {
    backgroundColor: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32, // Keep horizontal padding for content
    marginHorizontal: 12, // Add back the margin that was removed from parent
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 12, // Add back horizontal padding for content
  },
  scrollContent: {
    paddingBottom: 120, // Add padding to ensure content is visible above FAB and bottom navigation
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  membersGridSingle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  memberCard: {
    width: '45%',
    minWidth: 140,
    maxWidth: 180,
    marginVertical: 8,
    backgroundColor: colors.backgroundPaper,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  inactiveMemberCard: {
    opacity: 0.7,
    backgroundColor: colors.backgroundDefault,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  memberCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  memberAvatar: {
    backgroundColor: colors.avatarBg,
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    marginBottom: 8,
  },
  adminAvatar: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  inactiveAvatar: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  avatarLabel: {
    color: colors.primaryContrastText,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Fredoka-Regular',
  },
  inactiveAvatarLabel: {
    color: colors.textSecondary,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  memberUsername: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  adminBadge: {
    backgroundColor: colors.warning,
  },
  businessBadge: {
    backgroundColor: colors.secondary,
  },
  inactiveBadge: {
    backgroundColor: colors.error,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingMoreFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
  },
  singleFab: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  warningCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF3E0', // Light orange background
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FF9800', // Orange border
    elevation: 2,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  warningCardContent: {
    padding: 12,
  },
  warningText: {
    color: '#E65100', // Dark orange text
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'left',
  },
});