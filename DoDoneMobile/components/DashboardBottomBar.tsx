/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Portal, Dialog } from './StyledText';
import { Text, Button } from './StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../defaultTheme';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { UpgradeModal } from '../components/UpgradeModal';
import { SubscriptionTier } from '../types/subscription';


interface DashboardBottomBarProps {
  isMultiSelectMode?: boolean;
  selectedTasksCount?: number;
  selectedTasks?: any[];
  onBulkAction?: (action: string) => void;
  isStatsBarVisible?: boolean;
}

const DashboardBottomBar = ({ 
  isMultiSelectMode = false, 
  selectedTasksCount = 0, 
  selectedTasks = [],
  onBulkAction,
  isStatsBarVisible = true,
}: DashboardBottomBarProps) => {
  const { bottom } = useSafeAreaInsets();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  
  // Account for the stats bar height only when it's visible (very compact size: ~42px)
  const statsBarHeight = isStatsBarVisible ? 42 : 0;

  // Calculate dynamic icon states based on selected tasks
  const allSelectedAreCompleted = selectedTasks.every(item => item.isCompleted);
  const allSelectedAreActive = selectedTasks.every(item => item.isActive);
  const allSelectedArePinned = selectedTasks.every(item => item.isPinned);
  const allSelectedAreArchived = selectedTasks.every(item => item.isArchived);

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onBulkAction?.('delete');
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  if (isMultiSelectMode) {
    // TODO: show message from the server (e.g.: not authorized) instead of generic failure
    return (
      <>
        <View style={[localStyles.bottom, { 
          paddingBottom: bottom,
          bottom: statsBarHeight // Position above the stats bar
        }]}>
          <View style={localStyles.appbarContainer}>
            <View style={localStyles.leftSection}>
              <Text style={localStyles.selectionCount}>{selectedTasksCount}</Text>
            </View>
            <SubscriptionGate 
              requiredTier={SubscriptionTier.Pro}
              // requiresFeature={(limits) => limits.bonuses} 
              overlayWhenLocked
              onUpgradePress={() => setUpgradeModalVisible(true)}
            >
              <View style={localStyles.actionsContainer}>
                <IconButton 
                  icon="delete" 
                  iconColor={colors.textOnPrimary} 
                  onPress={handleDeletePress}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Delete tasks"
                  accessibilityHint={`Double tap to delete ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''}`}
                />
                <IconButton 
                  icon={allSelectedAreArchived ? "archive-outline" : "archive"} 
                  iconColor={colors.textOnPrimary} 
                  onPress={() => onBulkAction?.('archive')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={allSelectedAreArchived ? "Unarchive tasks" : "Archive tasks"}
                  accessibilityHint={`Double tap to ${allSelectedAreArchived ? 'unarchive' : 'archive'} ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''}`}
                />
                <IconButton 
                  icon="content-copy" 
                  iconColor={colors.textOnPrimary} 
                  onPress={() => onBulkAction?.('copy')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Copy tasks"
                  accessibilityHint={`Double tap to copy ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''}`}
                />
                <IconButton 
                  icon={allSelectedAreCompleted ? "check" : "check-outline"} 
                  iconColor={colors.textOnPrimary} 
                  onPress={() => onBulkAction?.('complete')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={allSelectedAreCompleted ? "Mark as incomplete" : "Mark as complete"}
                  accessibilityHint={`Double tap to mark ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''} as ${allSelectedAreCompleted ? 'incomplete' : 'complete'}`}
                />
                <IconButton 
                  icon={allSelectedArePinned ? "pin-outline" : "pin"} 
                  iconColor={colors.textOnPrimary} 
                  onPress={() => onBulkAction?.('pin')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={allSelectedArePinned ? "Unpin tasks" : "Pin tasks"}
                  accessibilityHint={`Double tap to ${allSelectedArePinned ? 'unpin' : 'pin'} ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''}`}
                />
                <IconButton 
                  icon={allSelectedAreActive ? "play-outline" : "play"} 
                  iconColor={colors.textOnPrimary} 
                  onPress={() => onBulkAction?.('activate')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={allSelectedAreActive ? "Deactivate tasks" : "Activate tasks"}
                  accessibilityHint={`Double tap to ${allSelectedAreActive ? 'deactivate' : 'activate'} ${selectedTasksCount} selected task${selectedTasksCount > 1 ? 's' : ''}`}
                />
              </View>
            </SubscriptionGate>
          </View>
        </View>
        
        <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={handleDeleteCancel}>
            <Dialog.Title>Delete Tasks</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete {selectedTasksCount} task{selectedTasksCount > 1 ? 's' : ''}? This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleDeleteCancel}>Cancel</Button>
              <Button 
                onPress={handleDeleteConfirm} 
                mode="contained" 
                buttonColor={colors.error}
                labelStyle={localStyles.deleteButtonText}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <UpgradeModal
          visible={upgradeModalVisible}
          onClose={() => setUpgradeModalVisible(false)}
          message="Upgrade to Pro to unlock this feature"
        />
      </>
    );
  }

  // Return null when not in multi-select mode - FAB will be rendered by parent
  return null;
};

export default DashboardBottomBar;

const localStyles = StyleSheet.create({
  bottom: {
    backgroundColor: colors.primary,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  appbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingRight: 0, // Remove right padding
    height: 56,
    justifyContent: 'space-between',
  },
  leftSection: {
    justifyContent: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 56,
    paddingRight: 0, // No right padding
    marginRight: 0,  // No right margin
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 0,
  },
  selectionCount: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: 'white',
  },
});
