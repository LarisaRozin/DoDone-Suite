/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { SubscriptionTier, TIER_FEATURES, UNLIMITED, SUBSCRIPTION_PRODUCT_IDS } from '../types/subscription';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-filled message/reason for upgrade */
  message?: string;
  /** Specific tier to highlight */
  suggestedTier?: SubscriptionTier;
}

/**
 * Modal that shows subscription upgrade options
 * Displays current limits, Pro features, and pricing
 * Memoized to prevent unnecessary re-renders
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = React.memo(({
  visible,
  onClose,
  message,
}) => {
  const { 
    limits, 
    products, 
    isLoadingProducts, 
    isPurchasing, 
    purchaseError,
    purchaseSuccess,
    initializePurchaseService,
    loadProducts,
    purchaseSubscription,
    clearPurchaseSuccess,
    simulatePurchaseSuccess,
  } = useSubscription();

  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Initialize purchase service and load products when modal opens
  useEffect(() => {
    if (visible) {
      const initialize = async () => {
        try {
          await initializePurchaseService();
          await loadProducts();
          setSelectedProductId(SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY)
        } catch (error) {
          console.error('Failed to initialize purchase flow:', error);
        }
      };
      initialize();
    } else {
      // Reset selected product when modal closes
      setSelectedProductId(null);
    }
    // Only depend on 'visible' - the functions are stable references from context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Find products for monthly and yearly subscriptions (memoized to prevent recalculation on every render)
  const monthlyProduct = useMemo(
    () => products.find(p => p.productId === SUBSCRIPTION_PRODUCT_IDS.PRO_MONTHLY),
    [products]
  );
  const yearlyProduct = useMemo(
    () => products.find(p => p.productId === SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY),
    [products]
  );

  const handleUpgrade = async (productId: string) => {
    setSelectedProductId(productId);
    
    try {
      await purchaseSubscription(productId);
      // If successful, modal will stay open until purchase is verified
      // Then it will be closed from the parent component after refresh
    } catch (error) {
      console.error('Purchase error:', error);
      // Error is already set in context, will be displayed in UI
    }
  };

  // Show purchase error if any
  useEffect(() => {
    if (purchaseError) {
      showDialog('Purchase Failed', purchaseError, [
        { text: 'OK', style: 'cancel', onPress: hideDialog }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseError]);

  // Show purchase success and close modal
  useEffect(() => {
    if (purchaseSuccess) {
      showDialog(
        'Welcome to Pro! 🎉', 
        'Your subscription is now active. Enjoy unlimited access to all premium features!',
        [
          { 
            text: 'Get Started', 
            style: 'default', 
            onPress: () => {
              hideDialog();
              clearPurchaseSuccess();
              onClose();
            }
          }
        ]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseSuccess]);

  // DEV ONLY: Simulate purchase for testing
  const handleSimulatePurchase = async () => {
    if (!selectedProductId) return;
    
    showDialog(
      'Simulate Purchase (DEV)',
      'This will simulate a successful purchase without going through the store. Continue?',
      [
        { text: 'Cancel', style: 'cancel', onPress: hideDialog },
        {
          text: 'Simulate',
          style: 'default',
          onPress: async () => {
            hideDialog();
            await simulatePurchaseSuccess(selectedProductId);
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageIcon}>💡</Text>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          {/* Current Usage Section */}
          {limits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Current Plan: FREE</Text>
              
              <View style={styles.limitsContainer}>
                <LimitRow
                  label="Family Members"
                  current={limits.teamMembersLimit.currentTotal}
                  max={limits.teamMembersLimit.max}
                />
                <LimitRow
                  label="Allowance Intervals"
                  current={limits.allowanceIntervalsLimit.currentTotal}
                  max={limits.allowanceIntervalsLimit.max}
                />
                <LimitRow
                  label="Tasks"
                  current={limits.taskItemsLimit.currentTotal}
                  max={limits.taskItemsLimit.max}
                />
              </View>
            </View>
          )}

          {/* Pro Features Section */}
          <View style={styles.section}>
            <View style={styles.proHeader}>
              <Text style={styles.proHeaderTitle}>Pro Plan</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>⭐ RECOMMENDED</Text>
              </View>
            </View>

            {isLoadingProducts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading pricing...</Text>
              </View>
            ) : (
              <>
                <View style={styles.pricingContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pricingOption,
                      selectedProductId === SUBSCRIPTION_PRODUCT_IDS.PRO_MONTHLY && styles.pricingOptionSelected,
                    ]}
                    onPress={() => setSelectedProductId(SUBSCRIPTION_PRODUCT_IDS.PRO_MONTHLY)}
                    disabled={isPurchasing}
                  >
                    <Text style={styles.pricingLabel}>Monthly</Text>
                    <Text style={styles.pricingAmount}>
                      {monthlyProduct?.localizedPrice || '$6.99'}
                    </Text>
                    <Text style={styles.pricingPer}>per month</Text>
                    {isPurchasing && selectedProductId === SUBSCRIPTION_PRODUCT_IDS.PRO_MONTHLY && (
                      <ActivityIndicator style={styles.purchasingIndicator} color="#007AFF" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pricingOption,
                      styles.pricingOptionHighlight,
                      selectedProductId === SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY && styles.pricingOptionSelected,
                    ]}
                    onPress={() => setSelectedProductId(SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY)}
                    disabled={isPurchasing}
                  >
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>SAVE 29%</Text>
                    </View>
                    <Text style={styles.pricingLabel}>Yearly</Text>
                    <Text style={styles.pricingAmount}>
                      {yearlyProduct?.localizedPrice || '$59.99'}
                    </Text>
                    <Text style={styles.pricingPer}>per year</Text>
                    <Text style={styles.pricingEquivalent}>
                      {yearlyProduct ? '(~$5.00/month)' : '($5.00/month)'}
                    </Text>
                    {isPurchasing && selectedProductId === SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY && (
                      <ActivityIndicator style={styles.purchasingIndicator} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Everything in FREE, plus:</Text>
              {TIER_FEATURES.PRO.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {isPurchasing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.processingText}>Processing purchase...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    (!selectedProductId || isLoadingProducts) && styles.upgradeButtonDisabled,
                  ]}
                  onPress={() => selectedProductId && handleUpgrade(selectedProductId)}
                  disabled={!selectedProductId || isLoadingProducts}
                >
                  <Text style={styles.upgradeButtonText}>
                    {selectedProductId ? 'Upgrade to Pro' : 'Select a plan above'}
                  </Text>
                </TouchableOpacity>
                
                {__DEV__ && selectedProductId && (
                  <TouchableOpacity
                    style={styles.devButton}
                    onPress={handleSimulatePurchase}
                  >
                    <Text style={styles.devButtonText}>
                      🧪 Simulate Success (DEV)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Free Features Reminder */}
          <View style={styles.freeSection}>
            <Text style={styles.freeSectionTitle}>FREE Plan Includes</Text>
            {TIER_FEATURES.FREE.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>•</Text>
                <Text style={styles.freeFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            Subscriptions will be charged to your {Platform.OS === 'ios' ? 'Apple' : 'Google Play'} account.
            Cancel anytime from your account settings.
          </Text>

          {Platform.OS === 'ios' && (
            <View style={styles.eulaContainer}>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                <Text style={styles.eulaLink}>Terms of Use (EULA)</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </Modal>
  );
});

const LimitRow: React.FC<{ label: string; current: number; max: number }> = React.memo(({ label, current, max }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isNearLimit = percentage >= 80;

  return (
    <View style={styles.limitRow}>
      <View style={styles.limitHeader}>
        <Text style={styles.limitLabel}>{label}</Text>
        <Text style={[styles.limitValue, isNearLimit && styles.limitValueWarning]}>
          {current} / {max === UNLIMITED ? '∞' : max}
        </Text>
      </View>
      {max !== UNLIMITED && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }, isNearLimit && styles.progressFillWarning]} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  limitsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  limitRow: {
    marginBottom: 16,
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
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressFillWarning: {
    backgroundColor: '#FF9800',
  },
  proHeader: {
    marginBottom: 16,
  },
  proHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pricingOption: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  pricingOptionHighlight: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  pricingOptionSelected: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  purchasingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  devButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  processingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pricingAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  pricingPer: {
    fontSize: 12,
    color: '#999',
  },
  pricingEquivalent: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  freeSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  freeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  freeFeatureText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: 12,
  },
  eulaContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  eulaLink: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
