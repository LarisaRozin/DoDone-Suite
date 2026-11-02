/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { TextInput, Snackbar } from 'react-native-paper';
import { Text, Button } from './StyledText';
import { colors } from '../defaultTheme';
import { AllowanceHistoryResponse, User, AllowanceHistoryApprovalRequest, useTeam, PagedListRequestBuilder, SortDirection } from '@larisarozin/dodone-shared';
import UserAvatar from './UserAvatar';
import { formatDateForDisplay } from '../utils/dateUtils';

interface AllowanceApprovalModalProps {
  visible: boolean;
  onClose: () => void;
  allowanceHistory: AllowanceHistoryResponse | null;
  user: User | undefined;
  isApprove: boolean; // true for approve, false for reject
  onSubmit: (request: AllowanceHistoryApprovalRequest) => Promise<void>;
  loading?: boolean;
  onShowMessage?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AllowanceApprovalModal: React.FC<AllowanceApprovalModalProps> = ({
  visible,
  onClose,
  allowanceHistory,
  user,
  isApprove,
  onSubmit,
  loading = false,
  onShowMessage,
}) => {

  const [approvedAmount, setApprovedAmount] = useState('');
  const [comment, setComment] = useState('');

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Helper function to show snackbar messages
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  }, []);

  // Team functionality for dynamic terminology
  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1)
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );
  const { teamDetails, fetchTeamDetails } = useTeam(teamRequest);

  // Load team details when component mounts
  useEffect(() => {
      fetchTeamDetails();
  }, [fetchTeamDetails]);

  // Helper function for dynamic allowance terminology
  const getAllowanceLabel = useCallback(() => {
    return teamDetails?.isBusiness ? 'Incentive' : 'Allowance';
  }, [teamDetails?.isBusiness]);

  // Reset fields when modal opens
  React.useEffect(() => {
    if (visible && allowanceHistory) {
      if (isApprove) {
        // For approve, pre-fill with calculated amount
        setApprovedAmount(allowanceHistory.calculatedAmount?.toString() || '0');
      } else {
        // For reject, amount will be 0
        setApprovedAmount('0');
      }
      setComment('');
    }
  }, [visible, allowanceHistory, isApprove]);

  const handleSubmit = async () => {
    if (!allowanceHistory) return;

    // Validation
    const amount = parseFloat(approvedAmount);
    if (isNaN(amount) || amount < 0) {
      showSnackbar('Please enter a valid amount (0 or greater)', 'error');
      return;
    }

    if (isApprove && amount === 0) {
      showSnackbar(`Approved ${getAllowanceLabel().toLowerCase()} amount cannot be 0. Use Reject instead.`, 'error');
      return;
    }

    if (!isApprove && !comment.trim()) {
      showSnackbar('Please provide a reason for rejection', 'error');
      return;
    }

    const request: AllowanceHistoryApprovalRequest = {
      id: allowanceHistory.id,
      approvedAmount: isApprove ? amount : 0,
      comment: comment.trim() || undefined,
    };

    try {
      await onSubmit(request);
      const successMessage = isApprove 
        ? `${getAllowanceLabel()} approved successfully` 
        : `${getAllowanceLabel()} rejected successfully`;
      // Pass success message to parent component
      if (onShowMessage) {
        onShowMessage(successMessage, 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting approval:', error);
      const errorMessage = isApprove
        ? `Failed to approve ${getAllowanceLabel().toLowerCase()}. Please try again.`
        : `Failed to reject ${getAllowanceLabel().toLowerCase()}. Please try again.`;
      // Pass error message to parent component
      if (onShowMessage) {
        onShowMessage(errorMessage, 'error');
      }
    }
  };

  if (!allowanceHistory || !user) {
    return null;
  }

  const modalTitle = isApprove ? `Approve ${getAllowanceLabel()}` : `Reject ${getAllowanceLabel()}`;
  const submitButtonText = isApprove ? 'Approve' : 'Reject';
  const submitButtonColor = isApprove ? colors.success : colors.error;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Allowance approval modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View 
            style={styles.modalContainer}
            accessible={false}
          >
            <TouchableWithoutFeedback>
              <View 
                style={styles.modalContent}
                accessible={true}
                accessibilityRole="none"
                accessibilityLabel="Allowance approval form"
              >
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Header */}
                  <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.title}>
                      {modalTitle}
                    </Text>
                  </View>

                  {/* User Info Section */}
                  <View style={styles.userSection}>
                    <UserAvatar
                      size={60}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      imageUri={user.avatarUri}
                    />
                    <View style={styles.userInfo}>
                      <Text variant="bodyLarge" style={styles.userName}>
                        {(() => {
                          const firstName = user?.firstName?.trim() || '';
                          const lastName = user?.lastName?.trim() || '';
                          return `${firstName} ${lastName}`.trim() || user?.userName || 'Unknown User';
                        })()}
                      </Text>
                      <Text variant="bodySmall" style={styles.userDates}>
                        {formatDateForDisplay(allowanceHistory.calculatedStartAt)} - {formatDateForDisplay(allowanceHistory.calculatedEndAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Read-only Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text variant="bodyMedium" style={styles.infoLabel}>Credits:</Text>
                      <Text variant="bodyMedium" style={styles.infoValue}>{allowanceHistory.totalCredits || 0}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text variant="bodyMedium" style={styles.infoLabel}>GPA:</Text>
                      <Text variant="bodyMedium" style={styles.infoValue}>{(allowanceHistory.gpa || 0).toFixed(1)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text variant="bodyMedium" style={styles.infoLabel}>Calculated Amount:</Text>
                      <Text variant="bodyMedium" style={styles.infoValue}>${(allowanceHistory.calculatedAmount || 0).toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Input Fields */}
                  <View style={styles.inputSection}>
                    {isApprove && (
                      <View style={styles.approvedAmountContainer}>
                        <Text variant="bodyMedium" style={styles.approvedAmountLabel}>Approved Amount *</Text>
                        <View style={styles.amountInputWrapper}>
                          <Text style={styles.dollarSign}>$</Text>
                          <TextInput
                            mode="outlined"
                            value={approvedAmount}
                            onChangeText={setApprovedAmount}
                            placeholder="0.00"
                            keyboardType="numeric"
                            style={styles.amountInput}
                            contentStyle={styles.amountInputContent}
                            outlineStyle={styles.amountInputOutline}
                            disabled={loading}
                          />
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.inputGroup}>
                      <Text variant="bodyMedium" style={styles.inputLabel}>
                        Comment {isApprove ? '(optional)' : '*'}
                      </Text>
                      <TextInput
                        mode="outlined"
                        value={comment}
                        onChangeText={setComment}
                        placeholder={isApprove ? 'Add a comment...' : `Reason for ${getAllowanceLabel().toLowerCase()} rejection...`}
                        multiline
                        numberOfLines={3}
                        style={[styles.textInput, styles.commentInput]}
                        outlineStyle={styles.commentInputOutline}
                        disabled={loading}
                        accessible={true}
                        accessibilityRole="text"
                        accessibilityLabel={isApprove ? "Comment for approval" : "Reason for rejection"}
                        accessibilityHint={isApprove ? "Enter optional comment about this allowance approval" : "Enter required reason for rejecting this allowance"}
                      />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionSection}>
                    <Button
                      mode="outlined"
                      onPress={onClose}
                      style={styles.cancelButton}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSubmit}
                      style={[styles.submitButton, { backgroundColor: submitButtonColor }]}
                      labelStyle={styles.submitButtonLabel}
                      disabled={loading}
                      loading={loading}
                    >
                      {loading ? 'Processing...' : submitButtonText}
                    </Button>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>

        {/* Snackbar */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={[
            styles.snackbar,
            snackbarType === 'success' && styles.snackbarSuccess,
            snackbarType === 'error' && styles.snackbarError,
          ]}
          theme={{
            colors: {
              surface: snackbarType === 'success' 
                ? colors.success 
                : snackbarType === 'error' 
                  ? colors.error 
                  : colors.primary,
              onSurface: colors.textOnPrimary,
            }
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    width: Math.min(screenWidth - 40, 400),
    maxHeight: screenHeight * 0.85,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Fredoka-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  userDates: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.textOnBackground,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    color: colors.textOnBackground,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.backgroundPaper,
  },
  commentInput: {
    minHeight: 80,
    borderRadius: 8,
  },
  commentInputOutline: {
    borderRadius: 8,
  },
  // Enhanced Approved Amount Styles
  approvedAmountContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent + '40', // 40% opacity green
    shadowColor: colors.accent,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  approvedAmountLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
  },
  dollarSign: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accent,
    marginRight: 6,
    lineHeight: 28,
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.backgroundPaper,
    minHeight: 48,
  },
  amountInputContent: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 28,
  },
  amountInputOutline: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8, // Add padding for better touch area
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.accentLight,
    minHeight: 44, // iOS recommended touch target
    borderRadius: 8,
  },
  submitButton: {
    flex: 1,
    minHeight: 44, // iOS recommended touch target
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  submitButtonLabel: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  snackbar: {
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  snackbarSuccess: {
    backgroundColor: colors.success,
  },
  snackbarError: {
    backgroundColor: colors.error,
  },
});

export default AllowanceApprovalModal;
