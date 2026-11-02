/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Reset Password Screen
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Keyboard, StyleSheet, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { HelperText, Snackbar } from '../components/StyledText';
import { Text, Button } from '../components/StyledText';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResetPasswordRequest } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, styles } from '../defaultTheme';

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

interface ResetPasswordScreenProps {
  navigation: ResetPasswordScreenNavigationProp;
  route: ResetPasswordScreenRouteProp;
}

export default function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const { token, email } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  useEffect(() => {
    // Validate that we have a reset token from deep link
    if (!token || token.trim() === '') {
      console.log('ResetPasswordScreen - Missing token, showing error');
      setError('Invalid reset link. Please request a new password reset. No token received.');
      
      // If no token and user accessed this screen inappropriately, redirect after a delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 3000);
    } else {
      ; // Token is present, proceed normally
    }
  }, [token, navigation]);

  const validatePasswordStrength = (pwd: string) => {
    if (!pwd.trim()) {
      return 'Password is required';
    }
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one digit';
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');

    // Password validation
    const passwordValidationError = validatePasswordStrength(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      isValid = false;
    }
    
    // Confirm password validation
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else if (!confirmPassword.trim() && newPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const request: ResetPasswordRequest = {
        token,
        newPassword,
      };

      const response = await apiClient.auth.resetPassword(request);

      if (response && response.success) {
        setSuccess('Password reset successfully! You can now log in with your new password.');
        setTimeout(() => {
          // Reset navigation stack to ensure clean transition to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 3000);
      } else {
        setError(response?.message || 'Failed to reset password. The reset link may have expired.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again or request a new password reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Reset navigation stack to ensure clean transition to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={localStyles.safeArea}>
      <KeyboardAvoidingView 
        style={localStyles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={localStyles.container}>
          {!isLandscape && (
            <Text variant="displaySmall" style={styles.gameTitle}>
              Set New Password
            </Text>
          )}

          <ScrollView 
            style={[styles.formContainer, localStyles.fullScrollView]}
            contentContainerStyle={localStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            nestedScrollEnabled={true}
            onScrollBeginDrag={Keyboard.dismiss}
          >
            <View style={localStyles.scrollableArea}>
            <Text variant="bodyMedium" style={localStyles.instructionText}>
              {email ? `Setting new password for ${email}` : 'Enter your new password below. Make sure it meets all the security requirements.'}
            </Text>
            
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              style={localStyles.input}
              returnKeyType="next"
              disabled={loading || !!success}
              accessibilityRole="text"
              accessibilityLabel="New Password"
              accessibilityHint="Enter a new password that meets all security requirements"
              accessibilityState={{ disabled: loading || !!success }}
            />
            
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError('');
              }}
              secureTextEntry
              style={localStyles.input}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
              disabled={loading || !!success}
              accessibilityRole="text"
              accessibilityLabel="Confirm New Password"
              accessibilityHint="Re-enter your new password to confirm"
              accessibilityState={{ disabled: loading || !!success }}
            />
            
            <HelperText type="error" visible={!!confirmPasswordError}>
              {confirmPasswordError}
            </HelperText>

            <View style={localStyles.passwordRequirements}>
              <Text variant="bodySmall" style={localStyles.requirementsTitle}>
                Password Requirements:
              </Text>
              <Text variant="bodySmall" style={localStyles.requirementText}>
                • At least 6 characters long
              </Text>
              <Text variant="bodySmall" style={localStyles.requirementText}>
                • Contains uppercase and lowercase letters
              </Text>
              <Text variant="bodySmall" style={localStyles.requirementText}>
                • Contains at least one number
              </Text>
              <Text variant="bodySmall" style={localStyles.requirementText}>
                • Contains at least one special character
              </Text>
            </View>

            <View style={isLandscape ? localStyles.buttonRow : localStyles.buttonColumn}>
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading || !!success}
                style={[styles.gameButton, isLandscape && localStyles.landscapeButton]}
                accessibilityRole="button"
                accessibilityLabel="Reset Password"
                accessibilityHint="Update your password with the new password"
                accessibilityState={{ disabled: loading || !!success, busy: loading }}
              >
                <Text variant="labelLarge" style={styles.primaryButtonText}>
                  Reset Password
                </Text>
              </Button>

              <Button
                mode="outlined"
                onPress={handleBackToLogin}
                disabled={loading}
                style={[styles.outlineButton, isLandscape && localStyles.landscapeButton]}
                accessibilityRole="button"
                accessibilityLabel="Back to Login"
                accessibilityHint="Return to login screen"
                accessibilityState={{ disabled: loading }}
              >
                <Text variant="labelLarge" style={styles.outlineButtonTextSmall}>
                  Back to Login
                </Text>
              </Button>
            </View>
              </View>
          </ScrollView>
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
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fullScrollView: {
    flex: 1,
  },
  scrollableArea: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
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
  passwordRequirements: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.textOnBackground,
  },
  requirementText: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 0,
    marginBottom: 60,
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 60,
  },
  landscapeButton: {
    flex: 1,
    maxWidth: 220,
  },
  debugText: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 12,
  },
});
