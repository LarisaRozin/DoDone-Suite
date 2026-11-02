/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { FAB } from 'react-native-paper';
import { Snackbar } from '../../components/StyledText';
import { Text } from '../../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_ROUTES, useAuth, User, SendPasswordResetEmailRequest, useTeam, PagedListRequestBuilder, SortDirection, useConfig } from '@larisarozin/dodone-shared';
import { createApiClient } from '../../utils/apiClientWrapper';
import config from '../../config/config';
import { parseEmojiAvatarUri } from '../../utils/emojiAvatarUtils';
import UserForm from '../../components/UserForm';
import { useUserForm } from '../../hooks/useUserForm';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { colors, fonts, styles } from '../../defaultTheme';

type TeamMemberEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TeamMemberEdit'>;
type TeamMemberEditScreenRouteProp = RouteProp<RootStackParamList, 'TeamMemberEdit'>;

interface TeamMemberEditScreenProps {
  navigation: TeamMemberEditScreenNavigationProp;
  route: TeamMemberEditScreenRouteProp;
}

export default function TeamMemberEditScreen({ navigation, route }: TeamMemberEditScreenProps) {

  const { baseUrl } = useConfig();
  const { user: currentUser, token, dispatch } = useAuth();
  const { user: editUser, isNew } = route.params;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  // Dirty flag for unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const initialFormDataRef = useRef<any>(null);
  const saveSuccessfulRef = useRef(false);
  
  // Store original avatar URI for current user (to restore on discard)
  const originalAvatarUriRef = useRef<string | undefined>(undefined);
  const isEditingCurrentUser = !isNew && editUser?.id === currentUser?.id;
  
  // Unsaved changes confirmation dialog
  const { dialogState: unsavedChangesDialogState, showDialog: showUnsavedChangesDialog, hideDialog: hideUnsavedChangesDialog } = useConfirmationDialog();
  const navigationActionRef = React.useRef<any>(null);
  
  // Delete confirmation dialog
  const { dialogState: deleteDialogState, showDialog: showDeleteDialog, hideDialog: hideDeleteDialog } = useConfirmationDialog();

  // Initialize useTeam hook to get team details
  const teamRequest = useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { teamDetails, fetchTeamDetails } = useTeam(teamRequest);

  const {
    formData,
    validation,
    updateFormData,
    updateValidation,
    validateForm,
  } = useUserForm();

  // Load team details when component mounts or user changes
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  const apiClient = createApiClient(config.API_BASE_URL, token || '');

  // Initialize form with existing user data
  React.useEffect(() => {
    if (!isNew && editUser) {
      // For current user, use their latest avatar from context; for others, use editUser data
      const sourceUser = isEditingCurrentUser ? currentUser : editUser;
      const avatarUri = sourceUser?.avatarUri;
      const emojiAvatarData = avatarUri ? parseEmojiAvatarUri(avatarUri) : null;
      
      // Store original avatar for current user (to restore on discard)
      if (isEditingCurrentUser && !originalAvatarUriRef.current) {
        originalAvatarUriRef.current = currentUser?.avatarUri;
      }
      
      updateFormData({
        userName: editUser.userName,
        email: editUser.email,
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        middleName: editUser.middleName || '',
        salutation: editUser.salutation || '',
        isAdmin: editUser.isAdmin,
        isActive: editUser.isActive,
        avatarUri: emojiAvatarData ? undefined : avatarUri, // Only set avatarUri if it's not an emoji
        emojiAvatar: emojiAvatarData ? {
          emoji: emojiAvatarData.emoji,
          backgroundColor: emojiAvatarData.backgroundColor
        } : undefined,
      });
    }
  }, [editUser, isNew, updateFormData, isEditingCurrentUser, currentUser]);

  // Save initial form data snapshot for dirty tracking - only after user data is properly loaded
  React.useEffect(() => {
    // For new users, capture the initial empty state once form is ready
    if (isNew) {
      if (formData.userName !== undefined && !initialFormDataRef.current) {
        initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
      }
    } else if (editUser) {
      // For existing users, wait until the form data has been populated with the actual user data
      // Check multiple key fields to ensure form is fully populated
      const isFormPopulated = formData.userName === editUser.userName && 
                             formData.email === editUser.email &&
                             formData.firstName === editUser.firstName &&
                             formData.lastName === editUser.lastName;
      
      if (isFormPopulated) {
        // Always update the snapshot when form is repopulated (e.g., after save)
        // This ensures that after a successful save, the new state becomes the baseline
        initialFormDataRef.current = JSON.parse(JSON.stringify(formData));
      }
    }
  }, [formData, editUser, isNew]);

  // Track form changes for dirty flag
  React.useEffect(() => {
    if (initialFormDataRef.current && formData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
      if (hasChanges !== isDirty) {
        setIsDirty(hasChanges);
      }
    }
  }, [formData, isDirty]);

  // Prevent navigation when there are unsaved changes
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow navigation if save was successful
      if (!isDirty || saveSuccessfulRef.current) {
        return;
      }

      e.preventDefault();
      navigationActionRef.current = e.data.action;

      showUnsavedChangesDialog(
        'Discard changes?',
        `Do you want to discard unsaved changes to this ${teamDetails?.isBusiness ? 'team member' : 'family member'}?`,
        [
          { 
            text: "Cancel", 
            style: 'cancel',
            onPress: () => {
              hideUnsavedChangesDialog();
            }
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Restore original avatar in auth context if editing current user
              if (isEditingCurrentUser && currentUser && dispatch && token) {
                const restoredUser = { ...currentUser, avatarUri: originalAvatarUriRef.current };
                dispatch({ type: 'LOGIN_SUCCESS', user: restoredUser, token });
              }
              
              setIsDirty(false);
              hideUnsavedChangesDialog();
              if (navigationActionRef.current) {
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, showUnsavedChangesDialog, hideUnsavedChangesDialog, teamDetails?.isBusiness, isEditingCurrentUser, currentUser, dispatch, token]);

  const handleDelete = async () => {
    const apiClient1 = createApiClient(baseUrl, token!);

    let isLastAdmin = false; 
    if (currentUser?.id === editUser?.id) {
      // If the current user is deleting their own account, check if they are the last admin
      isLastAdmin = await apiClient1.users.isLastTeamAdmin();
    }

    const teamOrFamily = teamDetails?.isBusiness ? 'team' : 'family';
    let message = '';
    if (currentUser?.id === editUser?.id && isLastAdmin) {
      message = `You are the last ${teamOrFamily} admin. Deleting this account will permanently delete:\n` +
        "• Your account, login credentials and personal information\n" +
        "• Your tasks and preferences\n" +
        `• All ${teamOrFamily} member accounts and data\n` +
        "This will be retained for legal compliance:\n" +
        "• Purchase and subscription history\n" +
        "\n" +
        "This action cannot be undone.";
    } else {
      message = currentUser?.id === editUser?.id 
        ? `Deleting this account will permanently delete:\n` +
          "• Your account, login credentials and personal information\n" +
          "• Your tasks and preferences\n" +
          "This will be retained for legal compliance:\n" +
          "• Purchase and subscription history\n" +
          "\n" +
          "This action cannot be undone."
        : `Deleting this account will permanently delete:\n` +
          `• This ${teamOrFamily} member account and login credentials\n` +
          `• This ${teamOrFamily} member's personal information and preferences\n` +
          `• This ${teamOrFamily} member's private tasks, groups, kinds and categories\n` +
          "This will be retained for legal compliance:\n" +
          "• Purchase and subscription history\n" +
          "\n" +
          "This action cannot be undone.";
    }

    showDeleteDialog(
      'Delete Account',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            hideDeleteDialog();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hideDeleteDialog();
            handleDeleteConfirmed();
          }
        }
      ]
    );
  };

  const handleDeleteConfirmed = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // TODO: use new API client functionality for creating api client in other methods, 
      // then rename apiClient1 to apiClient
      const apiClient1 = createApiClient(baseUrl, token!);
      const result = await apiClient1.users.delete(editUser?.id);
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete account');
      }
      setSuccess('Account deleted successfully');
      
      // If user is deleting their own account, logout and navigate to login after delay
      if (isEditingCurrentUser) {
        setTimeout(() => {
          dispatch({ type: 'LOGOUT' });
        }, 2000); // 2 second delay to allow user to read the toast
      } else {
        // If admin is deleting another user, just go back
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err: any) {
      // Handle JSON parse errors from malformed server responses
      let errorMessage = 'Failed to delete account';
      
      if (err?.message?.includes('JSON Parse error') || err?.message?.includes('Unexpected token')) {
        errorMessage = 'Server returned an invalid response. Please try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error("Error deleting user:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const validationResult = validateForm(isNew);
    if (!validationResult.isValid) return;
    if (!currentUser?.teamId) {
      setError(`No ${teamDetails?.isBusiness ? 'team' : 'family'} selected`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Use the correct request types based on whether we're creating or updating
      let userData: any;

      if (isNew) {
        // For new users, use UserCreateRequest fields only
        userData = {
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          isAdmin: formData.isAdmin,
          isActive: formData.isActive,
        };
        
        // Only add optional fields if they have values
        if (formData.middleName.trim()) {
          userData.middleName = formData.middleName.trim();
        }
        if (formData.salutation.trim()) {
          userData.salutation = formData.salutation.trim();
        }
      } else {
        // For updates, use UserUpdateRequest fields
        userData = {
          id: editUser?.id,
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          isAdmin: formData.isAdmin,
          isActive: formData.isActive,
          // Always include password - either the new one or empty string for no change
          password: formData.password.trim() || '',
        };
        
        // Only add optional fields if they have values
        if (formData.middleName.trim()) {
          userData.middleName = formData.middleName.trim();
        }
        if (formData.salutation.trim()) {
          userData.salutation = formData.salutation.trim();
        }
      }

      // Handle avatar URI - either image URI or emoji avatar converted to URI format
      if (formData.avatarUri) {
        userData.avatarUri = formData.avatarUri;
      } else if (formData.emojiAvatar) {
        userData.avatarUri = `emoji:{"emoji":"${formData.emojiAvatar.emoji}","backgroundColor":"${formData.emojiAvatar.backgroundColor}"}`;
      }

      // console.log('Saving user data:', userData);
      // console.log('API Endpoint:', isNew ? API_ROUTES.user.create : API_ROUTES.user.update);

      // Make the API call with better error handling
      let teamMember;
      try {
        teamMember = isNew 
          ? await apiClient.post<User>(API_ROUTES.user.create, userData)
          : await apiClient.put<User>(API_ROUTES.user.update, userData);
          
        // console.log('Save response:', teamMember);
      } catch (apiError: any) {
        // The apiClient doesn't expose the response body, so make a direct fetch to get it
        try {
          const directResponse = await fetch(
            config.API_BASE_URL + (isNew ? API_ROUTES.user.create : API_ROUTES.user.update), 
            {
              method: isNew ? 'POST' : 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(userData)
            }
          );
          
          const responseText = await directResponse.text();
          
          if (!directResponse.ok) {
            // Show the actual backend error message to the user
            setError(responseText || `Failed to save ${getMemberLabelLowercase()}`);
            console.error('Backend error:', {
              status: directResponse.status,
              message: responseText
            });
            return;
          }
        } catch (fetchError) {
          console.error('Error getting backend response:', fetchError);
        }
        
        throw apiError;
      }

      if (!teamMember) {
        setError(`Failed to save ${getMemberLabelLowercase()}`);
        console.error('Error saving user: No response from server');
        return;
      }
      else {
        // Update the user context if we're editing the current user
        if (isEditingCurrentUser && currentUser && dispatch && token) {
          const updatedUser = { ...currentUser, ...teamMember };
          dispatch({ type: 'LOGIN_SUCCESS', user: updatedUser, token });
          // Also update the original avatar reference for future comparisons
          originalAvatarUriRef.current = updatedUser.avatarUri;
        }
        
        // Reset dirty flag and mark save as successful to prevent confirmation dialog
        setIsDirty(false);
        saveSuccessfulRef.current = true;
        
        setSuccess(isNew ? `${getMemberLabel()} created successfully!` : `${getMemberLabel()} updated successfully!`);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError(`Error saving ${getMemberLabelLowercase()}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordFieldFocus = () => {
    // Scroll to make password field visible when keyboard appears
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 300);
  };

  const handleConfirmPasswordFieldFocus = () => {
    // Scroll to make confirm password field visible when keyboard appears
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleSendPasswordResetEmail = async () => {
    if (!editUser?.id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const request: SendPasswordResetEmailRequest = {
        userId: editUser.id,
      };

      const response = await apiClient.auth.sendPasswordResetEmail(request);

      if (response && response.success) {
        setSuccess('Password reset email sent successfully!');
      } else {
        setError(response?.message || 'Failed to send password reset email');
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError('Error sending password reset email');
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettings', {});
  };

  // Helper functions to get the correct text based on team type
  const getMemberLabel = () => {
    if (currentUser?.id === editUser?.id) {
      return 'Your Profile';
    }
    return teamDetails?.isBusiness ? 'Team Member' : 'Family Member';
  };

  const getMemberLabelLowercase = () => {
    if (currentUser?.id === editUser?.id) {
      return 'your profile';
    }
    return teamDetails?.isBusiness ? 'team member' : 'family member';
  };

  // Determine if password fields should be shown
  const showPasswordFields = currentUser?.id === editUser?.id;
  
  // Determine if password reset button should be shown (admin editing another user)
  const showPasswordResetButton = !isNew && currentUser?.isAdmin && currentUser?.id !== editUser?.id;

  // Determine if form should be disabled (non-admin editing another user)
  const isFormDisabledDueToPermissions = currentUser?.id !== editUser?.id && !currentUser?.isAdmin;

  return (
    <View style={localStyles.container}>
      <View style={localStyles.primaryContainer}>
        <Text variant="displaySmall" style={styles.gameTitle}>
          {isNew 
          ? `Add ${getMemberLabel()}` 
          : (currentUser?.id !== editUser?.id) ? `Edit ${getMemberLabel()}` : 'Edit Your Profile'}
        </Text>

        <ScrollView 
          // @ts-ignore - ref prop type issue in newer TypeScript versions
          ref={scrollViewRef}
          style={styles.formContainer}
          contentContainerStyle={[localStyles.scrollContent, { paddingBottom: insets.bottom + 150 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode="interactive"
        >
          <UserForm
            initialData={editUser}
            isNew={isNew}
            showPasswordFields={showPasswordFields}
            showAdminSwitch={true}
            showIsActiveSwitch={true}
            showIntendedUse={false}
            showTeamFields={false}
            showAvatarSelection={currentUser?.id === editUser?.id}
            readOnlyAvatar={!isNew && currentUser?.id !== editUser?.id}
            formData={formData}
            validation={validation}
            onFormDataChange={updateFormData}
            onValidationChange={updateValidation}
            disabled={saving || isFormDisabledDueToPermissions}
            onPasswordFieldFocus={handlePasswordFieldFocus}
            onConfirmPasswordFieldFocus={handleConfirmPasswordFieldFocus}
          />
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

        {/* FAB for actions */}
        {!isFormDisabledDueToPermissions && (
          isNew ? (
            <FAB
              icon="content-save"
              onPress={handleSave}
              style={[
                localStyles.fab,
                {
                  bottom: insets.bottom + 48,
                  right: insets.right + 28,
                }
              ]}
              color="white"
              accessibilityRole="button"
              accessibilityLabel="Save"
              accessibilityHint={`Save this ${getMemberLabelLowercase()}`}
            />
          ) : (
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-vertical'}
              actions={[
                ...(showPasswordResetButton && currentUser?.id !== editUser?.id && currentUser?.isAdmin ? [{
                  icon: 'email',
                  label: 'Reset Password',
                  onPress: handleSendPasswordResetEmail,
                  style: { backgroundColor: colors.warning },
                  color: 'white',
                  labelTextColor: 'white',
                  accessibilityLabel: 'Reset Password',
                  accessibilityHint: 'Send password reset email to this user'
                }] : []),
                ...(currentUser?.id === editUser?.id ? [{
                  icon: 'cog',
                  label: 'Notification Preferences',
                  onPress: handleNavigateToNotificationSettings,
                  style: { backgroundColor: colors.primary },
                  color: 'white',
                  labelTextColor: 'white',
                  accessibilityLabel: 'Notification Preferences',
                  accessibilityHint: 'Configure your notification settings'
                }] : []),
                ...(currentUser?.isAdmin && (currentUser?.id === editUser?.id || !editUser?.isAdmin) ? [{
                  icon: 'delete',
                  label: 'Delete Account',
                  onPress: handleDelete,
                  style: { backgroundColor: colors.error },
                  color: 'white',
                  labelTextColor: 'white',
                  accessibilityLabel: 'Delete Account',
                  accessibilityHint: 'Delete this account'
                }] : []),
                {
                  icon: 'content-save',
                  label: 'Save',
                  onPress: handleSave,
                  style: { backgroundColor: colors.accent },
                  color: 'white',
                  labelTextColor: 'white',
                  accessibilityLabel: 'Save',
                  accessibilityHint: `Save changes to this ${getMemberLabelLowercase()}`
                },
              ]}
              onStateChange={({ open }) => setFabOpen(open)}
              style={{ paddingBottom: insets.bottom + 16, paddingRight: insets.right + 16 }}
              fabStyle={{ backgroundColor: colors.accent }}
              color="white"
              accessibilityLabel={fabOpen ? 'Close menu' : 'Open member actions menu'}
            />
          )
        )}

        {/* Unsaved Changes Confirmation Dialog */}
        <ConfirmationDialog
          visible={unsavedChangesDialogState.visible}
          title={unsavedChangesDialogState.title}
          message={unsavedChangesDialogState.message}
          buttons={unsavedChangesDialogState.buttons}
          onDismiss={hideUnsavedChangesDialog}
        />
        
        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          visible={deleteDialogState.visible}
          title={deleteDialogState.title}
          message={deleteDialogState.message}
          buttons={deleteDialogState.buttons}
          onDismiss={hideDeleteDialog}
        />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  primaryContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.backgroundDefault,
    width: '100%',
    padding: 12,
    paddingBottom: 120,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  successSnackbar: {
    backgroundColor: colors.success,
  },
  errorSnackbar: {
    backgroundColor: colors.error,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  deleteButtonText: {
    fontFamily: fonts.fredoka,
    fontWeight: '600',
    color: colors.error,
    marginTop: 21,
  },
  passwordResetSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordResetLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.textOnBackground,
  },
  passwordResetButton: {
    borderColor: colors.primary,
  },
  passwordResetButtonText: {
    fontFamily: fonts.fredoka,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 21,
  },
});
