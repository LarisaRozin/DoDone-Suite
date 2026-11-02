/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import { Snackbar } from './StyledText';
import { Text, Button } from './StyledText';
import { colors } from '../defaultTheme';
import { 
  AllowanceHistoryResponse, 
  PagedAllowanceHistoriesListRequest,
  PagedListRequestBuilder,
  SortDirection,
  useAllowanceHistories,
  useTeam,
  useAuth,
  User,
  AllowanceHistoryClaimRequest,
} from '@larisarozin/dodone-shared';
import UserAvatar from './UserAvatar';
import { formatDateForDisplay, formatDateTimeForDisplay } from '../utils/dateUtils';
import { useNotification } from '../contexts/NotificationContext';
import { refreshGestureHandlers } from '../utils/gestureUtils';

interface AllowanceHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  highlightAllowanceId?: string;
  onApprovalRequest?: (history: AllowanceHistoryResponse, user: User, isApprove: boolean) => void;
}

const { height: screenHeight } = Dimensions.get('window');

interface AllowanceHistoryRowProps {
  allowanceHistory: AllowanceHistoryResponse;
  user?: User;
  currentUser?: User;
  onApprove: (historyId: number) => void;
  onReject: (historyId: number) => void;
  onRevise: (historyId: number) => void;
  onClaim: (historyId: number) => void;
  getAllowanceLabelLowercase: () => string;
  isHighlighted?: boolean;
}

const AllowanceHistoryRow: React.FC<AllowanceHistoryRowProps> = ({
  allowanceHistory,
  user,
  currentUser,
  onApprove,
  onReject,
  onRevise,
  onClaim,
  getAllowanceLabelLowercase,
  isHighlighted = false
}) => {
  const isApproved = allowanceHistory.isApproved;
  const isRejected = allowanceHistory.isRejected;
  const isPending = !isApproved && !isRejected;
  const isCurrentUserAdmin = currentUser?.isAdmin || false;
  const currentUserId = currentUser?.id || undefined;

  // Check if we're within 2 days of the allowance end date (UTC)
  const isWithinTwoDaysOfEnd = useMemo(() => {
    if (!isPending || !allowanceHistory.calculatedEndAt) return false;

    const currentDate = new Date();
    const endDate = new Date(allowanceHistory.calculatedEndAt);
    const twoDaysBeforeEnd = new Date(endDate);
    twoDaysBeforeEnd.setUTCDate(twoDaysBeforeEnd.getUTCDate() - 2);
    
    return currentDate >= twoDaysBeforeEnd;
  }, [isPending, allowanceHistory.calculatedEndAt]);

  // Check if claim button should be disabled (within 24 hours of last claim)
  const isClaimDisabled = useMemo(() => {
    if (!allowanceHistory.claimedAt) return false;
    
    const currentDate = new Date();
    const claimedDate = new Date(allowanceHistory.claimedAt);
    const hoursSinceLastClaim = (currentDate.getTime() - claimedDate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastClaim < 24;
  }, [allowanceHistory.claimedAt]);

  return (
    <View 
      style={[styles.historyRow, isHighlighted && styles.highlightedRow]} 
      pointerEvents="box-none"
    >
      <View style={styles.historyRowLeft} pointerEvents="box-none">
        <UserAvatar 
          size={54}
          firstName={user?.firstName}
          lastName={user?.lastName}
          imageUri={user?.avatarUri}
        />
        <View style={styles.historyInfo}>
          <Text variant="bodyMedium" style={styles.userName}>
            {(() => {
              const firstName = user?.firstName?.trim() || '';
              const lastName = user?.lastName?.trim() || '';
              return `${firstName} ${lastName}`.trim() || user?.userName || 'Unknown User';
            })()}
          </Text>
          <Text variant="bodySmall" style={styles.historyDates}>
            {allowanceHistory.teamAllowanceIntervalName}
          </Text>
          <Text variant="bodySmall" style={styles.historyDates}>
            {formatDateForDisplay(allowanceHistory.calculatedStartAt)} - {formatDateForDisplay(allowanceHistory.calculatedEndAt)}
          </Text>
          <View style={styles.historyDetailsContainer}>
            <View style={styles.historyDetailRow}>
              <Text variant="bodySmall" style={styles.historyDetailLabel}>Credits:</Text>
              <Text variant="bodySmall" style={styles.historyDetailValue}>{allowanceHistory.totalCredits || 0}</Text>
            </View>
            <View style={styles.historyDetailRow}>
              <Text variant="bodySmall" style={styles.historyDetailLabel}>GPA:</Text>
              <Text variant="bodySmall" style={styles.historyDetailValue}>{(allowanceHistory.gpa || 0).toFixed(1)}</Text>
            </View>
            <View style={styles.historyDetailAmountRow}>
              <Text variant="bodySmall" style={styles.historyDetailLabel}>Amount:</Text>
              <Text variant="bodySmall" style={styles.historyDetailAllowanceAmount}>${(allowanceHistory.calculatedAmount || 0).toFixed(2)}</Text>
            </View>
          </View>
          {isApproved && typeof allowanceHistory.approvedAmount !== 'undefined' && allowanceHistory.approvedAmount !== null && (
            <View style={styles.historyDetailAmountRow}>
              <Text variant="bodySmall" style={styles.approvedAmountLabel}>Approved:</Text>
              <Text variant="bodySmall" style={styles.approvedAmount}>${allowanceHistory.approvedAmount.toFixed(2)}</Text>
            </View>
          )}
          {allowanceHistory.comment && (
            <Text variant="bodySmall" style={styles.commentText}>
              Comment: {allowanceHistory.comment}
            </Text>
          )}
          {allowanceHistory.claimedAt && !allowanceHistory.approvedAt && (
            <View style={styles.claimedContainer}>
              <Text variant="bodySmall" style={styles.claimedLabel}>Last Claimed:</Text>
              <Text variant="bodySmall" style={styles.claimedDate}>
                {formatDateTimeForDisplay(allowanceHistory.claimedAt)}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.historyRowRight} pointerEvents="box-none">
        {isPending ? (
          isWithinTwoDaysOfEnd ? (
            isCurrentUserAdmin ? (
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => onApprove(allowanceHistory.id)}
                  style={[styles.actionButton, styles.approveButton]}
                  labelStyle={styles.actionButtonLabel}
                  compact
                >
                  Approve
                </Button>
                {(allowanceHistory.calculatedAmount || 0) > 0 && (
                  <Button
                    mode="contained"
                    onPress={() => onReject(allowanceHistory.id)}
                    style={[styles.actionButton, styles.rejectButton]}
                    labelStyle={styles.actionButtonLabel}
                    compact
                  >
                    Reject
                  </Button>
                )}
              </View>
            ) : (
              currentUserId === allowanceHistory.userId ? (
                <View style={styles.actionButtons} pointerEvents="box-none">
                  <Button
                    mode="contained"
                    onPress={() => onClaim(allowanceHistory.id)}
                    style={[
                      styles.actionButton, 
                      styles.claimButton,
                      isClaimDisabled && styles.disabledButton
                    ]}
                    labelStyle={styles.actionButtonLabel}
                    disabled={isClaimDisabled}
                    compact
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Claim allowance"
                    accessibilityHint={isClaimDisabled ? "Button is disabled, please wait before claiming again" : "Double tap to claim this allowance amount"}
                    accessibilityState={{ disabled: isClaimDisabled }}
                  >
                    Claim
                  </Button>
                </View>
              ) : null
            )
          ) : (
            <View style={styles.currentStatusContainer}>
              <Text variant="bodyMedium" style={styles.currentStatusText}>
                Current
              </Text>
              <Text variant="bodySmall" style={styles.pendingStatusText}>
                Pending {getAllowanceLabelLowercase()} day
              </Text>
            </View>
          )
        ) : (
          <View style={styles.statusContainer}>
            <Text 
              variant="bodySmall" 
              style={[
                styles.statusText,
                isApproved ? styles.approvedStatus : styles.rejectedStatus
              ]}
            >
              {isApproved ? 'Approved' : 'Rejected'}
            </Text>
            {allowanceHistory.approvedAt && (
              <Text variant="bodySmall" style={styles.statusDate}>
                {formatDateForDisplay(allowanceHistory.approvedAt)}
              </Text>
            )}
            {isCurrentUserAdmin && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => onRevise(allowanceHistory.id)}
                style={styles.reviseButton}
                iconColor={colors.textSecondary}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export const AllowanceHistoryModal: React.FC<AllowanceHistoryModalProps> = ({
  visible,
  onClose,
  highlightAllowanceId,
  onApprovalRequest
}) => {
  // Only log when modal becomes visible or highlight ID changes
  const prevPropsRef = useRef<{ visible: boolean; highlightAllowanceId: string | undefined }>({ visible: false, highlightAllowanceId: undefined });
  if (visible !== prevPropsRef.current.visible || highlightAllowanceId !== prevPropsRef.current.highlightAllowanceId) {
    prevPropsRef.current = { visible, highlightAllowanceId };
  }
  
  const { user } = useAuth();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const { notification, hideNotification, setModalOpen, handleNotificationTap, showNotification } = useNotification();
  const flatListRef = useRef<FlatList>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const prevVisibleForHighlightRef = useRef(visible);
  const lastProcessedHighlightIdRef = useRef<string | undefined>(undefined);
  
  // Notify the notification context when modal opens/closes
  useEffect(() => {
    setModalOpen(visible);
  }, [visible, setModalOpen]);

  // Team details request for business/family detection
  const teamDetailsRequest = useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );
  const { teamDetails, fetchTeamDetails } = useTeam(teamDetailsRequest);

  // Load team details when component mounts
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  // Helper function for dynamic allowance terminology
  const getAllowanceLabel = useCallback(() => {
    return teamDetails?.isBusiness ? 'Incentive' : 'Allowance';
  }, [teamDetails?.isBusiness]);

  const getAllowanceLabelLowercase = useCallback(() => {
    return teamDetails?.isBusiness ? 'incentive' : 'allowance';
  }, [teamDetails?.isBusiness]);
  
  // Use a simple height calculation  
  const modalHeight = screenHeight * 0.9;

  // Create request for allowance histories - make it more stable
  const allowanceHistoriesRequest = useMemo((): PagedAllowanceHistoriesListRequest => {
    const request = {
      teamId: user?.teamId || 0,
      paging: new PagedListRequestBuilder()
        .setPaging(1, 50)
        .setSorting('createdAt', SortDirection.Descending)
        .build().paging
    };
    return request;
  }, [user?.teamId]);

  const { pagedAllowanceHistories, loadingAllowanceHistories, refreshAllowanceHistories, claimAllowance } = useAllowanceHistories(allowanceHistoriesRequest);

  // Track previous visible state to avoid infinite loops
  const prevVisibleRef = useRef(visible);

  // Get team members for user details
  const teamRequest = useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 100)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { teamMembersList } = useTeam(teamRequest);
  const teamMembers = useMemo(() => teamMembersList?.data || [], [teamMembersList?.data]);

  // Get user for each allowance history
  const getUserForHistory = (history: AllowanceHistoryResponse): User | undefined => {
    // Now using camelCase userId
    return teamMembers.find(member => member.id === history.userId);
  };

  // Handle modal show/hide animations
  React.useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Refresh allowance histories when modal opens (only when transitioning from false to true)
      refreshAllowanceHistories(allowanceHistoriesRequest);
    }
    prevVisibleRef.current = visible;
    
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, translateY]);

  // Pan responder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Only start pan responder from handle area
        return evt.nativeEvent.pageY < 100; // Only handle area at top
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags from the handle area and ensure sufficient movement
        return evt.nativeEvent.pageY < 100 && Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Close modal if dragged down more than 100px or with sufficient velocity
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Refresh gesture handlers before closing to prevent conflicts
          refreshGestureHandlers(() => {
            onClose();
          });
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleApprove = async (historyId: number) => {
    const history = allowanceHistories.find(h => h.id === historyId);
    const historyUser = history ? getUserForHistory(history) : undefined;
        
    if (history && historyUser && onApprovalRequest) {
      onApprovalRequest(history, historyUser, true);
    } else {
      console.log('Missing history, user data, or callback:', {
        hasHistory: !!history,
        hasUser: !!historyUser,
        hasCallback: !!onApprovalRequest
      });
    }
  };

  const handleReject = async (historyId: number) => {
    const history = allowanceHistories.find(h => h.id === historyId);
    const historyUser = history ? getUserForHistory(history) : undefined;
    
    if (history && historyUser && onApprovalRequest) {
      onApprovalRequest(history, historyUser, false);
    } else {
      console.log('Missing history, user data, or callback for reject');
    }
  };

  const handleRevise = async (historyId: number) => {
    const history = allowanceHistories.find(h => h.id === historyId);
    const historyUser = history ? getUserForHistory(history) : undefined;
    
    if (history && historyUser && onApprovalRequest) {
      // Set isApproveMode to true if currently rejected, false if currently approved
      const isApproveMode = history.isRejected;
      onApprovalRequest(history, historyUser, isApproveMode);
    }
  };

  const handleClaim = async (_historyId: number) => {
    const request: AllowanceHistoryClaimRequest = {
      id: _historyId,
    };

    try {
      await claimAllowance(request);
      refreshAllowanceHistories(allowanceHistoriesRequest);
      showNotification(`${getAllowanceLabel()} claimed successfully`, 'success');
    } catch (error) {
      console.error(`Error claiming ${getAllowanceLabelLowercase()}:`, error);
    }
  };

  const renderAllowanceHistoryItem = ({ item }: { item: AllowanceHistoryResponse }) => {
    // Add safety check for item and item id (now camelCase)
    if (!item || (!item.id && item.id !== 0)) {
      return null;
    }
    
    const historyUser = getUserForHistory(item);
    const isHighlighted = highlightedId === item.id;
    
    return (
      <AllowanceHistoryRow
        allowanceHistory={item}
        user={historyUser}
        currentUser={user || undefined}
        onApprove={handleApprove}
        onReject={handleReject}
        onRevise={handleRevise}
        onClaim={handleClaim}
        getAllowanceLabelLowercase={getAllowanceLabelLowercase}
        isHighlighted={isHighlighted}
      />
    );
  };

  // Memoize the allowance histories to prevent re-render issues
  const allowanceHistories = useMemo(() => {
    const data = pagedAllowanceHistories?.data;
    
    if (!data || !Array.isArray(data)) {
      return [];
    }
    // Filter out any invalid items - now using camelCase 'id'
    const validItems = data.filter(item => {
      const hasId = item && typeof item.id !== 'undefined' && item.id !== null;
      return hasId;
    });
    
    return validItems;
  }, [pagedAllowanceHistories]);

  // Handle highlighting and scrolling to specific allowance history
  useEffect(() => {
    prevVisibleForHighlightRef.current = visible;
    
    // Only process highlight when:
    // 1. Modal is visible
    // 2. We have a highlightAllowanceId
    // 3. We have data loaded
    // 4. This is a NEW highlight ID we haven't processed yet
    if (visible && highlightAllowanceId && allowanceHistories.length > 0) {
      const historyId = parseInt(highlightAllowanceId, 10);
      
      if (!isNaN(historyId)) {
        // Check if this is a different highlight ID than the last one we processed
        const isNewHighlightId = highlightAllowanceId !== lastProcessedHighlightIdRef.current;
        
        if (isNewHighlightId) {
          setHighlightedId(historyId);
          lastProcessedHighlightIdRef.current = highlightAllowanceId;
          
          // Find the index of the item to scroll to
          const index = allowanceHistories.findIndex(h => h.id === historyId);
          
          if (index !== -1 && flatListRef.current) {
            // Use a timeout to ensure the list is fully rendered before scrolling
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5, // Center the item in the view
              });
            }, 300);
          } else if (index === -1) {
            console.warn('⚠️ Item with ID', historyId, 'not found in list');
          } else if (!flatListRef.current) {
            console.warn('⚠️ FlatList ref not available');
          }
          
          // Clear highlight after 3 seconds
          const timer = setTimeout(() => {
            setHighlightedId(null);
            // Also reset the last processed ID so the same item can be highlighted again later
            lastProcessedHighlightIdRef.current = undefined;
          }, 3000);
          
          return () => clearTimeout(timer);
        } else {
          ; // console.log('⏭️ Skipping highlight processing - same ID as last processed');
        }
      } else {
        console.warn('⚠️ Invalid history ID:', highlightAllowanceId);
      }
    } else {
      if (!visible) {
        // Reset the flag when modal closes
        lastProcessedHighlightIdRef.current = undefined;
      }
    }
  }, [visible, highlightAllowanceId, allowanceHistories]);

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel="Allowance history modal"
      >
        <TouchableWithoutFeedback
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          accessibilityHint="Double tap to close allowance history"
        >
          <View 
            style={styles.backdrop}
            accessible={false}
          />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              height: modalHeight,
              transform: [{ translateY }]
            }
          ]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel="Allowance history content"
        >
          {/* Draggable Handle Area */}
          <View 
            style={styles.handleArea} 
            {...panResponder.panHandlers}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Drag handle"
            accessibilityHint="Swipe down to close modal"
          >
            <View 
              style={styles.dragHandle}
              accessible={false}
            />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                {getAllowanceLabel()} History{allowanceHistories.length > 0 ? ` (${allowanceHistories.length})` : ''}
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Review and approve {getAllowanceLabelLowercase()}s
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {loadingAllowanceHistories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text variant="bodyMedium" style={styles.loadingText}>
                  Loading {getAllowanceLabelLowercase()} histories...
                </Text>
              </View>
            ) : allowanceHistories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No {getAllowanceLabelLowercase()} histories found. Assign, specify credits and grade some tasks to start {getAllowanceLabelLowercase()} calculations.
                </Text>
              </View>
            ) : (
              <FlatList
                // @ts-ignore - ref prop type issue in newer TypeScript versions
                ref={flatListRef}
                data={allowanceHistories}
                renderItem={renderAllowanceHistoryItem}
                keyExtractor={(item, index) => {
                  // Enhanced safety check - now using camelCase id
                  if (item && typeof item.id !== 'undefined' && item.id !== null) {
                    return `allowance-${item.id}`;
                  }
                  return `fallback-${index}-${Date.now()}`;
                }}
                style={styles.listContainer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                removeClippedSubviews={false}
                initialNumToRender={5}
                maxToRenderPerBatch={3}
                windowSize={5}
                getItemLayout={undefined}
                accessible={true}
                accessibilityRole="list"
                accessibilityLabel={`Allowance history with ${allowanceHistories.length} entries`}
                accessibilityHint="Scroll to view all allowance history entries"
                onScrollToIndexFailed={(info) => {
                  // Handle scroll to index failure gracefully
                  console.log('Failed to scroll to index:', info);
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  }, 100);
                }}
              />
            )}
          </View>
          
          {/* Notification Snackbar - renders inside modal to appear above modal content */}
          {visible && notification.visible && (
            <Snackbar
              visible={true}
              onDismiss={hideNotification}
              duration={notification.isPushNotification ? 8000 : 4000}
              style={[
                styles.modalSnackbar,
                notification.type === 'success' && styles.snackbarSuccess,
                notification.type === 'error' && styles.snackbarError,
                notification.type === 'warning' && styles.snackbarWarning,
                (notification.type === 'info' && notification.isPushNotification) && styles.snackbarPrimary,
                (notification.type === 'info' && !notification.isPushNotification) && styles.snackbarInfo,
              ]}
              action={
                notification.isPushNotification && notification.data && (notification.data.taskId || notification.data.allowanceHistoryId)
                  ? {
                      label: 'View',
                      onPress: handleNotificationTap,
                      labelStyle: { color: 'white', fontWeight: 'bold' }
                    }
                  : {
                      label: 'Dismiss',
                      onPress: hideNotification,
                      labelStyle: { color: 'white' }
                    }
              }
            >
              <Text style={styles.snackbarText}>
                {notification.message}
              </Text>
            </Snackbar>
          )}
        </Animated.View>
      </Modal>
    </>
  );
};


const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundDefault,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  handleArea: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    overflow: 'visible',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    minHeight: 80,
  },
  highlightedRow: {
    backgroundColor: colors.primaryLight || '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  historyRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  historyDetails: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDetailsContainer: {
    marginTop: 4,
    marginBottom: 2,
  },
  historyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'nowrap',
  },
  historyDetailAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    flexWrap: 'nowrap',
  },
 
  historyDetailLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    width: 70,
    textAlign: 'right',
    marginRight: 8,
    flexShrink: 0,
  },
  historyDetailValue: {
    color: colors.textOnBackground,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  historyDetailAllowanceAmount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
  },
 
  historyDates: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
    fontStyle: 'italic',
  },
  approvedAmount: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: colors.backgroundAccent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    flex: 1,
    flexShrink: 1,
  },
  approvedAmountLabel: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'right',
    marginRight: 8,
    flexShrink: 0,
  },
  commentText: {
    color: colors.primaryDark,
    marginTop: 4,
    fontStyle: 'normal',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: colors.backgroundPaper,
    paddingHorizontal: 4,
    paddingRight: 1,
    paddingLeft: 4,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  claimedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: colors.primaryLight || '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  claimedLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  claimedDate: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  historyRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
    maxWidth: 80,
    paddingLeft: 8,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'stretch',
    minWidth: 80,
    maxWidth: 80,
    paddingVertical: 4, // Add padding for better touch area
  },
  actionButton: {
    minWidth: 80,
    height: 44, // Increased for better touch target
    justifyContent: 'center',
    alignItems: 'center',
    // borderRadius: 8,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
    zIndex: 1000, // Ensure buttons are on top
    position: 'relative',
  },
  actionButtonLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
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
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  disabledButtonText: {
    color: colors.textOnBackground,
  },
  statusContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
  approvedStatus: {
    color: colors.success,
  },
  rejectedStatus: {
    color: colors.error,
  },
  statusDate: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 10,
  },
  reviseButton: {
    marginTop: 4,
    margin: 0,
  },
  currentStatusContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
    maxWidth: 80,
    justifyContent: 'center',
  },
  currentStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  pendingStatusText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
    lineHeight: 12,
  },
  modalSnackbar: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 8,
    elevation: 1000,
    zIndex: 10000,
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
  snackbarSuccess: {
    backgroundColor: colors.success,
  },
  snackbarError: {
    backgroundColor: colors.error,
  },
  snackbarWarning: {
    backgroundColor: colors.warning || '#ff9800',
  },
  snackbarInfo: {
    backgroundColor: '#2196f3',
  },
  snackbarPrimary: {
    backgroundColor: colors.primary,
  },
});

export default AllowanceHistoryModal;
