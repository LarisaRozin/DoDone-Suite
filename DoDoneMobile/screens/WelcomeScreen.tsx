/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Linking } from 'react-native';
import { Text, Button } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, styles } from '../defaultTheme';
import config from '../config/config';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    // Set initial orientation
    updateOrientation();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription?.remove();
  }, []);

  const handlePrivacyPolicyPress = () => {
    const privacyPolicyUrl = `${config.CLIENT_BASE_URL}/privacy-policy`;
    Linking.openURL(privacyPolicyUrl).catch(err => {
      console.error('Failed to open privacy policy URL:', err);
    });
  };

  return (
    <View style={[styles.primaryContainer, isLandscape && localStyles.landscapeContainer]}>
      <Text variant='displayMedium' style={localStyles.primaryTitle}>WELCOME TO DODONE!</Text>
      <Text variant='titleMedium' style={localStyles.primarySubtitle}>
        It ought to be rewarding fun {'\n'} To get your tasks and chores {'\n'} all done. {'\n'}
        <Text variant='titleMedium' style={localStyles.secondarySubtitle}>You're very welcome to DoDone!</Text>
      </Text>
      <View style={[isLandscape ? localStyles.buttonRow : localStyles.buttonColumn, isLandscape && localStyles.landscapeButtonContainer]}>
        <Button 
          mode='contained' 
          style={[styles.gameButton, isLandscape && localStyles.landscapeButton]} 
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Log In"
          accessibilityHint="Navigate to login screen"
        >
          <Text variant='labelLarge' style={styles.primaryButtonText}>Log In</Text>
        </Button>
        <Button 
          mode='outlined' 
          style={[styles.outlineButton, isLandscape && localStyles.landscapeButton]} 
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          accessibilityLabel="Register"
          accessibilityHint="Navigate to registration screen"
        >
          <Text variant='labelLarge' style={styles.outlineButtonText}>Register</Text>
        </Button>
      </View>
      
      <View style={[localStyles.privacyPolicyContainer, { bottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          mode="text" 
          onPress={handlePrivacyPolicyPress} 
          style={localStyles.privacyPolicyButton}
          accessibilityRole="button"
          accessibilityLabel="Privacy Policy"
          accessibilityHint="Open privacy policy in browser"
        >
          <Text variant='labelSmall' style={localStyles.privacyPolicyText}>Privacy Policy</Text>
        </Button>
      </View>
    </View>
  );
}


const localStyles = StyleSheet.create({
  primaryTitle: {
    fontFamily: fonts.fredokaBold,
    width: '100%',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.highlight,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  primarySubtitle: {
    fontFamily: fonts.fredokaMedium,
    textAlign: 'center',
    marginBottom: 8,
    color: colors.textSecondary,
    width: '100%',
    paddingVertical: 8,
  },
  secondarySubtitle: {
    fontFamily: fonts.fredokaSemiBold,
    textAlign: 'center',
    marginBottom: 8,
    color: colors.accentDark,
    width: '100%',
    paddingVertical: 8,
  },
 
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 16,
  },
  landscapeContainer: {
    // Ensure proper alignment in landscape mode, especially for iOS
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: '100%',
  },
  landscapeButtonContainer: {
    // Ensure button container stays centered and doesn't stretch
    width: '100%',
    maxWidth: 480,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  landscapeButton: {
    width: 180,
    maxWidth: 180,
    minWidth: 180,
  },
  privacyPolicyContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  privacyPolicyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  privacyPolicyText: {
    fontFamily: fonts.fredoka,
    color: colors.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});