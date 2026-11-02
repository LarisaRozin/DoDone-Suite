/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Custom hook for user form logic
 * @format
 */

import { useState, useCallback } from 'react';
import { UserFormData, UserFormValidation } from '../components/UserForm';

export const useUserForm = (initialData?: Partial<UserFormData>) => {
  const [formData, setFormData] = useState<UserFormData>({
    userName: '',
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    salutation: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
    isActive: true,
    intendedUse: 'Personal',
    teamName: '',
    teamDescription: '',
    avatarUri: undefined,
    ...initialData,
  });

  const [validation, setValidation] = useState<UserFormValidation>({
    userNameError: '',
    emailError: '',
    firstNameError: '',
    lastNameError: '',
    passwordError: '',
    confirmPasswordError: '',
  });

  const updateFormData = useCallback((data: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const updateValidation = useCallback((validationData: Partial<UserFormValidation>) => {
    setValidation(prev => ({ ...prev, ...validationData }));
  }, []);

  const validatePasswordStrength = useCallback((pwd: string) => {
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
  }, []);

  const validateForm = useCallback((isNew: boolean = false, requirePassword: boolean = false) => {
    let isValid = true;
    
    // Reset errors
    const newValidation: UserFormValidation = {
      userNameError: '',
      emailError: '',
      firstNameError: '',
      lastNameError: '',
      passwordError: '',
      confirmPasswordError: '',
    };

    // Username validation
    if (!formData.userName.trim()) {
      newValidation.userNameError = 'Username is required';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newValidation.emailError = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newValidation.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newValidation.firstNameError = 'First name is required';
      isValid = false;
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newValidation.lastNameError = 'Last name is required';
      isValid = false;
    }

    // Password validation for new users or when password is being changed
    if (requirePassword || ((formData.password.trim() && !isNew))) {
      const passwordValidationError = validatePasswordStrength(formData.password);
      if (passwordValidationError) {
        newValidation.passwordError = passwordValidationError;
        isValid = false;
      }
      
      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newValidation.confirmPasswordError = 'Passwords do not match';
        isValid = false;
      } else if (!formData.confirmPassword.trim() && formData.password.trim()) {
        newValidation.confirmPasswordError = 'Please confirm your password';
        isValid = false;
      }
    }

    setValidation(newValidation);
    return { isValid, validationErrors: newValidation };
  }, [formData, validatePasswordStrength]);

  const resetForm = useCallback(() => {
    setFormData({
      userName: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      salutation: '',
      password: '',
      confirmPassword: '',
      isAdmin: false,
      isActive: true,
      intendedUse: 'Personal',
      teamName: '',
      teamDescription: '',
    });
    setValidation({
      userNameError: '',
      emailError: '',
      firstNameError: '',
      lastNameError: '',
      passwordError: '',
      confirmPasswordError: '',
    });
  }, []);

  return {
    formData,
    validation,
    updateFormData,
    updateValidation,
    validateForm,
    resetForm,
  };
};
