/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Reusable User Form Component
 * @format
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Switch, HelperText, RadioButton } from 'react-native-paper';
import { Text } from './StyledText';
import { User } from '@larisarozin/dodone-shared';
import { colors } from '../defaultTheme';
import AvatarSelection from './AvatarSelection';

export interface UserFormData {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  salutation: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
  isActive: boolean;
  intendedUse?: 'Business' | 'Personal';
  teamName?: string;
  teamDescription?: string;
  avatarUri?: string;
  emojiAvatar?: {
    emoji: string;
    backgroundColor: string;
  };
}

export interface UserFormValidation {
  userNameError: string;
  emailError: string;
  firstNameError: string;
  lastNameError: string;
  passwordError: string;
  confirmPasswordError: string;
}

interface UserFormProps {
  initialData?: User;
  isNew?: boolean;
  showPasswordFields?: boolean;
  showAdminSwitch?: boolean;
  showIsActiveSwitch?: boolean;
  showIntendedUse?: boolean;
  showTeamFields?: boolean;
  showAvatarSelection?: boolean;
  readOnlyAvatar?: boolean;
  formData: UserFormData;
  validation: UserFormValidation;
  onFormDataChange: (data: Partial<UserFormData>) => void;
  onValidationChange: (validation: Partial<UserFormValidation>) => void;
  disabled?: boolean;
  onPasswordFieldFocus?: () => void;
  onConfirmPasswordFieldFocus?: () => void;
  showValidationErrors?: boolean;
  onValidationReset?: () => void;
}

export default function UserForm({
  initialData,
  isNew = false,
  showPasswordFields = true,
  showAdminSwitch = true,
  showIsActiveSwitch = true,
  showIntendedUse = false,
  showTeamFields = false,
  showAvatarSelection = false,
  readOnlyAvatar = false,
  formData,
  validation,
  onFormDataChange,
  onValidationChange,
  disabled = false,
  onPasswordFieldFocus,
  onConfirmPasswordFieldFocus,
  showValidationErrors = true,
  onValidationReset,
}: UserFormProps) {
  // Password validation helper
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

  // Initialize form with existing user data
  useEffect(() => {
    if (!isNew && initialData) {
      const userWithAvatar = initialData as any; // Cast to handle avatar field
      onFormDataChange({
        userName: initialData.userName,
        email: initialData.email,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        middleName: initialData.middleName || '',
        salutation: initialData.salutation || '',
        isAdmin: initialData.isAdmin,
        isActive: initialData.isActive,
        avatarUri: userWithAvatar.avatarUri || undefined,
      });
    }
  }, [initialData, isNew, onFormDataChange]);

  // Real-time validation handlers
  const handlePasswordChange = (value: string) => {
    onFormDataChange({ password: value });
    
    // Reset validation state when user starts typing again
    if (onValidationReset) {
      onValidationReset();
    }
    
    // Always clear errors first
    onValidationChange({ passwordError: '' });
    
    // If password field is cleared, also clear confirm password error
    if (value.length === 0) {
      onValidationChange({ confirmPasswordError: '' });
    }
    
    // Only validate and show errors if showValidationErrors is true
    if (showValidationErrors && value.length > 0) {
      // Use helper function for validation
      const passwordError = validatePasswordStrength(value);
      if (passwordError) {
        onValidationChange({ passwordError });
      }
      
      // Re-validate confirm password if it's already filled
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        onValidationChange({ confirmPasswordError: 'Passwords do not match' });
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        onValidationChange({ confirmPasswordError: '' });
      }
    } else if (isNew) {
      // do nothing - password reset instructions from welcome email
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    onFormDataChange({ confirmPassword: value });
    
    // Reset validation state when user starts typing again
    if (onValidationReset) {
      onValidationReset();
    }
    
    // Always clear errors first
    onValidationChange({ confirmPasswordError: '' });
    
    // Only validate and show errors if showValidationErrors is true
    if (showValidationErrors) {
      if (value.length > 0) {
        // Validate confirm password in real-time
        if (value !== formData.password) {
          onValidationChange({ confirmPasswordError: 'Passwords do not match' });
        }
        // If passwords match, error is already cleared above
      } else if (formData.password.trim() && formData.password.length > 0) {
        // Show required message when they clear the field (if password is filled)
        onValidationChange({ confirmPasswordError: 'Please confirm your password' });
      }
    }
  };

  // Real-time validation for other fields
  const handleUserNameChange = (value: string) => {
    onFormDataChange({ userName: value });
    if (onValidationReset) {
      onValidationReset();
    }
    if (value.trim()) {
      onValidationChange({ userNameError: '' });
    }
  };

  const handleEmailChange = (value: string) => {
    onFormDataChange({ email: value });
    if (onValidationReset) {
      onValidationReset();
    }
    if (value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) {
        onValidationChange({ emailError: '' });
      }
    }
  };

  const handleFirstNameChange = (value: string) => {
    onFormDataChange({ firstName: value });
    if (onValidationReset) {
      onValidationReset();
    }
    if (value.trim()) {
      onValidationChange({ firstNameError: '' });
    }
  };

  const handleLastNameChange = (value: string) => {
    onFormDataChange({ lastName: value });
    if (onValidationReset) {
      onValidationReset();
    }
    if (value.trim()) {
      onValidationChange({ lastNameError: '' });
    }
  };

  return (
    <View style={localStyles.container}>
      {showIsActiveSwitch && (
        <View style={localStyles.switchContainer}>
          <Text style={localStyles.switchLabel}>Active</Text>
          <Switch
            value={formData.isActive}
            onValueChange={(value) => onFormDataChange({ isActive: value })}
            disabled={disabled}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Active status"
            accessibilityHint="Toggle user account active status"
            accessibilityState={{ checked: formData.isActive, disabled }}
          />
        </View>
      )}
      {showAdminSwitch && (
        <View style={localStyles.switchContainer}>
          <Text style={localStyles.switchLabel}>Administrator</Text>
          <Switch
            value={formData.isAdmin}
            onValueChange={(value) => onFormDataChange({ isAdmin: value })}
            disabled={disabled}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="Administrator privileges"
            accessibilityHint="Toggle administrator access rights"
            accessibilityState={{ checked: formData.isAdmin, disabled }}
          />
        </View>
      )}

      {showAvatarSelection && (
        <AvatarSelection
          currentImageUri={formData.avatarUri}
          currentEmojiAvatar={formData.emojiAvatar}
          firstName={formData.firstName}
          lastName={formData.lastName}
          userName={formData.userName}
          onImageSelect={(imageUri) => {
            // Clear emoji avatar when image is selected
            onFormDataChange({ avatarUri: imageUri, emojiAvatar: undefined });
          }}
          onEmojiAvatarSelect={(emojiData) => {
            // Clear image avatar when emoji is selected
            onFormDataChange({ emojiAvatar: emojiData, avatarUri: undefined });
          }}
          onImageRemove={() => onFormDataChange({ avatarUri: undefined, emojiAvatar: undefined })}
          disabled={disabled}
          readOnly={readOnlyAvatar}
        />
      )}

      <TextInput
        label="Username"
        value={formData.userName}
        onChangeText={handleUserNameChange}
        autoCapitalize="none"
        autoComplete="username"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        error={showValidationErrors && !!validation.userNameError}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Username input field"
        accessibilityHint="Enter your username for account login"
      />
      <HelperText 
        type="error" 
        visible={showValidationErrors && !!validation.userNameError} 
        style={[localStyles.helperText, { color: colors.error }]}
        theme={{ colors: { error: colors.error } }}
      >
        {validation.userNameError || ' '}
      </HelperText>

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={handleEmailChange}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        error={showValidationErrors && !!validation.emailError}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Email address input field"
        accessibilityHint="Enter your email address for account verification"
      />
      <HelperText 
        type="error" 
        visible={showValidationErrors && !!validation.emailError} 
        style={[localStyles.helperText, { color: colors.error }]}
        theme={{ colors: { error: colors.error } }}
      >
        {validation.emailError || ' '}
      </HelperText>



      <TextInput
        label="First Name"
        value={formData.firstName}
        onChangeText={handleFirstNameChange}
        autoCapitalize="words"
        autoComplete="given-name"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        error={showValidationErrors && !!validation.firstNameError}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="First name input field"
        accessibilityHint="Enter your first name"
      />
      <HelperText 
        type="error" 
        visible={showValidationErrors && !!validation.firstNameError} 
        style={[localStyles.helperText, { color: colors.error }]}
        theme={{ colors: { error: colors.error } }}
      >
        {validation.firstNameError || ' '}
      </HelperText>

      <TextInput
        label="Last Name"
        value={formData.lastName}
        onChangeText={handleLastNameChange}
        autoCapitalize="words"
        autoComplete="family-name"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        error={showValidationErrors && !!validation.lastNameError}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Last name input field"
        accessibilityHint="Enter your last name"
      />
      <HelperText 
        type="error" 
        visible={showValidationErrors && !!validation.lastNameError} 
        style={[localStyles.helperText, { color: colors.error }]}
        theme={{ colors: { error: colors.error } }}
      >
        {validation.lastNameError || ' '}
      </HelperText>

      <TextInput
        label="Middle Name (Optional)"
        value={formData.middleName}
        onChangeText={(value) => onFormDataChange({ middleName: value })}
        autoCapitalize="words"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Middle name input field"
        accessibilityHint="Enter your middle name, optional field"
      />
      <HelperText type="error" visible={false} style={localStyles.helperText}>
        {' '}
      </HelperText>

      <TextInput
        label="Salutation (Optional)"
        value={formData.salutation}
        onChangeText={(value) => onFormDataChange({ salutation: value })}
        autoCapitalize="words"
        style={[localStyles.inputField, localStyles.textInputStyle]}
        contentStyle={localStyles.textInputContentStyle}
        textColor={colors.primary}
        mode="outlined"
        theme={{ roundness: 12 }}
        disabled={disabled}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Salutation input field"
        accessibilityHint="Enter your preferred title, optional field"
      />
      <HelperText type="error" visible={false} style={localStyles.helperText}>
        {' '}
      </HelperText>

      {showPasswordFields && (
        <>
          <TextInput
            label="Password"
            placeholder="Must include: A-Z, a-z, 0-9, special character"
            value={formData.password}
            onChangeText={handlePasswordChange}
            onFocus={onPasswordFieldFocus}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            style={[localStyles.inputField, localStyles.textInputStyle]}
            contentStyle={localStyles.textInputContentStyle}
            textColor={colors.primary}
            mode="outlined"
            theme={{ roundness: 12 }}
            error={showValidationErrors && !!validation.passwordError}
            disabled={disabled}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Password input field"
            accessibilityHint="Enter secure password with uppercase, lowercase, number and special character"
          />
          <HelperText 
            type="error" 
            visible={showValidationErrors && !!validation.passwordError} 
            style={[localStyles.helperText, { color: colors.error }]}
            theme={{ colors: { error: colors.error } }}
          >
            {validation.passwordError || ' '}
          </HelperText>
          
          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            onFocus={onConfirmPasswordFieldFocus}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            style={[localStyles.inputField, localStyles.textInputStyle]}
            contentStyle={localStyles.textInputContentStyle}
            textColor={colors.primary}
            mode="outlined"
            theme={{ roundness: 12 }}
            error={showValidationErrors && !!validation.confirmPasswordError}
            disabled={disabled}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Confirm password input field"
            accessibilityHint="Re-enter your password to confirm it matches"
          />
          <HelperText 
            type="error" 
            visible={showValidationErrors && !!validation.confirmPasswordError} 
            style={[localStyles.helperText, { color: colors.error }]}
            theme={{ colors: { error: colors.error } }}
          >
            {validation.confirmPasswordError || ' '}
          </HelperText>
        </>
      )}

      {showIntendedUse && (
        <>
          <Text style={localStyles.sectionLabel}>Intended Use</Text>
          <RadioButton.Group
            onValueChange={(value) => onFormDataChange({ intendedUse: value as 'Business' | 'Personal' })}
            value={formData.intendedUse || 'Personal'}
          >
            <View style={localStyles.radioContainer}>
              <RadioButton.Item
                label="Personal"
                value="Personal"
                disabled={disabled}
                labelStyle={localStyles.radioLabel}
              />
              <RadioButton.Item
                label="Business"
                value="Business"
                disabled={disabled}
                labelStyle={localStyles.radioLabel}
              />
            </View>
          </RadioButton.Group>
          <HelperText type="error" visible={false} style={localStyles.helperText}>
            {' '}
          </HelperText>
        </>
      )}

      {showTeamFields && (
        <>
          <TextInput
            label={formData.intendedUse === 'Personal' ? "Family Name (Optional)" : "Team Name (Optional)"}
            value={formData.teamName || ''}
            onChangeText={(value) => onFormDataChange({ teamName: value })}
            autoCapitalize="words"
            style={[localStyles.inputField, localStyles.textInputStyle]}
            contentStyle={localStyles.textInputContentStyle}
            textColor={colors.primary}
            mode="outlined"
            theme={{ roundness: 12 }}
            disabled={disabled}
          />
          <HelperText type="error" visible={false} style={localStyles.helperText}>
            {' '}
          </HelperText>

          <TextInput
            label={formData.intendedUse === 'Personal' ? "Family Description (Optional)" : "Team Description (Optional)"}
            value={formData.teamDescription || ''}
            onChangeText={(value) => onFormDataChange({ teamDescription: value })}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
            style={[localStyles.inputField, localStyles.textInputStyle]}
            contentStyle={localStyles.textInputContentStyle}
            textColor={colors.primary}
            mode="outlined"
            theme={{ roundness: 12 }}
            disabled={disabled}
          />
          <HelperText type="error" visible={false} style={localStyles.helperText}>
            {' '}
          </HelperText>
        </>
      )}



    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputField: {
    marginBottom: 0,
  },
  textInputStyle: {
    backgroundColor: colors.backgroundPaper,
  },
  textInputContentStyle: {
    paddingHorizontal: 12,
  },
  helperText: {
    minHeight: 18,
    marginTop: 0,
    marginBottom: 2,
    fontSize: 14,
    paddingHorizontal: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  radioContainer: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    color: colors.textPrimary,
  },
});
