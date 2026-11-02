/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { useCallback, useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionAction } from '../types/subscription';
// import { Alert } from 'react-native';

interface UseSubscriptionCheckResult {
  /** Check if action is allowed, optionally showing upgrade modal */
  checkAction: (
    action: SubscriptionAction,
    options?: {
      showUpgradeModal?: boolean;
      onUpgradeNeeded?: (message: string) => void;
    }
  ) => Promise<boolean>;
  
  /** Check if user can add a team member */
  checkCanAddTeamMember: (options?: { showUpgradeModal?: boolean }) => Promise<boolean>;
  
  /** Check if user can add an allowance interval */
  checkCanAddAllowanceInterval: (options?: { showUpgradeModal?: boolean }) => Promise<boolean>;
  
  /** Check if user can add a task item */
  checkCanAddTaskItem: (options?: { showUpgradeModal?: boolean }) => Promise<boolean>;
  
  /** State for managing upgrade modal */
  upgradeModalVisible: boolean;
  upgradeMessage: string;
  showUpgradeModal: (message: string) => void;
  hideUpgradeModal: () => void;
}

/**
 * Hook for checking subscription limits before performing actions
 * 
 * @example
 * const { checkCanAddTaskItem, upgradeModalVisible, hideUpgradeModal } = useSubscriptionCheck();
 * 
 * const handleAddTask = async () => {
 *   const canAdd = await checkCanAddTaskItem({ showUpgradeModal: true });
 *   if (!canAdd) return;
 *   
 *   // Proceed with adding task...
 * };
 * 
 * return (
 *   <>
 *     <Button onPress={handleAddTask}>Add Task</Button>
 *     <UpgradeModal visible={upgradeModalVisible} onClose={hideUpgradeModal} />
 *   </>
 * );
 */
export const useSubscriptionCheck = (): UseSubscriptionCheckResult => {
  const { validateAction } = useSubscription();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const showUpgradeModal = useCallback((message: string) => {
    setUpgradeMessage(message);
    setUpgradeModalVisible(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setUpgradeModalVisible(false);
    setUpgradeMessage('');
  }, []);

  const checkAction = useCallback(
    async (
      action: SubscriptionAction,
      options?: {
        showUpgradeModal?: boolean;
        onUpgradeNeeded?: (message: string) => void;
      }
    ): Promise<boolean> => {
      const result = await validateAction(action);

      if (!result.isAllowed) {
        const message = result.reason || 'Upgrade required to use this feature';
        
        if (options?.showUpgradeModal) {
          showUpgradeModal(message);
        }
        
        if (options?.onUpgradeNeeded) {
          options.onUpgradeNeeded(message);
        }
      }
      // else {
      //   Alert.alert(
      //   'Check Action Result',
      //   `Action: ${action}\n` +
      //   `Allowed: ${result.isAllowed ? 'Yes' : 'No'}\n` +
      //   `Current Tier: ${result.currentTier}\n` +
      //   `${!result.isAllowed ? `Reason: ${result.reason}\nUpgrade to: ${result.upgradeRequired}` : ''}`
      //   );

      // }

      return result.isAllowed;
    },
    [validateAction, showUpgradeModal]
  );

  const checkCanAddTeamMember = useCallback(
    async (options?: { showUpgradeModal?: boolean }): Promise<boolean> => {
      return checkAction(SubscriptionAction.AddTeamMember, options);
    },
    [checkAction]
  );

  const checkCanAddAllowanceInterval = useCallback(
    async (options?: { showUpgradeModal?: boolean }): Promise<boolean> => {
      return checkAction(SubscriptionAction.AddAllowanceInterval, options);
    },
    [checkAction]
  );

  const checkCanAddTaskItem = useCallback(
    async (options?: { showUpgradeModal?: boolean }): Promise<boolean> => {
      return checkAction(SubscriptionAction.AddTaskItem, options);
    },
    [checkAction]
  );

  return {
    checkAction,
    checkCanAddTeamMember,
    checkCanAddAllowanceInterval,
    checkCanAddTaskItem,
    upgradeModalVisible,
    upgradeMessage,
    showUpgradeModal,
    hideUpgradeModal,
  };
};
