/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Allowance Interval Manager Screen
 * @format
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { 
  Text, 
  Card,
  TextInput,
  ActivityIndicator, 
  Snackbar,
  FAB,
  Switch,
  HelperText,
  Button,
  Icon
} from 'react-native-paper';
import { useAuth, PagedListRequestBuilder, SortDirection, AllowanceMonthOfYear, SubscriptionTier } from '@larisarozin/dodone-shared';
import { useTeam, AllowanceIntervalType, AllowanceDayOfWeek, useGrades } from '@larisarozin/dodone-shared';
import type { TeamAllowanceIntervalCreateRequest, TeamAllowanceIntervalUpdateRequest, TeamGradeConfigResponse, GradeResponse, TeamAllowanceIntervalGradingPeriodResponse } from '@larisarozin/dodone-shared';
import { colors, styles } from '../../defaultTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import DropdownComponent from '../../components/Dropdown';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { UpgradeModal } from '../../components/UpgradeModal';

type AllowanceIntervalManagerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AllowanceIntervalManager'>;
type AllowanceIntervalManagerScreenRouteProp = RouteProp<RootStackParamList, 'AllowanceIntervalManager'>;

interface AllowanceIntervalManagerScreenProps {
  navigation: AllowanceIntervalManagerScreenNavigationProp;
  route: AllowanceIntervalManagerScreenRouteProp;
}

const intervalTypeOptions = [
  { label: 'Weekly', value: AllowanceIntervalType.Weekly },
  { label: 'Monthly', value: AllowanceIntervalType.Monthly },
  { label: 'Quarterly', value: AllowanceIntervalType.Quarterly },
  { label: 'School Year', value: AllowanceIntervalType.SchoolYear },
];

const dayOfWeekOptions = [
  { label: 'Sunday', value: AllowanceDayOfWeek.Sunday },
  { label: 'Monday', value: AllowanceDayOfWeek.Monday },
  { label: 'Tuesday', value: AllowanceDayOfWeek.Tuesday },
  { label: 'Wednesday', value: AllowanceDayOfWeek.Wednesday },
  { label: 'Thursday', value: AllowanceDayOfWeek.Thursday },
  { label: 'Friday', value: AllowanceDayOfWeek.Friday },
  { label: 'Saturday', value: AllowanceDayOfWeek.Saturday },
];

const monthOfYearOptions = [
  { label: 'January', value: AllowanceMonthOfYear.January },
  { label: 'February', value: AllowanceMonthOfYear.February },
  { label: 'March', value: AllowanceMonthOfYear.March },
  { label: 'April', value: AllowanceMonthOfYear.April },
  { label: 'May', value: AllowanceMonthOfYear.May },
  { label: 'June', value: AllowanceMonthOfYear.June },
  { label: 'July', value: AllowanceMonthOfYear.July },
  { label: 'August', value: AllowanceMonthOfYear.August },
  { label: 'September', value: AllowanceMonthOfYear.September },
  { label: 'October', value: AllowanceMonthOfYear.October },
  { label: 'November', value: AllowanceMonthOfYear.November },
  { label: 'December', value: AllowanceMonthOfYear.December },
];

export default function AllowanceIntervalManagerScreen({ navigation, route }: AllowanceIntervalManagerScreenProps) {
  const { intervalId, teamId, isBusiness } = route.params;
  const { user } = useAuth();
  const { bottom, right } = useSafeAreaInsets();

  // isDirty state tracking
  const [isDirty, setIsDirty] = useState(false);
  const initialFormDataRef = useRef<any>(null);
  const initialGradeConfigsRef = useRef<Record<number, number>>({});
  const navigationActionRef = useRef<any>(null);

  const teamRequest = React.useMemo(() => 
    new PagedListRequestBuilder()
      .setPaging(1, 1) // we don't need team members on this screen
      .setSorting('firstName', SortDirection.Ascending)
      .build(),
    []
  );

  const { 
    // Allowance interval functions
    allowanceIntervals,
    loadingAllowanceIntervals,
    creatingAllowanceInterval,
    updatingAllowanceInterval,
    createAllowanceInterval,
    updateAllowanceInterval,
    deleteAllowanceInterval
  } = useTeam(teamRequest);

  const { grades, loading: gradesLoading } = useGrades();

  // Confirmation dialog hook
  const { dialogState, showDialog, hideDialog } = useConfirmationDialog();

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Determine if creating new or editing existing
  const isCreatingNew = intervalId === undefined;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxAllowanceAmount: isCreatingNew ? 10 : 0,
    minCreditsForAllowance: isCreatingNew ? 2 : 0,
    intervalType: AllowanceIntervalType.Weekly,
    intervalValue: 1,
    startDayOfWeek: AllowanceDayOfWeek.Sunday,
    startMonthOfYear: AllowanceMonthOfYear.January,
    isActive: true,
    resetGradesOnIntervalEnd: false,
    gradingPeriods: [] as TeamAllowanceIntervalGradingPeriodResponse[],
  });

  // Grade configurations specific to this interval
  const [modifiedGradeConfigs, setModifiedGradeConfigs] = useState<Record<number, number>>({});

  // Grading period editing state
  const [editingGradingPeriod, setEditingGradingPeriod] = useState<TeamAllowanceIntervalGradingPeriodResponse | null>(null);
  const [gradingPeriodDialogVisible, setGradingPeriodDialogVisible] = useState(false);
  
  // Local input states for day fields to allow proper clearing
  const [startDayInput, setStartDayInput] = useState('');
  const [endDayInput, setEndDayInput] = useState('');

  // State for upgrade modal
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  // Validation state
  const [validation, setValidation] = useState({
    nameError: '',
    maxAllowanceAmountError: '',
    maxAllowanceAmountWarning: '',
    minCreditsForAllowanceError: '',
    intervalValueError: '',
    schoolYearGradingPeriodsRequiredError: '',
  });

  // Helper functions to get the correct text based on team type
  const getAllowanceLabel = useCallback(() => {
    return isBusiness ? 'Incentive' : 'Allowance';
  }, [isBusiness]);

  const getAllowanceLabelLowercase = useCallback(() => {
    return isBusiness ? 'incentive' : 'allowance';
  }, [isBusiness]);


  const maxAllowanceAmountInfoText = isBusiness
    ? "Maximum Incentive Amount is how much team members will get for this interval if they demonstrate excellent performance"
    : "Maximum Allowance Amount is how much your family members will get for this interval if they demonstrate excellent performance";

  const minCreditsForAllowanceInfoText = isBusiness
    ? "Minimum Credits for Incentive is the minimum workload your team member needs to undertake to receive the incentive"
    : "Minimum Credits for Allowance is the minimum workload your family member needs to undertake to receive the allowance";

  const gradeConfigInfoText = isBusiness
    ? "Say, your team member's average Grade for the Interval is C, with GPA of 2.0. Should they still receive Maximum Incentive Amount for this interval? Great question, and it's entirely up to you. Adjust by how much Maximum Incentive Amount is reduced (or not) for each Grade per Interval."
    : "Say, your family member's average Grade for the Interval is C, with GPA of 2.0. Should they still receive Maximum Allowance Amount for this interval? Great question, and it's entirely up to you. Adjust by how much Maximum Allowance Amount is reduced (or not) for each Grade per Interval.";

  const getScreenTitle = useCallback(() => {
    return intervalId ? `Edit ${getAllowanceLabel()} Interval` : `Create ${getAllowanceLabel()} Interval`;
  }, [intervalId, getAllowanceLabel]);

  // Determine if form should be disabled (non-admin users cannot edit team preferences)
  const isFormDisabledDueToPermissions = !user?.isAdmin;

  // Helper function to show snackbar messages with types
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  }, []);

  // Update form data when interval data is loaded (for editing)
  useEffect(() => {
    if (intervalId && !isCreatingNew && allowanceIntervals.length > 0 && grades.length > 0) {
      const interval = allowanceIntervals.find(i => i.id === intervalId);
      if (interval) {
        const loadedFormData = {
          name: interval.name || '',
          description: interval.description || '',
          maxAllowanceAmount: interval.maxAllowanceAmount || 0,
          minCreditsForAllowance: interval.minCreditsForAllowance || 0,
          intervalType: interval.intervalType || AllowanceIntervalType.Weekly,
          intervalValue: interval.intervalValue || 1,
          startDayOfWeek: interval.startDayOfWeek || AllowanceDayOfWeek.Sunday,
          startMonthOfYear: interval.startMonthOfYear || AllowanceMonthOfYear.January,
          isActive: interval.isActive,
          resetGradesOnIntervalEnd: interval.resetGradesOnIntervalEnd || false,
          gradingPeriods: interval.gradingPeriods || [],
        };
        
        setFormData(loadedFormData);
        
        // Store initial form data for isDirty comparison
        initialFormDataRef.current = loadedFormData;
        
        // Initialize modified grade configs with existing custom configurations
        const initialModifiedGradeConfigs: Record<number, number> = {};
        
        // For each grade config in the interval, check if it differs from the default grade
        interval.gradeConfigs.forEach(gradeConfig => {
          const defaultGrade = grades.find(g => g.id === gradeConfig.gradeId);
          const defaultReducePercent = typeof defaultGrade?.reducePercent === 'number' ? defaultGrade.reducePercent : 0;
          const intervalReducePercent = typeof gradeConfig.allowanceReducePercent === 'number' ? gradeConfig.allowanceReducePercent : 0;
          
          // Only include if different from default
          if (intervalReducePercent !== defaultReducePercent) {
            initialModifiedGradeConfigs[gradeConfig.gradeId] = intervalReducePercent;
          }
        });
        
        setModifiedGradeConfigs(initialModifiedGradeConfigs);
        
        // Store initial grade configs for isDirty comparison
        initialGradeConfigsRef.current = initialModifiedGradeConfigs;
        
        // Clear any validation errors
        setValidation({
          nameError: '',
          maxAllowanceAmountError: '',
          maxAllowanceAmountWarning: '',
          minCreditsForAllowanceError: '',
          intervalValueError: '',
          schoolYearGradingPeriodsRequiredError: '',
        });
      }
    } else if (isCreatingNew) {
      // Store initial form data for new intervals
      initialFormDataRef.current = {
        name: '',
        description: '',
        maxAllowanceAmount: 10,
        minCreditsForAllowance: 2,
        intervalType: AllowanceIntervalType.Weekly,
        intervalValue: 1,
        startDayOfWeek: AllowanceDayOfWeek.Sunday,
        startMonthOfYear: AllowanceMonthOfYear.January,
        isActive: true,
        resetGradesOnIntervalEnd: false,
        gradingPeriods: [],
      };
      initialGradeConfigsRef.current = {};
    }
  }, [intervalId, isCreatingNew, allowanceIntervals, grades]);

  // Check if form or grade configs have unsaved changes
  useEffect(() => {
    if (!initialFormDataRef.current) return;

    const formHasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    const gradeConfigsHaveChanges = JSON.stringify(modifiedGradeConfigs) !== JSON.stringify(initialGradeConfigsRef.current);

    setIsDirty(formHasChanges || gradeConfigsHaveChanges);
  }, [formData, modifiedGradeConfigs]);

  // Navigation protection - warn if attempting to navigate with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || creatingAllowanceInterval || updatingAllowanceInterval) {
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
                navigation.dispatch(navigationActionRef.current);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, creatingAllowanceInterval, updatingAllowanceInterval, navigation]);

  // Helper functions for grade configurations
  const getGradeColor = (letterGrade: string) => {
    if (['A+', 'A', 'A-'].includes(letterGrade)) return colors.success;
    if (['B+', 'B', 'B-'].includes(letterGrade)) return colors.accent;
    if (['C+', 'C', 'C-'].includes(letterGrade)) return colors.warning;
    if (['D+', 'D', 'F'].includes(letterGrade)) return colors.error;
    return colors.textSecondary;
  };

  // Helper functions for grading period management
  const createDefaultGradingPeriods = (): TeamAllowanceIntervalGradingPeriodResponse[] => [
    {
      id: 0,
      name: 'Fall Semester Q1',
      startMonth: AllowanceMonthOfYear.August,
      startDay: 11,
      endMonth: AllowanceMonthOfYear.October,
      endDay: 10,
      isSchoolBreak: false,
    },
    {
      id: 0,
      name: 'Fall Semester Q2',
      startMonth: AllowanceMonthOfYear.October,
      startDay: 11,
      endMonth: AllowanceMonthOfYear.December,
      endDay: 19,
      isSchoolBreak: false,
    },
    {
      id: 0,
      name: 'Spring Semester Q1', 
      startMonth: AllowanceMonthOfYear.January,
      startDay: 6,
      endMonth: AllowanceMonthOfYear.March,
      endDay: 13,
      isSchoolBreak: false,
    },
    {
      id: 0,
      name: 'Spring Semester Q2', 
      startMonth: AllowanceMonthOfYear.March,
      startDay: 23,
      endMonth: AllowanceMonthOfYear.May,
      endDay: 28,
      isSchoolBreak: false,
    },
  ];

  const validateGradingPeriodDates = (gradingPeriod: TeamAllowanceIntervalGradingPeriodResponse, otherGradingPeriods: TeamAllowanceIntervalGradingPeriodResponse[], editingGradingPeriodIndex?: number): string[] => {
    const errors: string[] = [];
    
    // Check if start date is before end date
    if (gradingPeriod.startMonth > gradingPeriod.endMonth || 
        (gradingPeriod.startMonth === gradingPeriod.endMonth && gradingPeriod.startDay >= gradingPeriod.endDay)) {
      errors.push('Start date must be before end date');
    }
    
    // Check for overlaps with other grading periods
    otherGradingPeriods.forEach((other, index) => {
      // Skip comparison with itself (for editing scenarios)
      if (editingGradingPeriodIndex !== undefined && index === editingGradingPeriodIndex) return;
      if (gradingPeriod.id !== 0 && other.id === gradingPeriod.id) return;
      
      const gradingPeriodStart = gradingPeriod.startMonth * 100 + gradingPeriod.startDay;
      const gradingPeriodEnd = gradingPeriod.endMonth * 100 + gradingPeriod.endDay;
      const otherStart = other.startMonth * 100 + other.startDay;
      const otherEnd = other.endMonth * 100 + other.endDay;
      
      if ((gradingPeriodStart >= otherStart && gradingPeriodStart <= otherEnd) ||
          (gradingPeriodEnd >= otherStart && gradingPeriodEnd <= otherEnd) ||
          (gradingPeriodStart <= otherStart && gradingPeriodEnd >= otherEnd)) {
        errors.push(`Overlaps with ${other.name}`);
      }
    });
    
    return errors;
  };

  const getGradeReducePercent = useCallback((gradeId: number): number => {
    // Check if user has modified this grade for this interval
    if (modifiedGradeConfigs[gradeId] !== undefined) {
      const modifiedValue = modifiedGradeConfigs[gradeId];
      return typeof modifiedValue === 'number' ? modifiedValue : 0;
    }
    
    // Check if the current interval has a configuration for this grade
    if (!isCreatingNew && intervalId) {
      const currentInterval = allowanceIntervals.find(i => i.id === intervalId);
      if (currentInterval) {
        const gradeConfig = currentInterval.gradeConfigs.find(gc => gc.gradeId === gradeId);
        if (gradeConfig && typeof gradeConfig.allowanceReducePercent === 'number') {
          return gradeConfig.allowanceReducePercent;
        }
      }
    }
    
    // Otherwise use default from grades
    const grade = grades.find(g => g.id === gradeId);
    return typeof grade?.reducePercent === 'number' ? grade.reducePercent : 0;
  }, [modifiedGradeConfigs, isCreatingNew, intervalId, allowanceIntervals, grades]);

  const handleGradeReducePercentChange = (gradeId: number, value: string) => {
    const parsedValue = parseFloat(value);
    const numValue = isNaN(parsedValue) ? 0 : parsedValue;
    
    // Get the current configured value for this grade in this interval
    const currentInterval = isCreatingNew ? null : allowanceIntervals.find(i => i.id === intervalId);
    const intervalGradeConfig = currentInterval?.gradeConfigs.find(gc => gc.gradeId === gradeId);
    const currentConfiguredValue = intervalGradeConfig && typeof intervalGradeConfig.allowanceReducePercent === 'number' ? 
      intervalGradeConfig.allowanceReducePercent : 
      (grades.find(g => g.id === gradeId)?.reducePercent ?? 0);
    
    // Only store in modifiedGradeConfigs if different from current configured value
    if (numValue === currentConfiguredValue) {
      // Remove from modified configs as it matches current configuration
      const newModified = { ...modifiedGradeConfigs };
      delete newModified[gradeId];
      setModifiedGradeConfigs(newModified);
    } else {
      // Store the modified value
      setModifiedGradeConfigs(prev => ({
        ...prev,
        [gradeId]: numValue
      }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing/changing values
    if (field === 'name') {
      setValidation(prev => ({ ...prev, nameError: '' }));
    } else if (field === 'intervalType') {
      // Handle interval type change
      if (value === AllowanceIntervalType.SchoolYear) {
        // Initialize with default grading periods if SchoolYear is selected
        setFormData(prev => ({
          ...prev,
          [field]: value,
          intervalValue: 1,
          startDayOfWeek: AllowanceDayOfWeek.Sunday,
          startMonthOfYear: AllowanceMonthOfYear.January,
          gradingPeriods: prev.gradingPeriods.length === 0 ? createDefaultGradingPeriods() : prev.gradingPeriods,
        }));
        return;
      } else {
        // Clear grading periods for non-SchoolYear types
        setFormData(prev => ({
          ...prev,
          [field]: value,
          intervalValue: 1,
          startDayOfWeek: AllowanceDayOfWeek.Sunday,
          startMonthOfYear: AllowanceMonthOfYear.January,
          gradingPeriods: [],
        }));
        return;
      }
    } else if (field === 'intervalValue') {
      setValidation(prev => ({ ...prev, intervalValueError: '' }));
    } else if (field === 'maxAllowanceAmount') {
      // Strip the '$' prefix if present and parse as float
      let cleanValue = typeof value === 'string' ? value.replace(/^\$|💲/g, '') : value;
      let numericValue = parseFloat(cleanValue) || 0;
      setValidation(prev => ({ ...prev, maxAllowanceAmountError: '' }));
      setFormData(prev => ({ ...prev, [field]: numericValue }));
      return; // Return early to avoid the default setFormData call below
    }
  };

  const validateForm = useCallback(() => {
    const errors = {
      nameError: '',
      maxAllowanceAmountError: '',
      maxAllowanceAmountWarning: '',
      minCreditsForAllowanceError: '',
      intervalValueError: '',
      schoolYearGradingPeriodsRequiredError: '',
    };

    if (!formData.name.trim()) {
      errors.nameError = `${getAllowanceLabel()} interval name is required`;
    }

    if (formData.maxAllowanceAmount < 0) {
      errors.maxAllowanceAmountError = `Maximum ${getAllowanceLabelLowercase()} amount cannot be negative`;
    } else if (formData.maxAllowanceAmount === 0) {
      errors.maxAllowanceAmountWarning = `Setting Maximum ${getAllowanceLabel()} Amount to zero will disable ${getAllowanceLabelLowercase()} calculations for this interval.`;
    }

    if (formData.minCreditsForAllowance <= 0 && formData.maxAllowanceAmount > 0) {
      errors.minCreditsForAllowanceError = `Minimum credits for ${getAllowanceLabelLowercase()} must be greater than 0`;
    }

    if (formData.intervalValue < 1) {
      errors.intervalValueError = 'Interval value must be greater than 0';
    }

    if (formData.intervalType === AllowanceIntervalType.SchoolYear) {
      if (formData.gradingPeriods.length === 0) {
        errors.schoolYearGradingPeriodsRequiredError = 'At least one grading period is required for School Year interval';
      }
    }

    setValidation(errors);
    
    const hasErrors = errors.nameError !== '' || 
                      errors.maxAllowanceAmountError !== '' || 
                      errors.minCreditsForAllowanceError !== '' || 
                      errors.intervalValueError !== '' ||
                      errors.schoolYearGradingPeriodsRequiredError !== '';
    return !hasErrors;
  }, [formData, getAllowanceLabel, getAllowanceLabelLowercase]);

  const handleSave = useCallback(async () => {
    // Don't validate if we're still loading intervals or if form hasn't been populated yet
    if (loadingAllowanceIntervals || (!isCreatingNew && (!intervalId || allowanceIntervals.length === 0))) {
      return;
    }

    if (!validateForm()) {
      showSnackbar('Please fix the validation errors before saving', 'error');
      return;
    }

    // Build gradeConfigs array - include all configs that differ from default values
    const gradeConfigsToSave: TeamGradeConfigResponse[] = [];
    
    // Get all grade IDs that need to be considered
    const allGradeIds = new Set<number>();
    grades.forEach(grade => allGradeIds.add(grade.id));
    
    // If editing existing interval, also consider its current grade configs
    if (!isCreatingNew && intervalId) {
      const currentInterval = allowanceIntervals.find(i => i.id === intervalId);
      currentInterval?.gradeConfigs.forEach(config => allGradeIds.add(config.gradeId));
    }
    
    Object.keys(modifiedGradeConfigs).forEach(gradeIdStr => allGradeIds.add(parseInt(gradeIdStr, 10)));
    
    allGradeIds.forEach(gradeId => {
      if (isNaN(gradeId)) return;
      
      // Get the current value for this grade (from modifications or interval config or default)
      const currentValue = getGradeReducePercent(gradeId);
      
      // Get the default value from grades
      const grade = grades.find(g => g.id === gradeId);
      const defaultValue = typeof grade?.reducePercent === 'number' ? grade.reducePercent : 0;
      
      // Only include if different from default and both values are valid numbers
      if (currentValue !== defaultValue) {
        // Find existing config in the current interval to preserve the id if it exists
        let existingConfig: TeamGradeConfigResponse | undefined;
        if (!isCreatingNew && intervalId) {
          const currentInterval = allowanceIntervals.find(i => i.id === intervalId);
          existingConfig = currentInterval?.gradeConfigs.find(gc => gc.gradeId === gradeId);
        }
        
        gradeConfigsToSave.push({
          id: existingConfig?.id || 0, // Preserve existing id or 0 for new entries
          teamAllowanceIntervalId: intervalId || 0, // Will be set by server for new intervals
          gradeId,
          allowanceReducePercent: currentValue,
          createdAt: existingConfig?.createdAt || new Date(),
          createdBy: existingConfig?.createdBy || 0, // Will be set by server
          updatedAt: new Date(),
          updatedBy: 0, // Will be set by server
        });
      }
    });

    if (isCreatingNew) {
      // Create new interval
      const createRequest: TeamAllowanceIntervalCreateRequest = {
        teamId,
        name: formData.name,
        description: formData.description,
        maxAllowanceAmount: formData.maxAllowanceAmount,
        minCreditsForAllowance: formData.minCreditsForAllowance,
        intervalType: formData.intervalType,
        intervalValue: formData.intervalValue,
        startDayOfWeek: formData.startDayOfWeek,
        startMonthOfYear: formData.startMonthOfYear,
        isActive: formData.isActive,
        resetGradesOnIntervalEnd: formData.resetGradesOnIntervalEnd,
        createdBy: 0, // Will be set by server
        createdAt: new Date().toISOString(),
        gradeConfigs: gradeConfigsToSave,
        gradingPeriods: formData.gradingPeriods || [],
      };

      const result = await createAllowanceInterval(createRequest);
      if (result) {
        setIsDirty(false); // Reset isDirty before navigation
        showSnackbar(`${getAllowanceLabel()} interval created successfully`, 'success');
        navigation.goBack();
      } else {
        showSnackbar(`Failed to create ${getAllowanceLabelLowercase()} interval`, 'error');
      }
    } else if (intervalId) {
      // Update existing interval
      const currentInterval = allowanceIntervals.find(i => i.id === intervalId);
      if (!currentInterval) {
        showSnackbar('Selected interval not found', 'error');
        return;
      }

      const updateRequest: TeamAllowanceIntervalUpdateRequest = {
        ...currentInterval,
        name: formData.name,
        description: formData.description,
        maxAllowanceAmount: formData.maxAllowanceAmount,
        minCreditsForAllowance: formData.minCreditsForAllowance,
        intervalType: formData.intervalType,
        intervalValue: formData.intervalValue,
        startDayOfWeek: formData.startDayOfWeek,
        startMonthOfYear: formData.startMonthOfYear,
        isActive: formData.isActive,
        resetGradesOnIntervalEnd: formData.resetGradesOnIntervalEnd,
        gradeConfigs: gradeConfigsToSave,
        gradingPeriods: formData.gradingPeriods || [],
        updatedAt: new Date().toISOString(),
        updatedBy: 0, // Will be set by server
      };

      const result = await updateAllowanceInterval(updateRequest);
      if (result) {
        setIsDirty(false); // Reset isDirty before navigation
        showSnackbar(`${getAllowanceLabel()} interval updated successfully`, 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showSnackbar(`Failed to update ${getAllowanceLabelLowercase()} interval`, 'error');
      }
    }
  }, [ loadingAllowanceIntervals,
    isCreatingNew,
    intervalId,
    allowanceIntervals,
    validateForm,
    showSnackbar,
    grades,
    modifiedGradeConfigs,
    getGradeReducePercent,
    formData,
    teamId,
    createAllowanceInterval,
    getAllowanceLabel,
    getAllowanceLabelLowercase,
    updateAllowanceInterval,
    navigation
  ]);

  const confirmDelete = () => {
    showDialog(
      'Delete Interval',
      `Deleting ${getAllowanceLabelLowercase()} interval will orphan tasks and delete interval's histories associated with this interval. This action cannot be undone. Consider setting the interval Inactive instead. Are you sure you want to delete this ${getAllowanceLabelLowercase()} interval?`,
      [
        { text: 'CANCEL', style: 'cancel', onPress: hideDialog },
        { 
          text: 'DELETE', 
          style: 'destructive', 
          onPress: async () => { 
            hideDialog(); 
            if (intervalId) {
              const result = await deleteAllowanceInterval(intervalId);
              if (result) {
                showSnackbar(`${getAllowanceLabel()} interval deleted successfully`, 'success');
                setTimeout(() => {
                  navigation.goBack();
                }, 1500);
              } else {
                showSnackbar(`Failed to delete ${getAllowanceLabelLowercase()} interval`, 'error');
              }
            }
          } 
        },
      ]
    );
  };

  if (loadingAllowanceIntervals) {
    return (
      <View style={[styles.primaryContainer, localStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.primarySubtitle, localStyles.loadingText]}>
          Loading {getAllowanceLabelLowercase()} intervals...
        </Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <ScrollView 
        style={localStyles.scrollView} 
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
        {/* Title */}
        <Text variant="displaySmall" style={styles.gameTitle}>
          {getScreenTitle()}
        </Text>

        {/* Interval Form */}
        <Card style={localStyles.card}>
          <Card.Content style={localStyles.cardContent}>
            <View style={localStyles.formSection}>
              <TextInput
                label={`Interval Name *`}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={localStyles.textInputContentStyle}
                textColor={colors.primary}
                mode="outlined"
                multiline
                theme={{ roundness: 12 }}
                error={!!validation.nameError}
                disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                accessibilityRole="text"
                accessibilityLabel="Interval Name"
                accessibilityHint="Enter a descriptive name for this allowance interval"
                accessibilityState={{ disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
              />
              {!!validation.nameError && (
                <HelperText type="error" visible={true} style={localStyles.helperText}>
                  {validation.nameError}
                </HelperText>
              )}
              <Text style={localStyles.infoLabel}>ℹ️ Give your interval a descriptive name, e.g.: Weekly Chores</Text>
              
              <TextInput
                label="Description (Optional)"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={localStyles.textInputContentStyle}
                textColor={colors.primary}
                mode="outlined"
                multiline
                numberOfLines={2}
                theme={{ roundness: 12 }}
                disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                accessibilityRole="text"
                accessibilityLabel="Description"
                accessibilityHint="Enter an optional description for this interval"
                accessibilityState={{ disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
              />

              <View style={localStyles.switchContainer}>
                <Text style={localStyles.switchLabel}>  Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => handleInputChange('isActive', value)}
                  disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                  accessibilityRole="switch"
                  accessibilityLabel="Active"
                  accessibilityHint="Toggle whether this interval is active"
                  accessibilityState={{ checked: formData.isActive, disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
                />
              </View>
            </View>

            <View style={localStyles.formSection}>
              <DropdownComponent
                data={intervalTypeOptions}
                value={formData.intervalType}
                onValueChange={(item) => handleInputChange('intervalType', item.value)}
                placeholder="Select Interval Frequency"
                label={`Interval Frequency`}
                style={localStyles.input}
                backgroundColor={colors.backgroundDefault}
                disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                allowClear={false}
              />

              {(formData.intervalType === AllowanceIntervalType.Weekly || formData.intervalType === AllowanceIntervalType.Monthly) && (
                <>
                  <View style={localStyles.intervalValueRow}>
                    <Text style={localStyles.intervalLabel}>Every</Text>
                    <TextInput
                      value={formData.intervalValue.toString()}
                      onChangeText={(value) => handleInputChange('intervalValue', parseInt(value, 10) || 1)}
                      style={[localStyles.intervalValueInput, localStyles.textInputStyle]}
                      contentStyle={localStyles.intervalInputContentStyle}
                      textColor={colors.primary}
                      mode="outlined"
                      keyboardType="numeric"
                      theme={{ roundness: 12 }}
                      error={!!validation.intervalValueError}
                      disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                      accessibilityRole="text"
                      accessibilityLabel="Interval value"
                      accessibilityHint="Enter how many weeks or months between intervals"
                      accessibilityState={{ disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
                    />
                    <Text style={localStyles.intervalLabel}>{formData.intervalValue > 1 
                      ? (formData.intervalType === AllowanceIntervalType.Weekly ? 'weeks' : 'months')
                      : (formData.intervalType === AllowanceIntervalType.Weekly ? 'week' : 'month')
                    }</Text>
                  </View>
                  {!!validation.intervalValueError && (
                    <HelperText type="error" visible={true} style={localStyles.helperText}>
                      {validation.intervalValueError}
                    </HelperText>
                  )}
                </>
              )}

              {/* {(formData.intervalType === AllowanceIntervalType.Monthly && formData.intervalValue > 1) && (
                <DropdownComponent
                  data={monthOfYearOptions}
                  value={formData.startMonthOfYear}
                  onValueChange={(item) => handleInputChange('startMonthOfYear', item.value)}
                  placeholder="Select Month of Year"
                  label="Start Month"
                  style={localStyles.startMonthOfYearInput}
                  backgroundColor={colors.backgroundDefault}
                  disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                  allowClear={false}
                />
              )} */}

              {(formData.intervalType !== AllowanceIntervalType.SchoolYear) && (
                <DropdownComponent
                  data={dayOfWeekOptions}
                  value={formData.startDayOfWeek}
                  onValueChange={(item) => handleInputChange('startDayOfWeek', item.value)}
                  placeholder="Select Day of Week"
                  label="Start Day of Week"
                  style={localStyles.startDayOfWeekInput}
                  backgroundColor={colors.backgroundDefault}
                  disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                  allowClear={false}
                />
              )}

              {/* Grading Period Management for School Year */}
              {formData.intervalType === AllowanceIntervalType.SchoolYear && (
                <View style={localStyles.gradingPeriodSection}>
                  <View style={localStyles.gradingPeriodHeaderRow}>
                    <Text variant="titleMedium" style={localStyles.gradingPeriodTitle}>
                      Grading Periods
                    </Text>
                    <FAB
                      icon="plus"
                      size="small"
                      onPress={() => {
                        const newPeriod = {
                          id: 0,
                          name: '',
                          startMonth: AllowanceMonthOfYear.August,
                          startDay: 1,
                          endMonth: AllowanceMonthOfYear.December,
                          endDay: 31,
                          isSchoolBreak: false,
                        };
                        setEditingGradingPeriod(newPeriod);
                        setStartDayInput(newPeriod.startDay.toString());
                        setEndDayInput(newPeriod.endDay.toString());
                        setGradingPeriodDialogVisible(true);
                      }}
                      style={localStyles.addGradingPeriodFab}
                      color="white"
                      disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                      accessibilityRole="button"
                      accessibilityLabel="Add Grading Period"
                      accessibilityHint="Add a new grading period to this school year interval"
                      accessibilityState={{ disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
                    />
                  </View>
                  
                  <Text style={localStyles.infoLabel}>
                    ℹ️ Define grading periods. Dates must be within a 1-year boundary and cannot overlap.
                  </Text>

                  {formData.gradingPeriods?.filter(gradingPeriod => !gradingPeriod.isSchoolBreak).map((gradingPeriod, index) => (
                    <Card key={gradingPeriod.id || index} style={localStyles.gradingPeriodCard}>
                      <Card.Content style={localStyles.gradingPeriodCardContent}>
                        <View style={localStyles.gradingPeriodRow}>
                          <View style={localStyles.gradingPeriodInfo}>
                            <Text style={localStyles.gradingPeriodName}>{gradingPeriod.name}</Text>
                            <Text style={localStyles.gradingPeriodDates}>
                              {monthOfYearOptions.find(m => m.value === gradingPeriod.startMonth)?.label} {gradingPeriod.startDay} - {monthOfYearOptions.find(m => m.value === gradingPeriod.endMonth)?.label} {gradingPeriod.endDay}
                            </Text>
                          </View>
                          <View style={localStyles.gradingPeriodActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setEditingGradingPeriod(gradingPeriod);
                                setStartDayInput(gradingPeriod.startDay.toString());
                                setEndDayInput(gradingPeriod.endDay.toString());
                                setGradingPeriodDialogVisible(true);
                              }}
                              style={localStyles.actionButton}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                              accessibilityRole="button"
                              accessibilityLabel="Edit grading period"
                              accessibilityHint={`Edit ${gradingPeriod.name} grading period`}
                              accessibilityState={{ disabled: isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval }}
                            >
                              <Icon source="pencil" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              onPress={() => {
                                const nonBreakGradingPeriods = formData.gradingPeriods?.filter(s => !s.isSchoolBreak) || [];
                                const gradingPeriodToDelete = nonBreakGradingPeriods[index];
                                const updatedGradingPeriods = formData.gradingPeriods?.filter(s => s !== gradingPeriodToDelete) || [];
                                setFormData(prev => ({
                                  ...prev,
                                  gradingPeriods: updatedGradingPeriods,
                                }));
                              }}
                              style={localStyles.actionButton}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                            >
                              <Icon source="delete" size={18} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}

                  {(!formData.gradingPeriods || formData.gradingPeriods.filter(s => !s.isSchoolBreak).length === 0) && (
                    <Card style={localStyles.emptyGradingPeriodCard}>
                      <Card.Content style={localStyles.emptyGradingPeriodContent}>
                        <Text style={localStyles.emptyGradingPeriodText}>
                          No grading periods defined. Add a grading period to get started.
                        </Text>
                      </Card.Content>
                    </Card>
                  )}
                </View>
              )}
            </View>

            <View style={localStyles.formSection}>
              <TextInput
                label={`Maximum ${getAllowanceLabel()} Amount`}
                value={`💲${formData.maxAllowanceAmount.toString()}`}
                onChangeText={(value) => handleInputChange('maxAllowanceAmount', value)}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={[localStyles.textInputContentStyle, localStyles.centeredTextInputContentStyle]}
                textColor={colors.primary}
                mode="outlined"
                keyboardType="numeric"
                theme={{ roundness: 12 }}
                error={!!validation.maxAllowanceAmountError}
                disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
              />
              {!!validation.maxAllowanceAmountError && (
                <HelperText type="error" visible={true} style={localStyles.helperText}>
                  {validation.maxAllowanceAmountError}
                </HelperText>
              )}
              {!!validation.maxAllowanceAmountWarning && (
                <Card style={localStyles.warningCard}>
                  <Card.Content style={localStyles.warningCardContent}>
                    <Text style={localStyles.warningText}>
                      ⚠️ {validation.maxAllowanceAmountWarning}
                    </Text>
                  </Card.Content>
                </Card>
              )}
              <Text style={localStyles.infoLabel}>ℹ️ {maxAllowanceAmountInfoText}</Text>
              
              <TextInput
                label={`Minimum Credits for ${getAllowanceLabel()}`}
                value={formData.minCreditsForAllowance.toString()}
                onChangeText={(value) => handleInputChange('minCreditsForAllowance', parseInt(value, 10) || 0)}
                style={[localStyles.input, localStyles.textInputStyle]}
                contentStyle={[localStyles.textInputContentStyle, localStyles.centeredTextInputContentStyle]}
                textColor={colors.primary}
                mode="outlined"
                keyboardType="numeric"
                theme={{ roundness: 12 }}
                error={!!validation.minCreditsForAllowanceError}
                disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
              />
              {!!validation.minCreditsForAllowanceError && (
                <HelperText type="error" visible={true} style={localStyles.helperText}>
                  {validation.minCreditsForAllowanceError}
                </HelperText>
              )}
              <Text style={localStyles.infoLabel}>ℹ️ {minCreditsForAllowanceInfoText}</Text>
              <SubscriptionGate 
                requiredTier={SubscriptionTier.Pro}
                // requiresFeature={(limits) => limits.bonuses} 
                overlayWhenLocked
                onUpgradePress={() => setUpgradeModalVisible(true)}
              >
                <View style={localStyles.resetTaskGradesSwitchContainer}>
                  <Text style={localStyles.switchLabel}>Reset Task Grades at Interval End</Text>
                  <Switch
                    value={formData.resetGradesOnIntervalEnd}
                    onValueChange={(value) => handleInputChange('resetGradesOnIntervalEnd', value)}
                    disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                  />
                </View>
                <Text style={localStyles.infoLabel}>ℹ️ If set, grades for all tasks associated with this interval will be reset to 'Ungraded' at the end of each interval.</Text>
                </SubscriptionGate>
            </View>

            {/* Grade Configuration */}
            {formData.maxAllowanceAmount > 0 && (
              <SubscriptionGate 
                requiredTier={SubscriptionTier.Pro}
                // requiresFeature={(limits) => limits.bonuses} 
                overlayWhenLocked
                onUpgradePress={() => setUpgradeModalVisible(true)}
              >
                <Text variant="titleMedium" style={localStyles.gradeConfigTitle}>
                  Grade Configuration
                </Text>
                <Text style={localStyles.infoLabel}>ℹ️ {gradeConfigInfoText}</Text>

                {gradesLoading ? (
                  <View style={localStyles.gradesLoadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={localStyles.gradesLoadingText}>Loading grades...</Text>
                  </View>
                ) : (
                  <View style={localStyles.gradeConfigContainer}>
                    {grades.map((grade: GradeResponse) => (
                      <View key={grade.id} style={localStyles.gradeConfigRow}>
                        <View style={localStyles.gradeLetterContainer}>
                          <View style={[
                            localStyles.gradeLetterBadge,
                            { backgroundColor: getGradeColor(grade.letterGrade) }
                          ]}>
                            <Text style={localStyles.gradeLetterText}>
                              {grade.letterGrade || 'Ungraded'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={localStyles.gradeConfigInputContainer}>
                          <TextInput
                            label={`Reduce %`}
                            value={(getGradeReducePercent(grade.id) ?? 0).toString()}
                            onChangeText={(value) => handleGradeReducePercentChange(grade.id, value)}
                            style={[localStyles.gradeInput, localStyles.textInputStyle]}
                            contentStyle={localStyles.gradeInputContentStyle}
                            textColor={colors.primary}
                            mode="outlined"
                            keyboardType="numeric"
                            theme={{ roundness: 12 }}
                            disabled={isFormDisabledDueToPermissions || creatingAllowanceInterval || updatingAllowanceInterval}
                            placeholder={`${grade.reducePercent}%`}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SubscriptionGate>
            )}
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          localStyles.snackbar,
          { marginBottom: bottom + 46 },
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

      {/* FAB - only show if not disabled */}
      {!isFormDisabledDueToPermissions && (
        <>
          {intervalId ? (
            <FAB.Group
              open={fabOpen}
              visible={true}
              icon={fabOpen ? 'close' : 'dots-vertical'}
              actions={[
                {
                  icon: 'delete',
                  label: 'Delete Interval',
                  onPress: confirmDelete,
                  style: { backgroundColor: colors.error },
                  color: 'white'
                },
                {
                  icon: 'content-save',
                  label: 'Save',
                  onPress: handleSave,
                  style: { backgroundColor: colors.accent },
                  color: 'white'
                },
              ]}
              onStateChange={({ open }) => setFabOpen(open)}
              style={{ paddingBottom: bottom + 96, paddingRight: right + 16 }}
              fabStyle={{ backgroundColor: colors.accent }}
              color="white"
            />
          ) : (
            <FAB
              icon="content-save"
              onPress={handleSave}
              style={[
                localStyles.saveFab,
                { 
                  bottom: bottom + 96,
                  right: right + 16,
                }
              ]}
              color="white"
            />
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />

      {/* Grading Period Editing Dialog */}
      <Modal
        transparent
        visible={gradingPeriodDialogVisible}
        animationType="fade"
        onRequestClose={() => {
          setGradingPeriodDialogVisible(false);
          setEditingGradingPeriod(null);
          setStartDayInput('');
          setEndDayInput('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setGradingPeriodDialogVisible(false);
          setEditingGradingPeriod(null);
          setStartDayInput('');
          setEndDayInput('');
        }}>
          <View style={localStyles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={localStyles.modalOverlay}
        >
          <View style={localStyles.gradingPeriodDialogCard}>
            <ScrollView
              style={localStyles.gradingPeriodDialogScrollView}
              contentContainerStyle={localStyles.gradingPeriodDialogScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={localStyles.gradingPeriodDialogHeader}>
                <Text variant="headlineSmall" style={localStyles.gradingPeriodDialogTitle}>
                  {editingGradingPeriod?.id ? 'Edit Grading Period' : 'Add Grading Period'}
                </Text>
              </View>

              <View style={localStyles.gradingPeriodDialogContent}>
                <TextInput
                  label="Grading Period Name *"
                  value={editingGradingPeriod?.name || ''}
                  onChangeText={(value) => {
                    if (editingGradingPeriod) {
                      setEditingGradingPeriod({ ...editingGradingPeriod, name: value });
                    }
                  }}
                  style={[localStyles.input, localStyles.textInputStyle]}
                  contentStyle={localStyles.textInputContentStyle}
                  textColor={colors.primary}
                  mode="outlined"
                  theme={{ roundness: 12 }}
                  disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                />

                <Text variant="titleSmall" style={localStyles.dialogSectionTitle}>Start Date</Text>
                <View style={localStyles.dateRow}>
                  <DropdownComponent
                    data={monthOfYearOptions}
                    value={editingGradingPeriod?.startMonth || AllowanceMonthOfYear.August}
                    onValueChange={(item) => {
                      if (editingGradingPeriod) {
                        setEditingGradingPeriod({ ...editingGradingPeriod, startMonth: item.value });
                      }
                    }}
                    placeholder="Month"
                    label="Month"
                    style={localStyles.monthDropdown}
                    backgroundColor={colors.backgroundDefault}
                    disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                    allowClear={false}
                  />
                  <TextInput
                    label="Day"
                    value={startDayInput}
                    onChangeText={(value) => {
                      setStartDayInput(value);
                      if (editingGradingPeriod) {
                        if (value !== '') {
                          const day = parseInt(value, 10);
                          if (!isNaN(day)) {
                            setEditingGradingPeriod({ ...editingGradingPeriod, startDay: Math.min(Math.max(day, 1), 31) });
                          }
                        }
                      }
                    }}
                    onBlur={() => {
                      if (editingGradingPeriod) {
                        if (startDayInput === '' || parseInt(startDayInput, 10) < 1 || isNaN(parseInt(startDayInput, 10))) {
                          const defaultDay = 1;
                          setEditingGradingPeriod({ ...editingGradingPeriod, startDay: defaultDay });
                          setStartDayInput(defaultDay.toString());
                        }
                      }
                    }}
                    style={[localStyles.dayInput, localStyles.textInputStyle]}
                    contentStyle={localStyles.textInputContentStyle}
                    textColor={colors.primary}
                    mode="outlined"
                    keyboardType="numeric"
                    theme={{ roundness: 12 }}
                    disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                  />
                </View>

                <Text variant="titleSmall" style={localStyles.dialogSectionTitle}>End Date</Text>
                <View style={localStyles.dateRow}>
                  <DropdownComponent
                    data={monthOfYearOptions}
                    value={editingGradingPeriod?.endMonth || AllowanceMonthOfYear.December}
                    onValueChange={(item) => {
                      if (editingGradingPeriod) {
                        setEditingGradingPeriod({ ...editingGradingPeriod, endMonth: item.value });
                      }
                    }}
                    placeholder="Month"
                    label="Month"
                    style={localStyles.monthDropdown}
                    backgroundColor={colors.backgroundDefault}
                    disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                    allowClear={false}
                  />
                  <TextInput
                    label="Day"
                    value={endDayInput}
                    onChangeText={(value) => {
                      setEndDayInput(value);
                      if (editingGradingPeriod) {
                        if (value !== '') {
                          const day = parseInt(value, 10);
                          if (!isNaN(day)) {
                            setEditingGradingPeriod({ ...editingGradingPeriod, endDay: Math.min(Math.max(day, 1), 31) });
                          }
                        }
                      }
                    }}
                    onBlur={() => {
                      if (editingGradingPeriod) {
                        if (endDayInput === '' || parseInt(endDayInput, 10) < 1 || isNaN(parseInt(endDayInput, 10))) {
                          const defaultDay = 31;
                          setEditingGradingPeriod({ ...editingGradingPeriod, endDay: defaultDay });
                          setEndDayInput(defaultDay.toString());
                        }
                      }
                    }}
                    style={[localStyles.dayInput, localStyles.textInputStyle]}
                    contentStyle={localStyles.textInputContentStyle}
                    textColor={colors.primary}
                    mode="outlined"
                    keyboardType="numeric"
                    theme={{ roundness: 12 }}
                    disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                  />
                </View>

                {editingGradingPeriod && (() => {
                  const nonBreakGradingPeriods = formData.gradingPeriods?.filter(s => !s.isSchoolBreak) || [];
                  const currentIndex = nonBreakGradingPeriods.findIndex(s => 
                    (s.id !== 0 && s.id === editingGradingPeriod.id) || 
                    (s.id === 0 && s === editingGradingPeriod)
                  );
                  const validationErrors = validateGradingPeriodDates(editingGradingPeriod, nonBreakGradingPeriods, currentIndex >= 0 ? currentIndex : undefined);
                  return validationErrors.length > 0 && (
                    <HelperText type="error" visible={true} style={localStyles.gradingPeriodValidationError}>
                      {validationErrors.join(', ')}
                    </HelperText>
                  );
                })()}
              </View>

              {/* Action Buttons */}
              <View style={localStyles.gradingPeriodDialogButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setGradingPeriodDialogVisible(false);
                    setEditingGradingPeriod(null);
                    setStartDayInput('');
                    setEndDayInput('');
                  }}
                  style={localStyles.gradingPeriodDialogCancelButton}
                  disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Cancel editing grading period"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                  if (!editingGradingPeriod || !editingGradingPeriod.name.trim()) {
                    showSnackbar('Grading period name is required', 'error');
                    return;
                  }

                  const existingIndex = formData.gradingPeriods?.findIndex(s => 
                    (s.id !== 0 && s.id === editingGradingPeriod.id) || 
                    (s.id === 0 && s === editingGradingPeriod)
                  ) ?? -1;
                  
                  const nonBreakGradingPeriods = formData.gradingPeriods?.filter(s => !s.isSchoolBreak) || [];
                  const nonBreakIndex = nonBreakGradingPeriods.findIndex(s => 
                    (s.id !== 0 && s.id === editingGradingPeriod.id) || 
                    (s.id === 0 && s === editingGradingPeriod)
                  );
                  
                  const validationErrors = validateGradingPeriodDates(editingGradingPeriod, nonBreakGradingPeriods, nonBreakIndex >= 0 ? nonBreakIndex : undefined);
                  
                  if (validationErrors.length > 0) {
                    showSnackbar(`Cannot save grading period: ${validationErrors.join(', ')}`, 'error');
                    return;
                  }
                  
                  if (existingIndex >= 0) {
                    const updatedGradingPeriods = [...(formData.gradingPeriods || [])];
                    updatedGradingPeriods[existingIndex] = editingGradingPeriod;
                    setFormData(prev => ({ ...prev, gradingPeriods: updatedGradingPeriods }));
                  } else {
                    const newGradingPeriod = { 
                      ...editingGradingPeriod, 
                      id: Date.now()
                    };
                    setFormData(prev => ({
                      ...prev,
                      gradingPeriods: [...(prev.gradingPeriods || []), newGradingPeriod],
                    }));
                  }

                  setGradingPeriodDialogVisible(false);
                  setEditingGradingPeriod(null);
                  setStartDayInput('');
                  setEndDayInput('');
                }}
                  style={[localStyles.gradingPeriodDialogSubmitButton, { backgroundColor: colors.success }]}
                  labelStyle={localStyles.gradingPeriodDialogSubmitButtonLabel}
                  disabled={creatingAllowanceInterval || updatingAllowanceInterval}
                  accessibilityRole="button"
                  accessibilityLabel="Save grading period"
                  accessibilityHint="Save changes to grading period"
                >
                  Save
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        message="Upgrade to Pro to unlock this feature"
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
    minHeight: 800,
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
    paddingBottom: 360, // Extra space for FAB
  },
  loadingText: {
    marginTop: 16,
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
  // Form styles
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
  startDayOfWeekInput: {
    marginBottom: 24,
  },
  startMonthOfYearInput: {
    marginTop: 4,
    marginBottom: 26,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 16,
    paddingVertical: 8,
  },
  resetTaskGradesSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  gradeConfigTitle: {
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  gradeConfigDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 24,
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
    marginBottom: 16,
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
  saveFab: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 18,
  },
  formSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Grading period management styles
  gradingPeriodSection: {
    marginTop: 16,
  },
  gradingPeriodHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradingPeriodTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addGradingPeriodFab: {
    backgroundColor: colors.primary,
  },
  gradingPeriodCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gradingPeriodCardContent: {
    padding: 12,
  },
  gradingPeriodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradingPeriodInfo: {
    flex: 1,
  },
  gradingPeriodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  gradingPeriodDates: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  gradingPeriodActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  emptyGradingPeriodCard: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyGradingPeriodContent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyGradingPeriodText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal backdrop and overlay styles
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Grading period dialog styles
  gradingPeriodDialogCard: {
    backgroundColor: colors.backgroundDefault,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradingPeriodDialogScrollView: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gradingPeriodDialogScrollContent: {
    paddingBottom: 20,
  },
  gradingPeriodDialogHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gradingPeriodDialogTitle: {
    fontFamily: 'Fredoka-SemiBold',
    color: colors.primary,
    textAlign: 'center',
  },
  gradingPeriodDialogContent: {
    marginBottom: 0,
  },
  gradingPeriodDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  gradingPeriodDialogCancelButton: {
    flex: 1,
    borderColor: colors.divider,
  },
  gradingPeriodDialogSubmitButton: {
    flex: 1,
  },
  gradingPeriodDialogSubmitButtonLabel: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  dialogSectionTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  monthDropdown: {
    flex: 2,
  },
  dayInput: {
    flex: 1,
  },
  gradingPeriodValidationError: {
    marginTop: 8,
    fontSize: 12,
  },
});