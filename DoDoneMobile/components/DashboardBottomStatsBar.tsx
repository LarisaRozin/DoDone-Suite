/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Secondary Stats Bar Component
 * Displays stats like Needs Review, Bonus, Cash, GPA, and Credits
 * @format
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Icon, Snackbar, Portal } from 'react-native-paper';
import { Text } from './StyledText';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../defaultTheme';
import { AllowanceStats, BonusStats, TaskItemBonusStatusFilter, TaskItemNeedReviewStatusFilter, User, useTeam, useAuth, PagedListRequestBuilder, SortDirection, AllowanceHistoryResponse, AllowanceHistoryApprovalRequest, useAllowanceHistories } from '@larisarozin/dodone-shared';
import { formatDateForDisplay } from '../utils/dateUtils';
import { debounceGesture } from '../utils/gestureUtils';
import AllowanceHistoryModal from './AllowanceHistoryModal';
import { AllowanceApprovalModal } from './AllowanceApprovalModal';
import BonusFilterMenu from './BonusFilterModal';

interface DashboardBottomStatsBarProps {
  user?: User;
  allowanceStats?: AllowanceStats[];
  bonusStats?: BonusStats;
  allowanceIntervalIndex: number;
  onIntervalChange: (index: number) => void; 
  onNeedReviewFilterStatusChange: (value: TaskItemNeedReviewStatusFilter) => void;
  needReviewFilterStatus: TaskItemNeedReviewStatusFilter;
  onBonusStatusFilterChange: (value: TaskItemBonusStatusFilter) => void;
  bonusStatusFilter: TaskItemBonusStatusFilter;
  showAllowanceModal?: boolean; 
  onAllowanceModalShown?: () => void; 
  onAllowanceModalClosed?: () => void;
  highlightAllowanceId?: string; 
  shouldShowBonusModal?: boolean;
}

const DashboardBottomStatsBar = ({ 
  user: _user,
  allowanceStats,
  bonusStats: _bonusStats,
  allowanceIntervalIndex,
  onIntervalChange: onAllowanceIntervalChange,
  onNeedReviewFilterStatusChange,
  needReviewFilterStatus = TaskItemNeedReviewStatusFilter.Any,
  onBonusStatusFilterChange,
  bonusStatusFilter = TaskItemBonusStatusFilter.Any,
  showAllowanceModal = false,
  onAllowanceModalShown,
  onAllowanceModalClosed,
  highlightAllowanceId: _highlightAllowanceId,
  shouldShowBonusModal = false
}: DashboardBottomStatsBarProps) => {
  const { bottom, right, left } = useSafeAreaInsets();
  const [isAllowanceHistoryModalVisible, setIsAllowanceHistoryModalVisible] = useState(false);
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<AllowanceHistoryResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isApproveMode, setIsApproveMode] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBonusFilterModalVisible, setIsBonusFilterModalVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(allowanceIntervalIndex || 0);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Team functionality for dynamic terminology
  useAuth();
  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );
  const { teamDetails, fetchTeamDetails } = useTeam(teamRequest);

  // Load team details and allowance intervals when component mounts
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  // Helper function for dynamic allowance terminology
  const getAllowanceLabel = useCallback(() => {
    return teamDetails?.isBusiness ? 'Incentives' : 'Allowances';
  }, [teamDetails?.isBusiness]);

  // Helper function to show snackbar messages
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  }, []);

  // Get current allowance stats based on selected interval
  const currentAllowanceStats = React.useMemo(() => {
    if (!allowanceStats || allowanceStats.length === 0) return null;
    return allowanceStats[currentIntervalIndex] || allowanceStats[0];
  }, [allowanceStats, currentIntervalIndex]);


  // Navigation functions for intervals
  const navigateToPreviousInterval = useCallback(() => {
    const newIndex = currentIntervalIndex > 0 ? currentIntervalIndex - 1 : (allowanceStats?.length || 1) - 1;
    setCurrentIntervalIndex(newIndex);
    onAllowanceIntervalChange(newIndex);
  }, [currentIntervalIndex, allowanceStats?.length, onAllowanceIntervalChange]);

  const navigateToNextInterval = useCallback(() => {
    const newIndex = currentIntervalIndex < (allowanceStats?.length || 1) - 1 ? currentIntervalIndex + 1 : 0;
    setCurrentIntervalIndex(newIndex);
    onAllowanceIntervalChange(newIndex);
  }, [currentIntervalIndex, allowanceStats?.length, onAllowanceIntervalChange]);
  
  // Debounced versions to prevent rapid tapping issues
  const debouncedNavigateToPreviousInterval = React.useMemo(
    () => debounceGesture(navigateToPreviousInterval, 150),
    [navigateToPreviousInterval]
  );
  
  const debouncedNavigateToNextInterval = React.useMemo(
    () => debounceGesture(navigateToNextInterval, 150),
    [navigateToNextInterval]
  );

  // Calculate days remaining until allowance end date
  const calculateDaysRemaining = (endDate: string | undefined): number | null => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    
    // Set both dates to midnight to get accurate day difference
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const actualIntervalsCount = allowanceStats?.filter(a => a.teamAllowanceIntervalId > 0).length || 0;

  const daysRemaining = calculateDaysRemaining(currentAllowanceStats?.calculatedEndAt);
  // negative allowance interval IDs indicate no interval, so don't show days remaining
  const daysRemainingApplicable = currentAllowanceStats?.teamAllowanceIntervalId != null && 
    (currentAllowanceStats.teamAllowanceIntervalId > 0 || (currentAllowanceStats.teamAllowanceIntervalId === 0 && actualIntervalsCount > 0));

  const handleFilterPress = (value: TaskItemNeedReviewStatusFilter) => {
    needReviewFilterStatus = value;
    onNeedReviewFilterStatusChange(value);
  };

  const handleAllowanceHistoryPress = () => {
    setIsAllowanceHistoryModalVisible(true);
  };

  const handleCloseAllowanceHistoryModal = () => {
    setIsAllowanceHistoryModalVisible(false);
    // Notify parent that modal is closing so it can clear the highlight ID
    if (onAllowanceModalClosed) {
      onAllowanceModalClosed();
    }
  };

  // Use team ID from user for allowance histories
  const allowanceHistoriesRequest = useMemo(() => ({
    teamId: _user?.teamId || 0,
    paging: new PagedListRequestBuilder()
      .setPaging(1, 50)
      .setSorting('createdAt', SortDirection.Descending)
      .build().paging
  }), [_user?.teamId]);

  const { approveAllowance, refreshAllowanceHistories } = useAllowanceHistories(allowanceHistoriesRequest);

  const handleApprovalRequest = (history: AllowanceHistoryResponse, user: User, isApprove: boolean) => {
    
    setSelectedHistory(history);
    setSelectedUser(user);
    setIsApproveMode(isApprove);
    
    // Close the history modal first to avoid modal conflicts on iOS
    setIsAllowanceHistoryModalVisible(false);
    
    // Delay showing the approval modal to ensure the history modal is closed first
    setTimeout(() => {
      setIsApprovalModalVisible(true);
    }, 300); // Increased delay to ensure the history modal is fully closed
  };

  const handleApprovalSubmit = async (request: AllowanceHistoryApprovalRequest) => {
    setSubmitting(true);
    try {
      await approveAllowance(request);
      // Refresh the data after successful submission
      refreshAllowanceHistories(allowanceHistoriesRequest);
      setIsApprovalModalVisible(false);
      setSelectedHistory(null);
      setSelectedUser(undefined);
    } catch (error) {
      console.error('Error submitting approval:', error);
      throw error; // Re-throw so the modal can handle it
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalModalClose = () => {
    if (!submitting) {
      setIsApprovalModalVisible(false);
      setSelectedHistory(null);
      setSelectedUser(undefined);
      
      // Reopen the history modal after a delay to allow snackbar to be visible
      setTimeout(() => {
        setIsAllowanceHistoryModalVisible(true);
      }, 3200); // 3200ms to allow the snackbar (3000ms duration) to be visible
    }
  };

  const handleBonusesPress = () => {
    setIsBonusFilterModalVisible(true);
  };

  // Effect to handle external trigger for allowance modal
  React.useEffect(() => {
    if (showAllowanceModal) {
      setIsAllowanceHistoryModalVisible(true);
      // Call the callback to indicate the modal has been shown
      if (onAllowanceModalShown) {
        onAllowanceModalShown();
      }
    }
  }, [showAllowanceModal, onAllowanceModalShown]);

  // Effect to handle external trigger for bonus modal
  React.useEffect(() => {
    if (shouldShowBonusModal) {
      setIsBonusFilterModalVisible(true);
    }
  }, [shouldShowBonusModal]);

  // Effect to sync with parent's selected interval index
  React.useEffect(() => {
    setCurrentIntervalIndex(allowanceIntervalIndex || 0);
  }, [allowanceIntervalIndex]);

  const handleCloseBonusFilterModal = () => {
    setIsBonusFilterModalVisible(false);
    
    // Notify parent that modal is closing to help restore gesture responsiveness
    if (onAllowanceModalClosed) {
      setTimeout(() => {
        onAllowanceModalClosed();
      }, 100);
    }
  };

  const handleBonusFilterSelect = (filter: TaskItemBonusStatusFilter) => {
    onBonusStatusFilterChange(filter);
  };

  const handleInfoIconPress = () => {
    setShowTooltip(true);
    // Auto-hide tooltip after 4 seconds
    setTimeout(() => {
      setShowTooltip(false);
    }, 6000);
  };

  return (
    <>
      <View style={styles.bottomContainer}>
        {/* History Toggle Buttons - Above the stats bar */}
        <TouchableOpacity 
          style={[styles.historyToggleButton, { right: 56 + right }]} 
          onPress={handleAllowanceHistoryPress}
          activeOpacity={0.7}
        >
          <Icon
            source="history"
            color={colors.textOnSecondary}
            size={16}
          />
          <Text variant='bodySmall' style={styles.historyToggleText}>{getAllowanceLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bonusToggleButton, { left: 56 + left }]} 
          onPress={handleBonusesPress}
          activeOpacity={0.7}
        >
          <Icon
            source="diamond-stone"
            color={colors.secondary}
            size={16}
          />
          <Text variant='bodySmall' style={styles.bonusToggleText}>Bonuses </Text>
        </TouchableOpacity>
      
        <View style={[styles.secondaryStatsContainer, { paddingBottom: Math.max(6, bottom) }]}>
          {/* Interval Navigation Row */}
          {allowanceStats && allowanceStats.length > 1 && (
            <View style={[styles.intervalNavigationContainer, { paddingRight: right }]}>
              <TouchableOpacity 
                style={styles.intervalNavButtonLeft}
                onPress={debouncedNavigateToPreviousInterval}
                activeOpacity={0.6}
                delayLongPress={1000}
              >
                <Icon
                  source="arrow-left"
                  color={colors.secondaryDark}
                  size={14}
                />
              </TouchableOpacity>
              <View style={styles.intervalNameContainer}>
                <Text variant='bodyMedium' style={styles.intervalNameText} numberOfLines={1} ellipsizeMode="middle">
                  {currentAllowanceStats?.teamAllowanceIntervalName}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.intervalNavButtonRight}
                onPress={debouncedNavigateToNextInterval}
                activeOpacity={0.6}
                delayLongPress={1000}
              >
                <Icon
                  source="arrow-right"
                  color={colors.secondaryDark}
                  size={14}
                />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.mainLayout}>
            {/* Need Review Button - Separate on the left */}
            {_user?.isAdmin && (
              <View style={styles.needReviewContainer}>
                <TouchableOpacity 
                  style={styles.needReviewStatItem} 
                  onPress={() => handleFilterPress(TaskItemNeedReviewStatusFilter.NeedsReview)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Tasks needing review: ${_bonusStats?.needsReviewCount || 0}`}
                  accessibilityHint="Double tap to filter by tasks needing review"
                  accessibilityState={{ selected: needReviewFilterStatus !== TaskItemNeedReviewStatusFilter.Any }}
                >
                  <Text variant='titleMedium' style={[styles.clickableStatNumber, needReviewFilterStatus === TaskItemNeedReviewStatusFilter.NeedsReview && styles.activeFilter]}>{currentAllowanceStats?.needsReviewCount || 0}</Text>
                  <Text variant='bodySmall' style={styles.clickableStatLabel}>Need{"\n"}Review</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.needReviewInfoIcon}
                  onPress={handleInfoIconPress}
                >
                <Text style={styles.infoIconText}>𝒊</Text>
                </TouchableOpacity>
                {showTooltip && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Tasks with credits that are completed but not yet graded
                    </Text>
                    <View style={styles.tooltipArrow} />
                  </View>
                )}
              </View>
            )}
            
            {/* Right side content with stats and dates */}
            <View style={styles.rightContent}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant='titleMedium' style={styles.statNumber}>{currentAllowanceStats?.totalCredits || 0}</Text>
                  <Text variant='bodySmall' style={styles.statLabel} accessibilityLabel='Credits'>💳 Creds</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant='titleMedium' style={styles.statNumber}>{currentAllowanceStats?.gpa || 0}</Text>
                  <Text variant='bodySmall' style={styles.statLabel} accessibilityLabel='GPA'>⭐ GPA</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant='titleMedium' style={styles.statNumber}>
                    <Text style={styles.emojiText}>$</Text><Text style={styles.statNumber}>{currentAllowanceStats?.allowance || 0}</Text>
                  </Text>
                  <Text variant='bodySmall' style={styles.statLabel} accessibilityLabel='Cash'>💰 Cash</Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant='titleMedium' style={styles.statNumber}>{currentAllowanceStats?.bonusTotalCount || 0}</Text>
                  <Text variant='bodySmall' style={styles.statLabel} accessibilityLabel='Bonus'>💎 Bonus</Text>
                </View>
              </View>
              
              {/* Date Range Display */}
              {currentAllowanceStats?.calculatedStartAt && currentAllowanceStats?.calculatedEndAt && (
                <View style={styles.dateRangeContainer}>
                  <Text variant='bodySmall' style={styles.dateRangeText}>
                    {formatDateForDisplay(currentAllowanceStats.calculatedStartAt)} - {formatDateForDisplay(currentAllowanceStats.calculatedEndAt)}
                    {daysRemaining !== null && daysRemainingApplicable ? (
                      daysRemaining > 0 
                        ? `  (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left)`
                        : daysRemaining === 0 
                          ? '  (Last day!)'
                          : '  (Period ended)'
                    ) : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      
      {/* Allowance History Modal */}
      <AllowanceHistoryModal
        visible={isAllowanceHistoryModalVisible}
        onClose={handleCloseAllowanceHistoryModal}
        highlightAllowanceId={_highlightAllowanceId}
        onApprovalRequest={handleApprovalRequest}
      />
      
      {/* Approval Modal - rendered at root level */}
      {(() => {
        return (
          <AllowanceApprovalModal
            visible={isApprovalModalVisible}
            onClose={handleApprovalModalClose}
            allowanceHistory={selectedHistory}
            user={selectedUser}
            isApprove={isApproveMode}
            onSubmit={handleApprovalSubmit}
            loading={submitting}
            onShowMessage={showSnackbar}
          />
        );
      })()}

      {/* Bonus Filter Menu */}
      <BonusFilterMenu
        visible={isBonusFilterModalVisible}
        onClose={handleCloseBonusFilterModal}
        onFilterSelect={handleBonusFilterSelect}
        currentFilter={bonusStatusFilter}
        bonusStats={_bonusStats}
        user={_user}
      />
      
      {/* Snackbar - rendered in Portal to appear above all modals */}
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={[
            styles.snackbar,
            { marginBottom: bottom + 16 },
            snackbarType === 'success' && styles.snackbarSuccess,
            snackbarType === 'error' && styles.snackbarError,
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
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible', // Ensure buttons positioned outside are still touchable
  },
  bonusToggleButton: {
    position: 'absolute',
    top: -28, // Attached to the top of the stats bar
    backgroundColor: colors.backgroundAccent,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    minHeight: 24, // Ensure minimum hit area
    minWidth: 60, // Ensure minimum hit area
  },
  bonusToggleText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  historyToggleButton: {
    position: 'absolute',
    top: -28, // Attached to the top of the stats bar
    backgroundColor: colors.secondary,
    borderColor: colors.secondary, 
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    minHeight: 24, // Ensure minimum hit area
    minWidth: 60, // Ensure minimum hit area
  },
  historyIcon: {
    margin: 0,
    width: 18,
    height: 18,
  },
  historyToggleText: {
    color: colors.textOnSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  secondaryStatsContainer: {
    paddingHorizontal: 6,
    paddingTop: 0,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.primaryDark,
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56,
    width: '100%',
  },
  rightContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    minHeight: 32,
    paddingTop: 2,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  needReviewContainer: {
    position: 'relative',
    marginRight: 8,
    alignSelf: 'stretch',
  },
  needReviewStatItem: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    width: 66,
    alignSelf: 'stretch',
    minHeight: 48,
  },
  needReviewInfoIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -8 : -8,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: colors.backgroundPaper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
    zIndex: 10,
  },
  infoIconText: {
    top: -3,
    fontSize: 13,
    color: colors.secondary,
    // fontWeight: 'bold',
  },
  tooltip: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -11 : -90,
    left: -10,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
    width: 200,
  },
  tooltipText: {
    fontSize: 12,
    color: colors.secondaryDark,
    textAlign: 'center',
    lineHeight: 16,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    right: 122,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.backgroundPaper,
  },
  clickableStatItem: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  statNumber: {
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    fontSize: 13,
  },
  statLabel: {
    color: colors.textOnPrimary,
    marginTop: 1,
    fontWeight: '700',
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
  clickableStatNumber: {
    fontWeight: '700',
    color: colors.textOnSecondary,
    // fontSize: 18,
  },
  clickableStatLabel: {
    color: colors.textOnSecondary,
    marginTop: 1,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  dateRangeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  dateRangeText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    opacity: 0.8,
    fontWeight: '700',
  },
  intervalNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: 1,
    paddingHorizontal: 0,
    marginHorizontal: -16,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryDark,
    // minHeight: 30,
    backgroundColor: colors.primaryLight,
  },
  intervalNavButtonLeft: {
    marginLeft: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 8,
  },
  intervalNavButtonRight: {
    marginRight: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 8,
  },
  intervalNameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  intervalNameText: {
    color: colors.secondaryDark,
    fontFamily: fonts.fredokaBold,
    fontSize: 12,
    textAlign: 'center',
    width: '100%',
  },
  emojiText: {
    color: '#2ae619ff',
    backgroundColor: 'transparent',
    fontSize: 13,
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

export default DashboardBottomStatsBar;
