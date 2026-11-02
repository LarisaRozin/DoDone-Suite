/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Switch, 
  FormControlLabel, 
  Typography, 
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  useTheme
} from '@mui/material';
import type { User } from 'dodone-shared';
import type { UserFormData, UserFormValidation } from '../hooks/useUserForm.js';

interface UserFormProps {
  initialData?: User;
  isNew?: boolean;
  showPasswordFields?: boolean;
  showAdminSwitch?: boolean;
  showIsActiveSwitch?: boolean;
  showIntendedUse?: boolean;
  showTeamFields?: boolean;
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
  const theme = useTheme();

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
      onFormDataChange({
        userName: initialData.userName,
        email: initialData.email,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        middleName: initialData.middleName || '',
        salutation: initialData.salutation || '',
        isAdmin: initialData.isAdmin,
        isActive: initialData.isActive,
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
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      {showIsActiveSwitch && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
          <Typography>Active</Typography>
          <Switch
            checked={formData.isActive}
            onChange={(e) => onFormDataChange({ isActive: e.target.checked })}
            disabled={disabled}
          />
        </Box>
      )}
      
      {showAdminSwitch && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
          <Typography>Administrator</Typography>
          <Switch
            checked={formData.isAdmin}
            onChange={(e) => onFormDataChange({ isAdmin: e.target.checked })}
            disabled={disabled}
          />
        </Box>
      )}

      <TextField
        label="Username"
        value={formData.userName}
        onChange={(e) => handleUserNameChange(e.target.value)}
        autoCapitalize="none"
        autoComplete="username"
        fullWidth
        margin="dense"
        variant="outlined"
        error={showValidationErrors && !!validation.userNameError}
        helperText={showValidationErrors ? validation.userNameError || ' ' : ' '}
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
            color: validation.userNameError ? theme.palette.error.main : 'transparent',
          }
        }}
      />

      <TextField
        label="Email"
        value={formData.email}
        onChange={(e) => handleEmailChange(e.target.value)}
        autoCapitalize="none"
        autoComplete="email"
        type="email"
        fullWidth
        margin="dense"
        variant="outlined"
        error={showValidationErrors && !!validation.emailError}
        helperText={showValidationErrors ? validation.emailError || ' ' : ' '}
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
            color: validation.emailError ? theme.palette.error.main : 'transparent',
          }
        }}
      />

      <TextField
        label="First Name"
        value={formData.firstName}
        onChange={(e) => handleFirstNameChange(e.target.value)}
        autoCapitalize="words"
        autoComplete="given-name"
        fullWidth
        margin="dense"
        variant="outlined"
        error={showValidationErrors && !!validation.firstNameError}
        helperText={showValidationErrors ? validation.firstNameError || ' ' : ' '}
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
            color: validation.firstNameError ? theme.palette.error.main : 'transparent',
          }
        }}
      />

      <TextField
        label="Last Name"
        value={formData.lastName}
        onChange={(e) => handleLastNameChange(e.target.value)}
        autoCapitalize="words"
        autoComplete="family-name"
        fullWidth
        margin="dense"
        variant="outlined"
        error={showValidationErrors && !!validation.lastNameError}
        helperText={showValidationErrors ? validation.lastNameError || ' ' : ' '}
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
            color: validation.lastNameError ? theme.palette.error.main : 'transparent',
          }
        }}
      />

      <TextField
        label="Middle Name (Optional)"
        value={formData.middleName}
        onChange={(e) => onFormDataChange({ middleName: e.target.value })}
        autoCapitalize="words"
        fullWidth
        margin="dense"
        variant="outlined"
        helperText=" "
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
          }
        }}
      />

      <TextField
        label="Salutation (Optional)"
        value={formData.salutation}
        onChange={(e) => onFormDataChange({ salutation: e.target.value })}
        autoCapitalize="words"
        fullWidth
        margin="dense"
        variant="outlined"
        helperText=" "
        disabled={disabled}
        sx={{ 
          mb: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.dodone.backgroundPaper,
            borderRadius: '12px',
          },
          '& .MuiInputBase-input': {
            color: theme.palette.dodone.primary,
            px: 1.5,
          },
          '& .MuiFormHelperText-root': {
            minHeight: '18px',
            mt: 0.25,
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.14,
          }
        }}
      />

      {showPasswordFields && (
        <>
          <TextField
            label="Password"
            placeholder="Must include: A-Z, a-z, 0-9, special character"
            value={formData.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onFocus={onPasswordFieldFocus}
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            fullWidth
            margin="dense"
            variant="outlined"
            error={showValidationErrors && !!validation.passwordError}
            helperText={showValidationErrors ? validation.passwordError || ' ' : ' '}
            disabled={disabled}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.dodone.backgroundPaper,
                borderRadius: '12px',
              },
              '& .MuiInputBase-input': {
                color: theme.palette.dodone.primary,
                px: 1.5,
              },
              '& .MuiFormHelperText-root': {
                minHeight: '18px',
                mt: 0.25,
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.14,
                color: validation.passwordError ? theme.palette.error.main : 'transparent',
              }
            }}
          />
          
          <TextField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            onFocus={onConfirmPasswordFieldFocus}
            type="password"
            autoCapitalize="none"
            autoComplete="new-password"
            fullWidth
            margin="dense"
            variant="outlined"
            error={showValidationErrors && !!validation.confirmPasswordError}
            helperText={showValidationErrors ? validation.confirmPasswordError || ' ' : ' '}
            disabled={disabled}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.dodone.backgroundPaper,
                borderRadius: '12px',
              },
              '& .MuiInputBase-input': {
                color: theme.palette.dodone.primary,
                px: 1.5,
              },
              '& .MuiFormHelperText-root': {
                minHeight: '18px',
                mt: 0.25,
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.14,
                color: validation.confirmPasswordError ? theme.palette.error.main : 'transparent',
              }
            }}
          />
        </>
      )}

      {showIntendedUse && (
        <FormControl component="fieldset" sx={{ 
          mt: 1, 
          mb: 2,
          width: '100%'
        }}>
          <FormLabel component="legend" sx={{ 
            fontSize: 16, 
            color: theme.palette.dodone.textPrimary,
            fontWeight: 500,
            mb: 1,
            textAlign: 'center',
            width: '100%'
          }}>
            Intended Use
          </FormLabel>
          <RadioGroup
            value={formData.intendedUse || 'Personal'}
            onChange={(e) => onFormDataChange({ intendedUse: e.target.value as 'Business' | 'Personal' })}
            row
            sx={{
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <FormControlLabel 
              value="Personal" 
              control={<Radio disabled={disabled} />} 
              label="Personal"
              sx={{ '& .MuiFormControlLabel-label': { color: theme.palette.dodone.textPrimary } }}
            />
            <FormControlLabel 
              value="Business" 
              control={<Radio disabled={disabled} />} 
              label="Business"
              sx={{ '& .MuiFormControlLabel-label': { color: theme.palette.dodone.textPrimary } }}
            />
          </RadioGroup>
        </FormControl>
      )}

      {showTeamFields && (
        <>
          <TextField
            label={formData.intendedUse === 'Personal' ? "Family Name (Optional)" : "Team Name (Optional)"}
            value={formData.teamName || ''}
            onChange={(e) => onFormDataChange({ teamName: e.target.value })}
            autoCapitalize="words"
            fullWidth
            margin="dense"
            variant="outlined"
            helperText=" "
            disabled={disabled}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.dodone.backgroundPaper,
                borderRadius: '12px',
              },
              '& .MuiInputBase-input': {
                color: theme.palette.dodone.primary,
                px: 1.5,
              },
              '& .MuiFormHelperText-root': {
                minHeight: '18px',
                mt: 0.25,
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.14,
              }
            }}
          />

          <TextField
            label={formData.intendedUse === 'Personal' ? "Family Description (Optional)" : "Team Description (Optional)"}
            value={formData.teamDescription || ''}
            onChange={(e) => onFormDataChange({ teamDescription: e.target.value })}
            autoCapitalize="sentences"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            variant="outlined"
            helperText=" "
            disabled={disabled}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.dodone.backgroundPaper,
                borderRadius: '12px',
              },
              '& .MuiInputBase-input': {
                color: theme.palette.dodone.primary,
                px: 1.5,
              },
              '& .MuiFormHelperText-root': {
                minHeight: '18px',
                mt: 0.25,
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.14,
              }
            }}
          />
        </>
      )}
    </Box>
  );
}