/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Keyboard, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, Linking } from 'react-native';
import { Snackbar } from '../components/StyledText';
import { Text, Button } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RegisterRequest } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';
import UserForm, { UserFormValidation } from '../components/UserForm';
import { useUserForm } from '../hooks/useUserForm';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, fonts, styles } from '../defaultTheme';
import nativeStorage from '../utils/nativeStorage';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Detect orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription?.remove();
  }, []);

  const {
    formData,
    validation,
    updateFormData,
    updateValidation,
    validateForm,
  } = useUserForm();

  const apiClient = createApiClient(config.API_BASE_URL, '');

  const handleValidationReset = () => {
    setShowValidationErrors(false);
  };

  const scrollToFirstError = (validationErrors: UserFormValidation) => {
    // Define the order of fields as they appear on the form
    const errorOrder = [
      'userNameError',
      'emailError', 
      'firstNameError',
      'lastNameError',
      'passwordError',
      'confirmPasswordError'
    ] as const;

    // Find the first field with an error
    const firstError = errorOrder.find(errorKey => validationErrors[errorKey]);
    
    if (firstError && scrollViewRef.current) {
      // Approximate scroll positions based on field order and spacing
      // Each field (input + helper text) is roughly 76px in height
      const scrollPositions = {
        userNameError: 0,
        emailError: 76,
        firstNameError: 152, 
        lastNameError: 228,
        passwordError: 380, // After middle name (304) and salutation (380)
        confirmPasswordError: 456
      };
      
      const scrollPosition = Math.max(0, scrollPositions[firstError] - 20); // Add 20px padding from top
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true
      });
    }
  };

  const getDeviceId = async (): Promise<string> => {
    // Generate or retrieve a unique device ID
    let deviceId = await nativeStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await nativeStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  const handleRegister = async () => {
    setShowValidationErrors(true);
    const validationResult = validateForm(true, true);
    
    if (!validationResult.isValid) {
      // Small delay to let validation errors render in UI
      setTimeout(() => {
        scrollToFirstError(validationResult.validationErrors);
      }, 16); // One frame at 60fps
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userData: RegisterRequest = {
        userName: formData.userName.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        middleName: formData.middleName.trim() || undefined,
        salutation: formData.salutation.trim() || undefined,
        password: formData.password,
        teamName: formData.teamName?.trim() || undefined,
        teamDescription: formData.teamDescription?.trim() || undefined,
        isBusiness: formData.intendedUse === 'Business',
        platform: Platform.OS,
        deviceId: await getDeviceId(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Send IANA format
      };

      const response = await apiClient.auth.register(userData);

      if (!response || !response.success) {
        setError(`Failed to create account: ${response?.message || 'Unknown error'} `);
        console.error('Error creating user: ', response?.message);
        return;
      }

      setSuccess('Account created successfully! You can now log in.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Error creating account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handlePrivacyPolicyPress = () => {
    const privacyPolicyUrl = `${config.CLIENT_BASE_URL}/privacy-policy`;
    Linking.openURL(privacyPolicyUrl).catch(err => {
      console.error('Failed to open privacy policy URL:', err);
    });
  };

  return (
    <KeyboardAvoidingView 
      style={localStyles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.primaryContainer, { 
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 20),
        paddingLeft: Math.max(insets.left, 12),
        paddingRight: Math.max(insets.right, 12),
      }]}>
        <Text variant="displaySmall" style={styles.gameTitle}>
          Create Account
        </Text>

        <ScrollView
          // @ts-ignore - ref prop type issue in newer TypeScript versions
          ref={scrollViewRef}
          style={[isLandscape ? styles.formContainerLandscape : styles.formContainer, localStyles.fullScrollView]}
          contentContainerStyle={localStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
        >
            <UserForm
              isNew={true}
              showPasswordFields={true}
              showAdminSwitch={false}
              showIsActiveSwitch={false}
              showIntendedUse={true}
              showTeamFields={true}
              formData={formData}
              validation={validation}
              onFormDataChange={updateFormData}
              onValidationChange={updateValidation}
              disabled={saving}
              showValidationErrors={showValidationErrors}
              onValidationReset={handleValidationReset}
            />

            <View style={localStyles.privacyPolicyAgreement}>
              <Text style={localStyles.privacyAgreementText}>
                By registering, you agree to our{' '}
                <Text 
                  style={localStyles.privacyPolicyLink} 
                  onPress={handlePrivacyPolicyPress}
                  accessibilityRole="link"
                  accessibilityLabel="Privacy Policy"
                  accessibilityHint="Open privacy policy in browser"
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <View style={isLandscape ? localStyles.buttonRow : localStyles.buttonColumn}>
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={saving}
                disabled={saving}
                style={[styles.gameButton, isLandscape && localStyles.landscapeButton]}
                accessibilityRole="button"
                accessibilityLabel="Register"
                accessibilityHint="Create new account with the provided information"
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                <Text variant='labelLarge' style={styles.primaryButtonText}>Register</Text>
              </Button>
              {/* <Text style={localStyles.loginLinkText}>
                Already have an account? 
              </Text> */}
              <Button
                mode="outlined"
                onPress={handleLoginPress}
                disabled={saving}
                style={[styles.outlineButton, isLandscape && localStyles.landscapeButton]}
                accessibilityRole="button"
                accessibilityLabel="Already registered? Login"
                accessibilityHint="Navigate to login screen if you already have an account"
                accessibilityState={{ disabled: saving }}
              >
                <Text variant='labelSmall' style={styles.outlineButtonTextSmall}>Already registered? Login</Text>
              </Button>
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
  );
}

const localStyles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  fullScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  successSnackbar: {
    backgroundColor: colors.success,
  },
  errorSnackbar: {
    backgroundColor: colors.error,
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
  landscapeButton: {
    flex: 1,
    maxWidth: 220,
  },
  loginLinkContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  loginLinkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontFamily: fonts.fredoka,
    fontWeight: '600',
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  privacyPolicyAgreement: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  privacyAgreementText: {
    fontFamily: fonts.fredoka,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyPolicyLink: {
    fontFamily: fonts.fredoka,
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
