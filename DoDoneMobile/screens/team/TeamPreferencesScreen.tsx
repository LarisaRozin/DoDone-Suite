/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Team Preferences Screen
 * @format
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Snackbar, HelperText } from '../../components/StyledText';
import { 
  TextInput, 
  ActivityIndicator, 
  FAB
} from 'react-native-paper';
import { useAuth, PagedListRequestBuilder, SortDirection } from '@larisarozin/dodone-shared';
import { useTeam, AllowanceIntervalType } from '@larisarozin/dodone-shared';
import { colors, styles } from '../../defaultTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { UpgradeModal } from '../../components/UpgradeModal';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useSubscriptionCheck } from '../../hooks/useSubscriptionCheck';

type TeamPreferencesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TeamPreferences'>;

interface TeamPreferencesScreenProps {
  navigation: TeamPreferencesScreenNavigationProp;
}

export default function TeamPreferencesScreen({ navigation: _navigation }: TeamPreferencesScreenProps) {
  const { user } = useAuth();
  const { bottom, right } = useSafeAreaInsets();

  // isDirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef({ name: '', description: '' });
  const navigationActionRef = useRef<any>(null);

  // State for upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { limits } = useSubscription();

  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1) // we don't need team members on this screen
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { 
    teamDetails, 
    loadingTeamDetails, 
    updatingTeamDetails, 
    updateTeamDetails,
    // Allowance interval functions
    allowanceIntervals,
    loadingAllowanceIntervals,
    fetchAllowanceIntervals
  } = useTeam(teamRequest);

  const intervalInfoText = teamDetails?.isBusiness
    ? "Want to reward your team members weekly for routine chores & maintenance, monthly or quarterly for complex tasks progress and add yearly bonus for good work? It's easy: just create an Incentive Interval for each scenario."
    : "Want to reward your kids weekly for routine chores, monthly for reading assignments and quarterly for grade reports? It's easy: just create an Allowance Interval for each scenario.";

  // Confirmation dialog hook
  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);

  // Form state - only basic team info now
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isBusiness: false,
  });

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
//   const [_hasChanges, setHasChanges] = useState(false);

  // Validation state - only for basic team info now
  const [validation, setValidation] = useState({
    nameError: '',
  });

  // Track initial values for isDirty comparison - only after team data is loaded
  useEffect(() => {
    if (teamDetails && formData.name === teamDetails.name && formData.description === (teamDetails.description || '')) {
      // Only set initial values once we're sure the form is populated with actual team data
      if (initialValuesRef.current.name === '' && initialValuesRef.current.description === '') {
        initialValuesRef.current = {
          name: teamDetails.name || '',
          description: teamDetails.description || '',
        };
      }
    }
  }, [teamDetails, formData.name, formData.description]);

  // Check if form has unsaved changes
  useEffect(() => {
    // Only compare if we have valid initial values (not empty defaults)
    if (initialValuesRef.current.name !== '' || initialValuesRef.current.description !== '') {
      const hasChanges = 
        formData.name !== initialValuesRef.current.name ||
        formData.description !== initialValuesRef.current.description;
      
      if (hasChanges !== isDirty) {
        setIsDirty(hasChanges);
      }
    }
  }, [formData.name, formData.description, isDirty]);

  // Navigation protection - warn if attempting to navigate with unsaved changes
  useEffect(() => {
    const unsubscribe = _navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || updatingTeamDetails) {
        return;
      }

      e.preventDefault();
      navigationActionRef.current = e.data.action;

      showDialog(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: hideDialog,
          },
          {
            text: 'Discard',
            onPress: () => {
              setIsDirty(false);
              hideDialog();
              if (navigationActionRef.current) {
                _navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, updatingTeamDetails, _navigation]);

  // Helper functions to get the correct text based on team type
  const getTeamLabel = useCallback(() => {
    return teamDetails?.isBusiness ? 'Team' : 'Family';
  }, [teamDetails?.isBusiness]);

  const getTeamLabelLowercase = useCallback(() => {
    return teamDetails?.isBusiness ? 'team' : 'family';
  }, [teamDetails?.isBusiness]);

  const getPreferencesTitle = useCallback(() => {
    return `${getTeamLabel()} Preferences`;
  }, [getTeamLabel]);



  // Determine if form should be disabled (non-admin users cannot edit team preferences)
  const isFormDisabledDueToPermissions = !user?.isAdmin;

  // // Load team details and allowance intervals when component mounts
  // useEffect(() => {
  //     fetchTeamDetails();
  //     fetchAllowanceIntervals();
  // }, [fetchTeamDetails, fetchAllowanceIntervals]);



  // Update form when team details are loaded
  useEffect(() => {
    if (teamDetails) {
      setFormData({
        name: teamDetails.name || '',
        description: teamDetails.description || '',
        isBusiness: teamDetails.isBusiness || false,
      });

      // Clear any validation errors that may have been set during initial loading
      setValidation({
        nameError: '',
      });
    }
  }, [teamDetails]);

  // Refresh allowance intervals when screen comes into focus
  // This ensures the interval list is updated after returning from AllowanceIntervalManagerScreen
  useFocusEffect(
    useCallback(() => {
      fetchAllowanceIntervals();
    }, [fetchAllowanceIntervals])
  );

  // Helper function to show snackbar messages with types
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // setHasChanges(true);
    
    // Clear validation errors when user starts typing/changing values
    if (field === 'name') {
      setValidation(prev => ({ ...prev, nameError: '' }));
    }
  };

  const validateForm = () => {
    const errors = {
      nameError: '',
    };

    // Team Name is required
    if (!formData.name.trim()) {
      errors.nameError = `${getTeamLabel()} name is required`;
    }

    setValidation(errors);
    
    // Return true if no errors
    return errors.nameError === '';
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!validateForm()) {
      showSnackbar('Please fix the validation errors before saving', 'error');
      return;
    }

    if (!user?.teamId || !teamDetails) {
      showSnackbar(`Error: ${getTeamLabel()} information not available`, 'error');
      return;
    }

    const updateRequest = {
      id: teamDetails.id,
      name: formData.name,
      description: formData.description,
      isBusiness: formData.isBusiness,
      createdAt: teamDetails.createdAt,
      updatedBy: user.id || 0,
      updatedByUser: teamDetails.updatedByUser,
      updatedAt: new Date().toISOString(),
    };

    const result = await updateTeamDetails(updateRequest);
    
    if (result) {
      // Reset isDirty after successful save
      setIsDirty(false);
      initialValuesRef.current = {
        name: formData.name,
        description: formData.description,
      };
      
      showSnackbar(`${getTeamLabel()} basic information updated successfully.`, 'success');
      setTimeout(() => {
        _navigation.goBack();
      }, 1500);
    } else {
      showSnackbar(`Failed to update ${getTeamLabelLowercase()} information`, 'error');
    }
  };

  const handleReset = () => {
    if (teamDetails) {
      setFormData({
        name: teamDetails.name,
        description: teamDetails.description || '',
        isBusiness: teamDetails.isBusiness,
      });
      // Reset the dirty flag since we're reverting to original values
      setIsDirty(false);
    }
  };

  const { checkCanAddAllowanceInterval, upgradeModalVisible, hideUpgradeModal  } = useSubscriptionCheck();

  const handleAddInterval = async (teamId: number, isBusiness: boolean) => {
    const canAdd = await checkCanAddAllowanceInterval({ showUpgradeModal: true });
    if (!canAdd) return;

    _navigation.navigate('AllowanceIntervalManager', {
      intervalId: undefined, // undefined means creating new
      teamId: teamId,
      isBusiness: isBusiness,
    });
}

  const confirmReset = () => {
    showDialog(
      'Reset Changes',
      `Reset ${getTeamLabelLowercase()} information?`,
      [
        { text: 'CANCEL', style: 'cancel', onPress: hideDialog },
        { text: 'RESET', style: 'destructive', onPress: () => { hideDialog(); handleReset(); } },
      ]
    );
  };

  if (loadingTeamDetails) {
    return (
      <View style={[styles.primaryContainer, localStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.primarySubtitle, localStyles.loadingText]}>
          Loading {getTeamLabelLowercase()} details...
        </Text>
      </View>
    );
  }

  if (!teamDetails) {
    return (
      <View style={[styles.primaryContainer, localStyles.centerContent]}>
        <Text style={styles.primarySubtitle}>
          Unable to load {getTeamLabelLowercase()} details
        </Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <ScrollView style={localStyles.scrollView} contentContainerStyle={localStyles.scrollContent}>
        
        {/* Title */}
        <Text variant="displaySmall" style={styles.gameTitle}>
          {getPreferencesTitle()}
        </Text>


        {/* Basic Information Card */}
        <Card style={localStyles.card}>
          <Card.Content style={localStyles.cardContent}>
            <TextInput
              label={`${getTeamLabel()} Name *`}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={[localStyles.input, localStyles.textInputStyle]}
              contentStyle={localStyles.textInputContentStyle}
              textColor={colors.primary}
              mode="outlined"
              theme={{
                roundness: 12,
              }}
              error={!!validation.nameError}
              disabled={updatingTeamDetails || isFormDisabledDueToPermissions}
              accessibilityRole="text"
              accessibilityLabel={`${getTeamLabel()} Name`}
              accessibilityHint={`Enter the name for your ${getTeamLabelLowercase()}`}
              accessibilityState={{ disabled: updatingTeamDetails || isFormDisabledDueToPermissions }}
            />
            {!!validation.nameError && !loadingTeamDetails && (
              <HelperText 
                type="error" 
                visible={true} 
                style={[localStyles.helperText, { color: colors.error }]}
                theme={{ colors: { error: colors.error } }}
              >
                {validation.nameError}
              </HelperText>
            )}
            
            <TextInput
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={[localStyles.input, localStyles.textInputStyle]}
              contentStyle={localStyles.textInputContentStyle}
              textColor={colors.primary}
              mode="outlined"
              multiline
              numberOfLines={3}
              theme={{
                roundness: 12,
              }}
              disabled={updatingTeamDetails || isFormDisabledDueToPermissions}
              accessibilityRole="text"
              accessibilityLabel="Description"
              accessibilityHint={`Enter an optional description for your ${getTeamLabelLowercase()}`}
              accessibilityState={{ disabled: updatingTeamDetails || isFormDisabledDueToPermissions }}
            />
          </Card.Content>
        </Card>

        {/* Allowance Intervals Section */}
        {teamDetails && (
          <>
          <Card style={localStyles.card}>
            <Card.Content style={localStyles.cardContent}>
              <Text variant="titleLarge" style={localStyles.sectionTitle}>
                {teamDetails.isBusiness ? 'Incentive' : 'Allowance'} Intervals
              </Text>
              <Text style={localStyles.infoLabel}>ℹ️ {intervalInfoText}</Text>

            <SubscriptionGate 
              requiresFeature={(l) => l.allowanceIntervalsLimit.canAdd} 
              lockedMessage='Upgrade required to add Interval\nTap to upgrade'
              // lockedMessage='Free tier will calculate allowance for the 1st available active interval. Please select a single active interval.\nTap to upgrade'
              overlayWhenLocked
              onUpgradePress={() => setShowUpgradeModal(true)}
            >
                {!isFormDisabledDueToPermissions && (
                  <Button
                    mode="outlined"
                    onPress={() => handleAddInterval(teamDetails.id, teamDetails.isBusiness)}
                    compact
                    loading={loadingAllowanceIntervals}
                    disabled={loadingAllowanceIntervals}
                    style={[localStyles.addIntervalButton]}
                    accessibilityRole="button"
                    accessibilityLabel="Add Interval"
                    accessibilityHint={`Add a new ${teamDetails.isBusiness ? 'incentive' : 'allowance'} interval configuration`}
                    accessibilityState={{ disabled: loadingAllowanceIntervals, busy: loadingAllowanceIntervals }}
                  >
                    <Text variant='labelLarge'>Add Interval</Text>
                  </Button> 
                )}
              </SubscriptionGate>

              {loadingAllowanceIntervals ? (
                <View style={localStyles.centerContent}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={localStyles.loadingText}>
                    Loading {teamDetails.isBusiness ? 'incentive' : 'allowance'} intervals...
                  </Text>
                </View>
              ) : allowanceIntervals.length === 0 ? (
                <View style={localStyles.centerContent}>
                  <Text style={localStyles.emptyStateText}>
                    No {teamDetails.isBusiness ? 'incentive' : 'allowance'} intervals configured yet.
                  </Text>
                </View>
              ) : (
                <View style={localStyles.intervalCardsContainer}>
                  {limits && !limits.allowanceIntervalsLimit.canAdd && limits.allowanceIntervalsLimit.max > 0 && allowanceIntervals.length >= limits.allowanceIntervalsLimit.max && (
                    <TouchableOpacity onPress={() => setShowUpgradeModal(true)} activeOpacity={0.7}>
                    <Card style={localStyles.warningCard}>
                      <Card.Content style={localStyles.warningCardContent}>
                        <Text style={localStyles.warningText}>
                          🔒 First {limits.allowanceIntervalsLimit.max > 1 ? `${limits.allowanceIntervalsLimit.max} ` : ''} active {limits.allowanceIntervalsLimit.max > 1 ? "intervals'" : "interval's"} {teamDetails.isBusiness ? 'incentive' : 'allowance'} will be calculated in your current subscription tier. Please mark 'Active' the { limits.allowanceIntervalsLimit.max > 1 ? "intervals" : "interval"} you want to use and deactivate the rest, or upgrade to Pro for unlimited access. Tap to upgrade.
                        </Text>
                      </Card.Content>
                    </Card>
                    </TouchableOpacity>
                  )}

                  {allowanceIntervals.map((interval) => (
                    <Card 
                      key={interval.id} 
                      style={[
                        localStyles.intervalCard,
                        interval.isActive ? localStyles.activeIntervalCard : localStyles.inactiveIntervalCard
                      ]}
                      onPress={() => {
                        _navigation.navigate('AllowanceIntervalManager', {
                          intervalId: interval.id,
                          teamId: teamDetails.id,
                          isBusiness: teamDetails.isBusiness,
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${interval.name} interval${interval.isActive ? ' (active)' : ''}`}
                      accessibilityHint="Tap to view and edit this interval configuration"
                    >
                      <Card.Content>
                        <View style={localStyles.intervalCardHeader}>
                          <Text variant="titleMedium" style={localStyles.intervalCardTitle}>
                            {interval.name}
                          </Text>
                          {interval.isActive && (
                            <Text style={localStyles.activeLabel}>Active</Text>
                          )}
                          {!interval.isActive && (
                            <Text style={localStyles.inactiveLabel}>Inactive</Text>
                          )}
                        </View>
                        
                        {interval.description && (
                          <Text style={localStyles.intervalCardDescription}>
                            {interval.description}
                          </Text>
                        )}
                        
                        <View style={localStyles.intervalCardDetails}>
                          <View style={localStyles.intervalDetailRow}>
                            <Text style={localStyles.intervalDetailLabel}>Max Amount:</Text>
                            <Text style={localStyles.intervalDetailValue}>${interval.maxAllowanceAmount}</Text>
                          </View>
                          <View style={localStyles.intervalDetailRow}>
                            <Text style={localStyles.intervalDetailLabel}>Min Credits:</Text>
                            <Text style={localStyles.intervalDetailValue}>{interval.minCreditsForAllowance}</Text>
                          </View>
                          <View style={localStyles.intervalDetailRow}>
                            <Text style={localStyles.intervalDetailLabel}>Type:</Text>
                            <Text style={localStyles.intervalDetailValue}>
                              {interval.intervalType === AllowanceIntervalType.Weekly ? 'Weekly' : 
                               interval.intervalType === AllowanceIntervalType.Monthly ? 'Monthly' : 
                               interval.intervalType === AllowanceIntervalType.Quarterly ? 'Quarterly' : 'Custom'}
                              {interval.intervalValue > 1 && ` (every ${interval.intervalValue})`}
                            </Text>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        </>
        )}
      </ScrollView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          localStyles.snackbar,
          snackbarType === 'success' && localStyles.snackbarSuccess,
          snackbarType === 'error' && localStyles.snackbarError,
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

      {/* FAB Group */}
      {!isFormDisabledDueToPermissions && (
        <FAB.Group
          open={fabOpen}
          visible={true}
          icon={fabOpen ? 'close' : 'dots-vertical'}
          actions={[
            ...(teamDetails ? [{
              icon: 'plus',
              label: `Add ${teamDetails.isBusiness ? 'Incentive' : 'Allowance'} Interval`,
              onPress: () => handleAddInterval(teamDetails.id, teamDetails.isBusiness),
              style: { backgroundColor: colors.success },
              color: 'white',
              accessibilityLabel: `Add ${teamDetails.isBusiness ? 'Incentive' : 'Allowance'} Interval`,
              accessibilityHint: 'Create a new interval configuration'
            }] : []),
            {
              icon: 'restore',
              label: `Reset ${getTeamLabel()} Info`,
              onPress: confirmReset,
              style: { backgroundColor: colors.secondary },
              color: 'white',
              accessibilityLabel: `Reset ${getTeamLabel()} Info`,
              accessibilityHint: 'Reset all form fields to original values'
            },
            {
              icon: 'content-save',
              label: 'Save',
              onPress: handleSave,
              style: { backgroundColor: colors.accent },
              color: 'white',
              accessibilityLabel: 'Save',
              accessibilityHint: 'Save all changes to team preferences'
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={{ paddingBottom: bottom + 16, paddingRight: right + 16 }}
          fabStyle={{ backgroundColor: colors.accent }}
          color="white"
          accessibilityLabel={fabOpen ? 'Close menu' : 'Open team preferences menu'}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={upgradeModalVisible || showUpgradeModal}
        onClose={() => upgradeModalVisible ? hideUpgradeModal() : setShowUpgradeModal(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 260, // Extra space for FAB
  },
  card: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardContent: {
    padding: 0,
  },
  input: {
    marginBottom: 16,
  },
  textInputStyle: {
    backgroundColor: colors.backgroundDefault, 
  },
  textInputContentStyle: {
    paddingHorizontal: 12,
  },
  centeredTextInputContentStyle: {
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
  },
  radioContainer: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    color: colors.textPrimary,
  },
  helperText: {
    marginTop: 0,
    marginBottom: 2,
    fontSize: 14,
    paddingHorizontal: 4,
    fontWeight: '500',
    lineHeight: 16,
  },
  warningCard: {
    backgroundColor: '#FFF3E0', // Light orange background
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FF9800', // Orange border
    elevation: 2,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  warningCardContent: {
    padding: 12,
  },
  warningText: {
    color: '#E65100', // Dark orange text
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'left',
  },
  loadingText: {
    marginTop: 16,
  },
  intervalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  intervalLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  intervalValueInput: {
    flex: 1,
    maxWidth: 80,
    backgroundColor: colors.backgroundDefault,
  },
  intervalInputContentStyle: {
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  snackbar: {
    borderRadius: 12,
  },
  snackbarSuccess: {
    backgroundColor: colors.success,
  },
  snackbarError: {
    backgroundColor: colors.error,
  },
  // Grade Configuration Styles
  gradeConfigDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  gradesLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gradesLoadingText: {
    color: colors.textSecondary,
    marginLeft: 8,
  },
  gradeConfigContainer: {
    gap: 8,
  },
  gradeConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  gradeLetterContainer: {
    width: 60,
    alignItems: 'center',
  },
  gradeLetterBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeLetterText: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  gradeConfigInputContainer: {
    width: 100,
  },
  gradeInput: {
    marginBottom: 0,
  },
  gradeInputContentStyle: {
    textAlign: 'center',
  },
  // Interval Cards Styles
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  intervalCardsContainer: {
    gap: 12,
  },
  intervalCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    marginBottom: 0,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeIntervalCard: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  inactiveIntervalCard: {
    borderWidth: 2,
    borderColor: colors.buttonDisabled,
  },

  intervalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intervalCardTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  activeLabel: {
    backgroundColor: colors.success,
    color: colors.textOnPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  inactiveLabel: {
    backgroundColor: colors.buttonDisabled,
    color: colors.textOnPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },

  intervalCardDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 18,
  },
  intervalCardDetails: {
    gap: 6,
  },
  intervalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 20,
  },
  intervalDetailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    width: 120,
    paddingRight: 12,
  },
  intervalDetailValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'left',
    flex: 1,
  },
  intervalCardDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  addIntervalButton: {
    marginBottom: 24,
    borderColor: colors.primary,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 18,
  },
});
