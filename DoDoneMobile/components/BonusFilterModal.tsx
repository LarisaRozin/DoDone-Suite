/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Bonus Filter Menu Component
 * Displays a simple dropdown menu for bonus status filtering
 * @format
 */

import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Animated,
  TouchableWithoutFeedback,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Text } from './StyledText';
import { colors, fonts } from '../defaultTheme';
import { BonusStats, TaskItemBonusStatusFilter, User } from '@larisarozin/dodone-shared';
import { refreshGestureHandlers } from '../utils/gestureUtils';

interface BonusFilterMenuProps {
  visible: boolean;
  onClose: () => void;
  onFilterSelect: (filter: TaskItemBonusStatusFilter) => void;
  currentFilter: TaskItemBonusStatusFilter;
  bonusStats?: BonusStats;
  user?: User;
}

interface FilterOption {
  value: TaskItemBonusStatusFilter;
  label: string;
}

const BonusFilterMenu: React.FC<BonusFilterMenuProps> = ({
  visible,
  onClose,
  onFilterSelect,
  currentFilter,
  bonusStats,
  user
}) => {
  // Base filter options available to all users
  const baseFilterOptions: FilterOption[] = [
    { value: TaskItemBonusStatusFilter.Any, label: `Any (${bonusStats?.totalCount || 0})` },
    { value: TaskItemBonusStatusFilter.Current, label: `Current (${bonusStats?.currentBonusCount || 0})` },
    { value: TaskItemBonusStatusFilter.Approved, label: `Approved (${bonusStats?.approvedCount || 0})` },
    { value: TaskItemBonusStatusFilter.Rejected, label: `Rejected (${bonusStats?.rejectedCount || 0})` },
    { value: TaskItemBonusStatusFilter.Claimed, label: `Claimed (${bonusStats?.claimedCount || 0})` },
    { value: TaskItemBonusStatusFilter.NotClaimed, label: `Not Claimed (${bonusStats?.notClaimedCount || 0})` },
    { value: TaskItemBonusStatusFilter.WithBonus, label: `Has Bonus (${bonusStats?.withBonusCount || 0})` },
    { value: TaskItemBonusStatusFilter.WithoutBonus, label: `No Bonus (${bonusStats?.withoutBonusCount || 0})` },
  ];

  // Admin-only filter options
  const adminFilterOptions: FilterOption[] = [
    { value: TaskItemBonusStatusFilter.NeedsReview, label: 'Need Review' },
  ];

  // Combine base options with admin options if user is admin
  const filterOptions = user?.isAdmin 
    ? [...baseFilterOptions.slice(0, 1), ...adminFilterOptions, ...baseFilterOptions.slice(1, 10)]
    : baseFilterOptions;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  const handleFilterSelect = (filter: TaskItemBonusStatusFilter) => {
    onFilterSelect(filter);
    
    // Use gesture utility to properly clean up before closing
    refreshGestureHandlers(() => {
      onClose();
    });
  };

  const renderFilterOption = ({ item }: { item: FilterOption }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        currentFilter === item.value && styles.selectedMenuItem
      ]}
      onPress={() => handleFilterSelect(item.value)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityHint="Double tap to apply this bonus filter"
      accessibilityState={{ selected: currentFilter === item.value }}
    >
      <View style={styles.menuItemTextContainer}>
        <Text style={[
          styles.menuItemText,
          currentFilter === item.value && styles.selectedMenuItemText
        ]}>
          {item.label}
        </Text>
        {item.value === TaskItemBonusStatusFilter.Current && (
          <Text style={[
            styles.menuItemSubtext,
            currentFilter === item.value && styles.selectedMenuItemSubtext
          ]}>
            Not yet approved or approved/rejected within current selected interval.
          </Text>
        )}
        {item.value === TaskItemBonusStatusFilter.NeedsReview && (
          <Text style={[
            styles.menuItemSubtext,
            currentFilter === item.value && styles.selectedMenuItemSubtext
          ]}>
            Completed tasks with bonus not yet approved.
          </Text>
        )}
      </View>
      {currentFilter === item.value && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Bonus filter menu"
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        accessibilityHint="Double tap to close bonus filter menu"
      >
        <View 
          style={styles.overlay}
          accessible={false}
        >
          <TouchableWithoutFeedback
            accessible={false}
          >
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Filter by Bonus Status</Text>
                <Text style={styles.scrollHint}>Scroll to see all options</Text>
              </View>
              
              <View style={styles.scrollContainer}>
                <View style={styles.fadeTopGradient} />
                <FlatList
                  data={filterOptions}
                  renderItem={renderFilterOption}
                  keyExtractor={(item) => item.value.toString()}
                  style={styles.menuList}
                  contentContainerStyle={styles.scrollContentContainer}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle="default"
                  bounces={true}
                  scrollIndicatorInsets={{ right: 1 }}
                  accessible={true}
                  accessibilityRole="list"
                  accessibilityLabel={`Bonus filter options with ${filterOptions.length} choices`}
                  accessibilityHint="Scroll to view all filter options"
                />
                <View style={styles.fadeBottomGradient} />
                <View style={styles.scrollIndicatorContainer}>
                  <View style={styles.scrollIndicator} />
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    maxHeight: '70%',
    minHeight: 500,
    minWidth: 320,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.primaryLight,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textOnPrimary,
    textAlign: 'center',
    fontFamily: fonts.fredokaSemiBold,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollHint: {
    fontSize: 12,
    color: colors.textOnPrimary + '90',
    textAlign: 'center',
    fontFamily: fonts.roboto,
    marginTop: 4,
    fontStyle: 'italic',
  },
  menuList: {
    flex: 1,
    paddingVertical: 4,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollIndicator: {
    width: 3,
    height: 40,
    backgroundColor: colors.primary + '60',
    borderRadius: 2,
    opacity: 0.7,
  },
  fadeTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: colors.backgroundDefault,
    opacity: 0.9,
    pointerEvents: 'none',
    zIndex: 1,
  },
  fadeBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: colors.backgroundDefault,
    opacity: 0.9,
    pointerEvents: 'none',
    zIndex: 1,
  },
  scrollContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContentContainer: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  selectedMenuItem: {
    backgroundColor: colors.primary,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.roboto,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.roboto,
    marginTop: 2,
    fontStyle: 'italic',
  },
  selectedMenuItemText: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  selectedMenuItemSubtext: {
    color: colors.textOnPrimary + '90',
  },
  checkmark: {
    fontSize: 16,
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BonusFilterMenu;