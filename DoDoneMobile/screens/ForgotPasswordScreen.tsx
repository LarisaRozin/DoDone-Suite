/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Forgot Password Screen
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Snackbar } from '../components/StyledText';
import { Text, Button } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForgotPasswordRequest } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, styles } from '../defaultTheme';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ForgotPasswordScreenProps {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const insets = useSafeAreaInsets();

  const apiClient = createApiClient(config.API_BASE_URL, '');

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription?.remove();
  }, []);

  const validateEmail = (emailToValidate: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const request: ForgotPasswordRequest = {
        email: email.trim().toLowerCase(),
      };

      const response = await apiClient.auth.forgotPassword(request);

      if (response && response.success) {
        setSuccess('Password reset instructions have been sent to your email address.');
        setTimeout(() => {
          navigation.goBack();
        }, 3000);
      } else {
        setError(response?.message || 'Failed to send password reset email. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.primaryContainer, isLandscape && localStyles.landscapeContainer, { 
      paddingTop: Math.max(insets.top, 20),
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: Math.max(insets.left, 12),
      paddingRight: Math.max(insets.right, 12),
    }]}>
        {!isLandscape && (
          <Text variant="displaySmall" style={styles.gameTitle}>
            Reset Password
          </Text>
        )}
        <View style={styles.formContainer}>
          <Text variant="bodyMedium" style={localStyles.instructionText}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={localStyles.input}
            returnKeyType="done"
            onSubmitEditing={handleForgotPassword}
            disabled={loading}
            accessibilityRole="text"
            accessibilityLabel="Email Address"
            accessibilityHint="Enter your email address to receive password reset instructions"
            accessibilityState={{ disabled: loading }}
          />

          <View style={[isLandscape ? localStyles.buttonRow : localStyles.buttonColumn, isLandscape && localStyles.landscapeButtonContainer]}>
            <Button
              mode="contained"
              onPress={handleForgotPassword}
              loading={loading}
              disabled={loading || !!success}
              style={[styles.gameButton, isLandscape && localStyles.landscapeButton]}
            >
              <Text variant="labelLarge" style={styles.primaryButtonText}>
                Send Email
              </Text>
            </Button>

            <Button
              mode="outlined"
              onPress={handleBackToLogin}
              disabled={loading}
              style={[styles.outlineButton, isLandscape && localStyles.landscapeButton]}
            >
              <Text variant="labelLarge" style={styles.outlineButtonTextSmall}>
                Back to Login
              </Text>
            </Button>
          </View>
        </View>
        
        <Snackbar
          visible={!!success}
          onDismiss={() => setSuccess('')}
          duration={3000}
          style={localStyles.successSnackbar}
        >
          {success}
        </Snackbar>

        <Snackbar
          visible={!!error}
          onDismiss={() => setError('')}
          duration={5000}
          style={localStyles.errorSnackbar}
        >
          {error}
        </Snackbar>
    </View>
  );
}

const localStyles = StyleSheet.create({
  successSnackbar: {
    backgroundColor: colors.success,
  },
  errorSnackbar: {
    backgroundColor: colors.error,
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    color: colors.textOnBackground,
    lineHeight: 22,
  },
  input: {
    marginBottom: 0,
    marginTop: 0,
    backgroundColor: colors.backgroundPaper,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 0,
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
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
});
