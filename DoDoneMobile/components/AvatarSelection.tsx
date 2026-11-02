/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Snackbar } from './StyledText';
import { Text, Button, Card } from './StyledText';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import UserAvatar from './UserAvatar';
import { createEmojiAvatarUri } from '../utils/emojiAvatarUtils';
import { colors } from '../defaultTheme';
import { SubscriptionTier, useAuth } from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import config from '../config/config';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ConfirmationDialog from './ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { UpgradeModal } from '../components/UpgradeModal';


interface EmojiAvatarData {
  emoji: string;
  backgroundColor: string;
}

interface AvatarSelectionProps {
  currentImageUri?: string;
  currentEmojiAvatar?: EmojiAvatarData;
  firstName?: string;
  lastName?: string;
  userName?: string;
  onImageSelect: (imageUri: string) => void;
  onEmojiAvatarSelect: (emojiData: EmojiAvatarData) => void;
  onImageRemove: () => void;
  size?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

// Custom modal for avatar selection options
interface AvatarSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
  onSelectEmoji: () => void;
  onRemoveAvatar: () => void;
  hasCurrentAvatar: boolean;
  setUpgradeModalVisible?: (visible: boolean) => void;  
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
  onSelectEmoji,
  onRemoveAvatar,
  hasCurrentAvatar,
  setUpgradeModalVisible = () => { },
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
    accessible={true}
    accessibilityViewIsModal={true}
    accessibilityLabel="Avatar selection options"
  >
    <View 
      style={modalStyles.overlay}
      accessible={false}
    >
      <Card 
        style={modalStyles.modalCard}
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="Avatar selection menu"
      >
        <Card.Content style={modalStyles.modalContent}>
          <Text variant="headlineSmall" style={modalStyles.modalTitle}>
            Select Avatar
          </Text>
          
          <Text variant="bodyLarge" style={modalStyles.modalSubtitle}>
            Choose how you would like to set your avatar
          </Text>

          <View style={modalStyles.optionContainer}>
            <SubscriptionGate 
              requiredTier={SubscriptionTier.Pro}
              // requiresFeature={(limits) => limits.bonuses} 
              overlayWhenLocked
              onUpgradePress={() => {
                onClose();
                setUpgradeModalVisible(true);
              }}
            >
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => {
                  onClose();
                  onSelectCamera();
                }}
              >
                <Text style={modalStyles.optionText}>📷 Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => {
                  onClose();
                  onSelectLibrary();
                }}
              >
                <Text style={modalStyles.optionText}>🖼️ Photo Library</Text>
              </TouchableOpacity>
            </SubscriptionGate>

            <TouchableOpacity
              style={modalStyles.option}
              onPress={() => {
                onClose();
                onSelectEmoji();
              }}
            >
              <Text style={modalStyles.optionText}>😀 Emoji Avatar</Text>
            </TouchableOpacity>

            {hasCurrentAvatar && (
              <TouchableOpacity
                style={[modalStyles.option, modalStyles.destructiveOption]}
                onPress={() => {
                  onClose();
                  onRemoveAvatar();
                }}
              >
                <Text style={[modalStyles.optionText, modalStyles.destructiveText]}>🗑️ Remove Avatar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[modalStyles.option, modalStyles.cancelOption]}
              onPress={onClose}
            >
              <Text style={[modalStyles.optionText, modalStyles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </View>
  </Modal>
);

export default function AvatarSelection({
  currentImageUri,
  currentEmojiAvatar,
  firstName,
  lastName,
  userName,
  onImageSelect,
  onEmojiAvatarSelect,
  onImageRemove,
  size = 80,
  disabled = false,
  readOnly = false,
}: AvatarSelectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarSelectionModalVisible, setAvatarSelectionModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
  
  // Local state to track current avatar for immediate UI updates
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(currentImageUri);
  const [localEmojiAvatar, setLocalEmojiAvatar] = useState<EmojiAvatarData | undefined>(currentEmojiAvatar);
 
  // State for upgrade modal
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
 
  // Sync local state with props
  React.useEffect(() => {
    setLocalImageUri(currentImageUri);
  }, [currentImageUri]);
  
  React.useEffect(() => {
    setLocalEmojiAvatar(currentEmojiAvatar);
  }, [currentEmojiAvatar]);
  
  const { token, user, dispatch } = useAuth();
  const navigation = useNavigation<import('@react-navigation/native-stack').NativeStackNavigationProp<RootStackParamList>>();
  const apiClient = createApiClient(config.API_BASE_URL, token || '');
  const { dialogState, hideDialog, showDeleteConfirmation } = useConfirmationDialog();
  
  // Helper functions for snackbar toast notifications
  const showSuccessMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(false);
    setSnackbarVisible(true);
  };

  const showErrorMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarError(true);
    setSnackbarVisible(true);
  };
  const showImagePicker = () => {
    if (disabled) return;
    setAvatarSelectionModalVisible(true);
  };

  const openCamera = async () => {
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8 as const,
        saveToPhotos: false, // Prevent saving to photo library
        durationLimit: 30, // Limit video duration
        presentationStyle: 'fullScreen' as const,
      };

      // Use setTimeout to prevent blocking
      setTimeout(() => {
        launchCamera(options, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }
          
          if (response.errorCode || response.errorMessage) {
            console.error('Camera error:', response.errorCode, response.errorMessage);
            
            // Handle specific error codes
            if (response.errorCode === 'camera_unavailable') {
              showErrorMessage('Camera is not available on this device');
            } else if (response.errorCode === 'permission') {
              showErrorMessage('Camera permission is required. Please enable it in Settings.');
            } else {
              showErrorMessage(`Camera error: ${response.errorMessage || 'Unknown error'}`);
            }
            return;
          }
          
          if (response.assets && response.assets[0] && response.assets[0].uri) {
            handleImageSelected(response.assets[0]);
          } else {
            console.warn('No valid image received from camera');
            showErrorMessage('No image was captured. Please try again.');
          }
        });
      }, 100); // Small delay to prevent UI blocking
      
    } catch (error) {
      console.error('Error launching camera:', error);
      showErrorMessage('Failed to open camera. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    try {
      const options = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8 as const,
        selectionLimit: 1, // Only allow one image
        presentationStyle: 'fullScreen' as const,
      };

      // Use setTimeout to prevent blocking
      setTimeout(() => {
        launchImageLibrary(options, (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }
          
          if (response.errorCode || response.errorMessage) {
            console.error('Photo library error:', response.errorCode, response.errorMessage);
            
            // Handle specific error codes
            if (response.errorCode === 'permission') {
              showErrorMessage('Photo library permission is required. Please enable it in Settings.');
            } else {
              showErrorMessage(`Photo library error: ${response.errorMessage || 'Unknown error'}`);
            }
            return;
          }
          
          if (response.assets && response.assets[0] && response.assets[0].uri) {
            handleImageSelected(response.assets[0]);
          } else {
            console.warn('No valid image received from photo library');
            showErrorMessage('No image was selected. Please try again.');
          }
        });
      }, 100); // Small delay to prevent UI blocking
      
    } catch (error) {
      console.error('Error launching photo library:', error);
      showErrorMessage('Failed to open photo library. Please try again.');
    }
  };

  const handleImageSelected = async (asset: any) => {
    if (!asset || !asset.uri) {
      console.error('No URI provided in asset');
      showErrorMessage('Invalid image selected');
      return;
    }

    // Prevent multiple simultaneous uploads
    if (isUploading) {
      console.warn('Upload already in progress, ignoring new request');
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData with the file for React Native
      const formData = new FormData();
      
      // React Native requires this specific format for file uploads
      formData.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);

      // Use the API client for avatar upload
      const result = await apiClient.avatar.uploadAvatar(formData);
      
      if (result && result.fileName) {
        // Update local state immediately for instant UI feedback
        setLocalImageUri(result.fileName);
        setLocalEmojiAvatar(undefined);
        
        onImageSelect(result.fileName);
        showSuccessMessage('Avatar uploaded successfully!');
        
        // Update the user context with the new avatar
        if (user && dispatch && token) {
          const updatedUser = { ...user, avatarUri: result.fileName };
          dispatch({ type: 'LOGIN_SUCCESS', user: updatedUser, token });
        }
      } else {
        throw new Error('Upload failed - no fileName returned');
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showErrorMessage('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    showDeleteConfirmation(
      'Avatar',
      handleRemoveImage,
      'Remove Avatar',
      'Are you sure you want to remove your avatar?'
    );
  };

  const handleEmojiAvatarSelect = async (emojiData: EmojiAvatarData) => {
    setIsUploading(true);
    try {
      // Create emoji avatar URI that can be saved to the backend
      const emojiAvatarUri = createEmojiAvatarUri(emojiData.emoji, emojiData.backgroundColor);
      
      // Update local state immediately for instant UI feedback
      setLocalEmojiAvatar(emojiData);
      setLocalImageUri(undefined);
      
      // Save the emoji avatar data to parent form - this will be converted to URI format when saved
      onEmojiAvatarSelect(emojiData);
      showSuccessMessage('Emoji avatar saved successfully!');
      
      // Update the user context with the emoji avatar URI
      if (user && dispatch && token) {
        const updatedUser = { ...user, avatarUri: emojiAvatarUri };
        dispatch({ type: 'LOGIN_SUCCESS', user: updatedUser, token });
      }
    } catch (error) {
      console.error('Emoji avatar save failed:', error);
      showErrorMessage('Failed to save emoji avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploading(true);
    try {
      // Use the API client for avatar deletion
      const result = await apiClient.avatar.deleteAvatar();
      
      if (result) {
        // Update local state immediately for instant UI feedback
        setLocalImageUri(undefined);
        setLocalEmojiAvatar(undefined);
        
        onImageRemove();
        showSuccessMessage('Avatar removed successfully!');
        
        // Update the user context to remove the avatar
        if (user && dispatch && token) {
          const updatedUser = { ...user, avatarUri: undefined };
          dispatch({ type: 'LOGIN_SUCCESS', user: updatedUser, token });
        }
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Avatar delete failed:', error);
      showErrorMessage('Failed to delete avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Card style={styles.container}>
        <Card.Content style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            Profile Picture
          </Text>
          {!readOnly && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              Tap to change your avatar
            </Text>
          )}
          
          <View style={styles.avatarContainer}>
            <UserAvatar
              size={size}
              imageUri={localImageUri}
              emojiAvatar={localEmojiAvatar}
              firstName={firstName}
              lastName={lastName}
              userName={userName}
              onPress={readOnly ? undefined : showImagePicker}
              disabled={disabled || isUploading || readOnly}
              style={[styles.avatar, (disabled || isUploading) && styles.disabledAvatar]}
            />
          </View>
          
          {!readOnly && (
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={showImagePicker}
                disabled={disabled || isUploading}
                loading={isUploading}
                style={[styles.button, styles.primaryButton]}
                buttonColor={colors.buttonPrimary}
                textColor={colors.textOnPrimary}
                labelStyle={{ color: colors.textOnPrimary }}
                icon={isUploading ? undefined : "camera"}
              >
                {isUploading ? 'Uploading...' : (localImageUri || localEmojiAvatar ? 'Change Avatar' : 'Add Avatar')}
              </Button>
              
              {(localImageUri || localEmojiAvatar) && (
                <Button
                  mode="outlined"
                  onPress={removeImage}
                  disabled={disabled || isUploading}
                  loading={isUploading && !currentImageUri}
                  style={[styles.button, styles.removeButton]}
                  buttonColor="transparent"
                  textColor={colors.error}
                  icon={isUploading ? undefined : "delete"}
                >
                  {isUploading ? 'Removing...' : 'Remove Avatar'}
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal
        visible={avatarSelectionModalVisible}
        onClose={() => setAvatarSelectionModalVisible(false)}
        onSelectCamera={openCamera}
        onSelectLibrary={openImageLibrary}
        onSelectEmoji={() => {
          navigation.navigate('EmojiAvatar', {
            onSelect: (emoji: string, backgroundColor: string) => {
              handleEmojiAvatarSelect({ emoji, backgroundColor });
            },
            currentEmoji: localEmojiAvatar?.emoji,
            currentBackgroundColor: localEmojiAvatar?.backgroundColor,
          });
        }}
        onRemoveAvatar={removeImage}
        hasCurrentAvatar={!!(localImageUri || localEmojiAvatar)}
        setUpgradeModalVisible={setUpgradeModalVisible}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />

      {/* Toast Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={[
          snackbarStyles.snackbar,
          snackbarError ? { backgroundColor: colors.error } : { backgroundColor: colors.success }
        ]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
          labelStyle: { color: 'white' }
        }}
      >
        <Text style={snackbarStyles.snackbarText}>
          {snackbarMessage}
        </Text>
      </Snackbar>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    marginBottom: 24, // Add extra bottom margin for spacing from next field
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    backgroundColor: colors.backgroundPaper,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 6,
    textAlign: 'center',
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    opacity: 0.8,
  },
  avatarContainer: {
    marginBottom: 24,
    alignItems: 'center',
    padding: 4,
  },
  avatar: {
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  disabledAvatar: {
    opacity: 0.6,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  button: {
    minWidth: 180,
    borderRadius: 28,
    paddingVertical: 2,
  },
  primaryButton: {
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  removeButton: {
    borderColor: colors.error,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
});

// Modal styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    minWidth: 300,
    maxWidth: '90%',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  optionContainer: {
    gap: 8,
  },
  option: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  destructiveOption: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  cancelOption: {
    borderColor: colors.textSecondary,
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  destructiveText: {
    color: colors.error,
  },
  cancelText: {
    color: colors.textSecondary,
  },
});

// Snackbar styles
const snackbarStyles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: 42,
    left: 16,
    right: 16,
    borderRadius: 8,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  snackbarText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});
