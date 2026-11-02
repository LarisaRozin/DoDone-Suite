/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionTier } from '../types/subscription';
// import { styles } from '../defaultTheme';
import { colors, fonts } from '../defaultTheme';

interface SubscriptionGateProps {
  children?: ReactNode;
  /** Feature check function - if returns false, show upgrade prompt */
  requiresFeature?: (l: any) => boolean;
  /** Specific tier required */
  requiredTier?: SubscriptionTier;
  /** Message to show when feature is locked */
  lockedMessage?: string;
  /** Callback when upgrade button is pressed */
  onUpgradePress?: () => void;
  /** If true, render nothing when locked (instead of upgrade prompt) */
  hideWhenLocked?: boolean;
  /** If true, show inline upgrade message instead of blocking content */
  showInlineUpgrade?: boolean;
  /** If true, overlay the upgrade message on top of the content (shows content as incentive but prevents interaction) */
  overlayWhenLocked?: boolean;
}

/**
 * Component that conditionally renders content based on subscription tier
 * Shows upgrade prompt when user doesn't have required subscription level
 * 
 * @example
 * // Hide feature completely for free users
 * <SubscriptionGate requiredTier={SubscriptionTier.Pro} hideWhenLocked>
 *   <AdvancedFeature />
 * </SubscriptionGate>
 * 
 * @example
 * // Show upgrade prompt instead of feature
 * <SubscriptionGate 
 *   requiresFeature={(limits) => limits.bonuses} 
 *   lockedMessage="Upgrade to Pro to use bonuses"
 *   onUpgradePress={() => navigation.navigate('Upgrade')}
 * >
 *   <BonusSection />
 * </SubscriptionGate>
 * 
 * @example
 * // Show content but with inline upgrade banner
 * <SubscriptionGate 
 *   requiresFeature={(limits) => limits.multiselect} 
 *   showInlineUpgrade
 * >
 *   <MultiSelectButton disabled />
 * </SubscriptionGate>
 */
export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  requiresFeature,
  requiredTier,
  lockedMessage = 'This feature requires an upgrade\nTap to upgrade',
  onUpgradePress,
  hideWhenLocked = false,
  showInlineUpgrade = false,
  overlayWhenLocked = false,
}) => {
  const { limits, status } = useSubscription();

  // Determine if user has access
  let hasAccess = true;

  console.log('SubscriptionGate check - limits:', limits, 'status:', status);

  if (requiredTier !== undefined) {
    hasAccess = ((limits?.subscriptionTier ?? SubscriptionTier.Free) >= requiredTier && status?.isActive ) || status?.isGracePeriodActive === true || status?.isTrialActive === true;
  } else if (requiresFeature && limits) {
    hasAccess = requiresFeature(limits);
  }

  // If user has access, render children normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // If locked and should hide, render nothing
  if (hideWhenLocked) {
    return null;
  }

  // If overlay mode, show content with overlay on top
  if (overlayWhenLocked) {
    return (
      <View style={localStyles.overlayContainer}>
        <View style={localStyles.overlayContent} pointerEvents="none">
          {children}
        </View>
        <TouchableOpacity 
          style={localStyles.overlay}
          onPress={onUpgradePress}
          activeOpacity={0.9}
        >
          <UpgradePrompt message={lockedMessage} onPress={onUpgradePress} overlay />
        </TouchableOpacity>
      </View>
    );
  }

  // If showing inline upgrade, render both children and upgrade message
  if (showInlineUpgrade) {
    return (
      <View>
        {children}
        <UpgradePrompt message={lockedMessage} onPress={onUpgradePress} inline />
      </View>
    );
  }

  // Otherwise, show upgrade prompt instead of children
  return <UpgradePrompt message={lockedMessage} /> ;
};

/**
 * Internal component for rendering upgrade prompts
 */
const UpgradePrompt: React.FC<{ 
  message: string; 
  onPress?: () => void;
  inline?: boolean;
  overlay?: boolean;
}> = ({ message, inline = false, overlay = false }) => {
  // Handle newline characters in message (both \n and \\n)
  const formattedMessage = message.replace(/\\n/g, '\n');
  
  return (
    <View style={[
      localStyles.container, 
      inline && localStyles.inlineContainer,
      overlay && localStyles.overlayPrompt
    ]}>
      <View style={localStyles.iconContainer}>
        <Text style={localStyles.icon}>🔒</Text>
      </View>
      <Text style={localStyles.message}>{formattedMessage}</Text>
      {/* {onPress && (
        <TouchableOpacity style={localStyles.upgradeButton} onPress={onPress}>
          <Text style={localStyles.upgradeButtonText}>Upgrade to Pro</Text>
        </TouchableOpacity>
      )} */}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    backgroundColor: colors.backgroundDefault,
  },
  inlineContainer: {
    flex: 0,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // backgroundColor: '#fff',
    backgroundColor: colors.backgroundDefault,
  },
  overlayContainer: {
    paddingVertical: 12,
    marginVertical: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.highlightOutline,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 140,
  },
  overlayContent: {
    opacity: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(249, 249, 249, 0.85)',
    backgroundColor: colors.backgroundDefault + 'DD',
  },
  overlayPrompt: {
    flex: 0,
    backgroundColor: 'transparent',
    padding: 16,
  },
  iconContainer: {
    paddingVertical: 8,
  },
  icon: {
    fontSize: 30,
    opacity: 0.5,
  },
  message: {
    color: '#666',
    textAlign: 'center',
    paddingBottom: 16,
    fontSize: 14,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '600',
    opacity: 0.8,
  },
  upgradeButton: {
    backgroundColor: colors.buttonSecondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.fredokaMedium,
    fontWeight: '600',
  },
});
