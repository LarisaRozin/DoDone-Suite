/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useAuth } from '@larisarozin/dodone-shared';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type SubscriptionManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionManagement'>;

export const SubscriptionManagementScreen: React.FC = () => {
  const { 
    limits, 
    status, 
    isPro, 
    isLoading,
    openSubscriptionManagement,
    restorePurchases,
    clearPendingPurchases,
  } = useSubscription();

  const { user } = useAuth();
  const navigation = useNavigation<SubscriptionManagementScreenNavigationProp>();
  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Safety guard: if user logs out while on this screen, navigate to Login immediately
  // This prevents crashes from accessing properties on null/undefined values
  useEffect(() => {
    if (!user) {
      // User logged out, navigate to Login to prevent rendering with null state
      navigation.navigate('Login');
    }
  }, [user, navigation]);

  const handleManageSubscription = async () => {
    try {
      await openSubscriptionManagement();
    } catch (error) {
      console.error('Error managing subscription:', error);
      // Show user-friendly error message
      showDialog(
        'Unable to Open',
        'Could not open subscription management. Please visit the ' + 
        (Platform.OS === 'ios' ? 'App Store' : 'Google Play Store') + 
        ' app to manage your subscription.',
        [{ text: 'OK', style: 'cancel', onPress: hideDialog }]
      );
      // Don't rethrow - error is handled gracefully
    }
  };

  const handleRestorePurchases = async () => {
    showDialog(
      'Restore Purchases',
      'This will check for any previous purchases on this account. Continue?',
      [
        { text: 'Cancel', style: 'cancel', onPress: hideDialog },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            hideDialog();
            setIsRestoring(true);
            try {
              await restorePurchases();
              showDialog(
                'Restore Complete',
                'Your purchases have been restored.',
                [{ text: 'OK', style: 'cancel', onPress: hideDialog }]
              );
            } catch (error) {
              showDialog(
                'Restore Failed',
                'Could not restore purchases. Please try again later.',
                [{ text: 'OK', style: 'cancel', onPress: hideDialog }]
              );
            } finally {
              setIsRestoring(false);
            }
          }
        }
      ]
    );
  };

  const handleClearPendingPurchases = async () => {
    showDialog(
      'Clear Cached Purchases',
      'This will clear locally cached purchase data. Use this if you\'re getting "Item already owned" errors in TestFlight after clearing Apple\'s sandbox purchase history. Continue?',
      [
        { text: 'Cancel', style: 'cancel', onPress: hideDialog },
        {
          text: 'Clear',
          style: 'default',
          onPress: async () => {
            hideDialog();
            setIsClearing(true);
            try {
              await clearPendingPurchases();
              showDialog(
                'Cleared',
                'Cached purchases have been cleared. You should now be able to test subscriptions again.',
                [{ text: 'OK', style: 'cancel', onPress: hideDialog }]
              );
            } catch (error) {
              showDialog(
                'Clear Failed',
                'Could not clear cached purchases. Please try again later.',
                [{ text: 'OK', style: 'cancel', onPress: hideDialog }]
              );
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Current Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Subscription</Text>
          
          <View style={styles.statusContainer}>
            <View style={[styles.badge, isPro && status?.isActive ? styles.badgePro : styles.badgeFree]}>
              <Text style={styles.badgeText}>
                {isPro && status?.isActive ? '⭐ PRO' : 'FREE'}
              </Text>
            </View>
            <Text style={styles.statusText}>
              {isPro && status?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {status && (
            <View style={styles.detailsContainer}>
              {status?.expirationDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {status?.isActive ? 'Expires on:' : 'Expired on:'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatDate(String(status.expirationDate))}
                  </Text>
                </View>
              )}
              
              {status?.platform && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Platform:</Text>
                  <Text style={styles.detailValue}>
                    {status.platform === 'ios' ? 'App Store' : 'Google Play'}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, status?.isActive ? styles.activeText : styles.inactiveText]}>
                  {status?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              {status?.isTrialActive && status?.trialEndsAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trial ends:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(String(status.trialEndsAt))}
                  </Text>
                </View>
              )}

              {status?.isGracePeriodActive && status?.gracePeriodEndsAt && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.warningText]}>Grace Period:</Text>
                  <Text style={[styles.detailValue, styles.warningText]}>
                    Ends {formatDate(String(status.gracePeriodEndsAt))}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Usage Card */}
        {limits && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Usage</Text>
            
            <View style={styles.usageContainer}>
              <UsageRow 
                label="Family Members" 
                current={limits.teamMembersLimit.currentTotal}
                max={limits.teamMembersLimit.max}
              />
              <UsageRow 
                label="Allowance Intervals" 
                current={limits.allowanceIntervalsLimit.currentTotal}
                max={limits.allowanceIntervalsLimit.max}
              />
              <UsageRow 
                label="Tasks" 
                current={limits.taskItemsLimit.currentTotal}
                max={limits.taskItemsLimit.max}
              />
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {(isPro || (status && status?.expirationDate !== null && status?.expirationDate !== undefined && status?.isActive === false)) && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleManageSubscription}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                Manage Subscription
              </Text>
              <Text style={styles.primaryButtonSubtext}>
                Cancel or change plan in {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
              </Text>
            </TouchableOpacity>
          )}

          {((__DEV__ && status && status?.expirationDate !== null && status?.expirationDate !== undefined && status?.isActive === false)) && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleRestorePurchases}
              disabled={isLoading || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator color="#007AFF" />
                ) : (
                <>
                  <Text style={styles.secondaryButtonText}>
                    Restore Purchases
                  </Text>
                  <Text style={styles.secondaryButtonSubtext}>
                    Already purchased? Restore your subscription
                  </Text>
                </>
            )}
            </TouchableOpacity>
          )}

          {__DEV__ && (
            <TouchableOpacity 
              style={[styles.secondaryButton, styles.debugButton]}
              onPress={handleClearPendingPurchases}
              disabled={isLoading || isClearing}
            >
              {isClearing ? (
                <ActivityIndicator color="#FF9800" />
                ) : (
                <>
                  <Text style={[styles.secondaryButtonText, styles.debugButtonText]}>
                    🧪 Clear Cached Purchases (TestFlight)
                  </Text>
                  <Text style={[styles.secondaryButtonSubtext, styles.debugButtonText]}>
                    Fix "already owned" errors after clearing sandbox history
                  </Text>
                </>
            )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Subscriptions are managed through your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
            You can cancel anytime without any cancellation fees.
          </Text>
        </View>

        {/* EULA Link (iOS only) */}
        {Platform.OS === 'ios' && (
          <View style={styles.eulaContainer}>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={styles.eulaLink}>Terms of Use (EULA)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </ScrollView>
  );
};

const UsageRow: React.FC<{ label: string; current: number; max: number }> = ({ 
  label, 
  current, 
  max 
}) => {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : (current / max) * 100;
  
  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageValue}>
          {current} / {isUnlimited ? '∞' : max}
        </Text>
      </View>
      {!isUnlimited && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 52,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgePro: {
    backgroundColor: '#FFD700',
  },
  badgeFree: {
    backgroundColor: '#E0E0E0',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  activeText: {
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#FF9800',
  },
  warningText: {
    color: '#F44336',
  },
  usageContainer: {
    gap: 16,
  },
  usageRow: {
    gap: 8,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  secondaryButtonSubtext: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  infoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  debugButton: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  debugButtonText: {
    color: '#F57C00',
  },
  eulaContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  eulaLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
