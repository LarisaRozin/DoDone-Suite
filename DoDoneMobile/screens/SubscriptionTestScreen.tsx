/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionAction, SubscriptionTier, UNLIMITED } from '../types/subscription';
import { UpgradeModal } from '../components/UpgradeModal';
import { useSubscriptionCheck } from '../hooks/useSubscriptionCheck';

/**
 * Debug screen for testing subscription functionality
 * Shows current limits, status, and allows testing validation
 * 
 * TODO: Remove this screen or make it admin-only before production
 */
export default function SubscriptionTestScreen() {
  const {
    limits,
    status,
    error,
    refreshLimits,
    refreshStatus,
    validateAction,
    isPro,
  } = useSubscription();

  const {
    upgradeModalVisible,
    upgradeMessage,
    hideUpgradeModal,
    checkCanAddTeamMember,
    checkCanAddAllowanceInterval,
    checkCanAddTaskItem,
  } = useSubscriptionCheck();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshLimits(), refreshStatus()]);
    console.log('status:', status);
    console.log('limits:', limits);
    setRefreshing(false);
  };

  const handleTestValidation = async (action: SubscriptionAction, actionName: string) => {
    const result = await validateAction(action);
    Alert.alert(
      'Validation Result',
      `Action: ${actionName}\n` +
      `Allowed: ${result.isAllowed ? 'Yes' : 'No'}\n` +
      `Current Tier: ${result.currentTier}\n` +
      `${!result.isAllowed ? `Reason: ${result.reason}\nUpgrade to: ${result.upgradeRequired}` : ''}`
    );
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.title}>🧪 Subscription Test Screen</Text>
        <Text style={styles.subtitle}>For development testing only</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Status</Text>
          {status ? (
            <View style={styles.card}>
              <InfoRow label="Current Tier" value={SubscriptionTier[status.currentTier]} />
              <InfoRow label="Is Active" value={status.isActive ? 'Yes' : 'No'} />
              <InfoRow label="Trial Active" value={status.isTrialActive ? 'Yes' : 'No'} />
              <InfoRow label="Trial Ends" value={formatDate(status.trialEndsAt)} />
              <InfoRow label="Grace Period Active" value={status.isGracePeriodActive ? 'Yes' : 'No'} />
              <InfoRow label="Grace Period Ends" value={formatDate(status.gracePeriodEndsAt)} />
              <InfoRow label="Expires" value={formatDate(status.expirationDate)} />
              <InfoRow label="Platform" value={status.platform || 'N/A'} />
            </View>
          ) : (
            <Text style={styles.noData}>No status data loaded</Text>
          )}
        </View>

        {/* Limits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Limits & Usage</Text>
          {limits ? (
            <>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>
                  {SubscriptionTier[limits.subscriptionTier]} TIER
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>Resource Limits</Text>
                <LimitRow
                  label="Team Members"
                  current={limits.teamMembersLimit.currentTotal}
                  max={limits.teamMembersLimit.max}
                  canAdd={limits.teamMembersLimit.canAdd}
                />
                <LimitRow
                  label="Allowance Intervals"
                  current={limits.allowanceIntervalsLimit.currentTotal}
                  max={limits.allowanceIntervalsLimit.max}
                  canAdd={limits.allowanceIntervalsLimit.canAdd}
                />
                <LimitRow
                  label="Task Items"
                  current={limits.taskItemsLimit.currentTotal}
                  max={limits.taskItemsLimit.max}
                  canAdd={limits.taskItemsLimit.canAdd}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>Feature Access</Text>
                <FeatureRow label="Bonuses" enabled={limits.bonuses} />
                <FeatureRow label="Grade Configuration" enabled={limits.gradeConfiguration} />
                <FeatureRow label="Multi-select" enabled={limits.multiselect} />
                <FeatureRow label="Private Tasks" enabled={limits.privateTasks} />
                <FeatureRow label="Proposed Tasks" enabled={limits.proposedTasks} />
                <FeatureRow label="Task Comments" enabled={limits.taskComments} />
                <FeatureRow label="Image Avatars" enabled={limits.imageAvatars} />
              </View>
            </>
          ) : (
            <Text style={styles.noData}>No limits data loaded</Text>
          )}
        </View>

        {/* Action Tests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Actions</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestValidation(SubscriptionAction.AddTeamMember, 'Add Team Member')}
            >
              <Text style={styles.testButtonText}>Test Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestValidation(SubscriptionAction.AddAllowanceInterval, 'Add Allowance Interval')}
            >
              <Text style={styles.testButtonText}>Test Add Interval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestValidation(SubscriptionAction.AddTaskItem, 'Add Task Item')}
            >
              <Text style={styles.testButtonText}>Test Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hook Tests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎣 Test Hooks (with modal)</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.testButton, styles.hookTestButton]}
              onPress={() => checkCanAddTeamMember({ showUpgradeModal: true })}
            >
              <Text style={styles.testButtonText}>Check Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.hookTestButton]}
              onPress={() => checkCanAddAllowanceInterval({ showUpgradeModal: true })}
            >
              <Text style={styles.testButtonText}>Check Add Interval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.hookTestButton]}
              onPress={() => checkCanAddTaskItem({ showUpgradeModal: true })}
            >
              <Text style={styles.testButtonText}>Check Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Helper Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Pull down to refresh data{'\n'}
            💡 Use hook tests to see upgrade modal{'\n'}
            💡 Current tier: {isPro ? 'PRO' : 'FREE'}
          </Text>
        </View>
      </ScrollView>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={hideUpgradeModal}
        message={upgradeMessage}
      />
    </SafeAreaView>
  );
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const LimitRow: React.FC<{
  label: string;
  current: number;
  max: number;
  canAdd: boolean;
}> = ({ label, current, max, canAdd }) => {
  const percentage = max > 0 && max !== UNLIMITED ? (current / max) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const atLimit = !canAdd;

  return (
    <View style={styles.limitRow}>
      <View style={styles.limitHeader}>
        <Text style={styles.limitLabel}>{label}</Text>
        <Text style={[styles.limitValue, atLimit && styles.limitValueWarning]}>
          {current} / {max === UNLIMITED ? '∞' : max}
          {atLimit && ' ⚠️'}
        </Text>
      </View>
      {max !== UNLIMITED && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(percentage, 100)}%` },
              isNearLimit && styles.progressFillWarning,
              atLimit && styles.progressFillError,
            ]}
          />
        </View>
      )}
      <Text style={[styles.canAddText, !canAdd && styles.canAddTextNo]}>
        Can add: {canAdd ? 'Yes ✓' : 'No ✗'}
      </Text>
    </View>
  );
};

const FeatureRow: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureLabel}>{label}</Text>
    <View style={[styles.featureBadge, enabled ? styles.featureBadgeEnabled : styles.featureBadgeDisabled]}>
      <Text style={styles.featureBadgeText}>{enabled ? '✓ Enabled' : '✗ Locked'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  limitRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#666',
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  limitValueWarning: {
    color: '#FF9800',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressFillWarning: {
    backgroundColor: '#FF9800',
  },
  progressFillError: {
    backgroundColor: '#F44336',
  },
  canAddText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  canAddTextNo: {
    color: '#F44336',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureLabel: {
    fontSize: 14,
    color: '#333',
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgeEnabled: {
    backgroundColor: '#E8F5E9',
  },
  featureBadgeDisabled: {
    backgroundColor: '#FFEBEE',
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  hookTestButton: {
    backgroundColor: '#4CAF50',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
});
