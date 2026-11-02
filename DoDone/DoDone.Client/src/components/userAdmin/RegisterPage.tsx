/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from 'dodone-shared';
import type { RegisterRequest } from 'dodone-shared';
import { useUserForm } from '../../hooks/useUserForm.js';
import UserForm from '../UserForm.js';
import { getWebDeviceId, getUserTimezone, getWebPlatform } from '../../utils/deviceUtils.js';

interface RegisterPageProps {
    authLoading: boolean;
    setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RegisterPage({ authLoading, setAuthLoading }: RegisterPageProps) {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isLandscape = useMediaQuery('(orientation: landscape)');

    const {
        formData,
        validation,
        updateFormData,
        updateValidation,
        validateForm,
    } = useUserForm();

    // Use relative URL to go through Vite proxy
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const apiClient = createApiClient(apiBaseUrl, '');

    const handleValidationReset = () => {
        setShowValidationErrors(false);
    };

    const handleRegister = async () => {
        setShowValidationErrors(true);
        const validationResult = validateForm(true, true);
        
        if (!validationResult.isValid) {
            return;
        }

        setAuthLoading(true);
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
                platform: getWebPlatform(),
                deviceId: getWebDeviceId(),
                timezone: getUserTimezone(),
            };

            const response = await apiClient.auth.register(userData);

            if (!response || !response.success) {
                setError(`Failed to create account: ${response?.message || 'Unknown error'} `);
                console.error('Error creating user: ', response?.message);
                return;
            }

            setSuccess('Account created successfully! You can now log in.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Error creating user:', err);
            setError('Error creating account. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLoginPress = () => {
        navigate('/login');
    };

    return (
        <Container 
            maxWidth="md" 
            sx={{ 
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                py: 3,
                backgroundColor: theme.palette.dodone.backgroundDefault,
            }}
        >
            <Typography 
                variant="h3"
                sx={{
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: 'bold',
                    color: theme.palette.dodone.primary,
                    textAlign: 'center',
                    mb: 4,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}
            >
                Create Account
            </Typography>

            <Box 
                sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: isLandscape ? 800 : 600,
                    mx: 'auto',
                    width: '100%',
                    px: { xs: 2, sm: 3 }
                }}
            >
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 2,
                            backgroundColor: theme.palette.dodone.error,
                            color: '#fff'
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mb: 2,
                            backgroundColor: theme.palette.dodone.success,
                            color: '#fff'
                        }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                <Box 
                    component="form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRegister();
                    }}
                    sx={{ width: '100%' }}
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
                        disabled={authLoading}
                        showValidationErrors={showValidationErrors}
                        onValidationReset={handleValidationReset}
                    />

                    <Box sx={{ 
                        mt: 2, 
                        mb: 2, 
                        textAlign: 'center',
                        maxWidth: '400px',
                        mx: 'auto'
                    }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: theme.palette.dodone.textSecondary,
                                fontSize: '0.875rem',
                                lineHeight: 1.4
                            }}
                        >
                            By registering, you agree to our{' '}
                            <Typography 
                                component="span"
                                sx={{ 
                                    color: theme.palette.dodone.primary,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                        color: theme.palette.dodone.primaryDark,
                                    }
                                }}
                                onClick={() => navigate('/privacy-policy')}
                            >
                                Privacy Policy
                            </Typography>
                        </Typography>
                    </Box>

                    <Box 
                        sx={{ 
                            display: 'flex',
                            flexDirection: isLandscape ? 'row' : 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 2,
                            mt: 2,
                            mb: 3
                        }}
                    >
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={authLoading}
                            sx={{
                                backgroundColor: theme.palette.dodone.buttonPrimary,
                                color: theme.palette.dodone.primaryContrastText,
                                fontFamily: theme.typography.fontFamily,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                py: 1.5,
                                px: 4,
                                borderRadius: '12px',
                                minWidth: isLandscape ? 220 : 280,
                                '&:hover': {
                                    backgroundColor: theme.palette.dodone.primaryDark,
                                },
                                '&:disabled': {
                                    backgroundColor: theme.palette.dodone.buttonDisabled,
                                }
                            }}
                        >
                            {authLoading ? 'Creating Account...' : 'Register'}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={handleLoginPress}
                            disabled={authLoading}
                            sx={{
                                borderColor: theme.palette.dodone.primary,
                                color: theme.palette.dodone.primary,
                                fontFamily: theme.typography.fontFamily,
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                py: 1.5,
                                px: 4,
                                borderRadius: '12px',
                                minWidth: isLandscape ? 220 : 280,
                                '&:hover': {
                                    borderColor: theme.palette.dodone.primaryDark,
                                    backgroundColor: 'rgba(245, 124, 0, 0.04)',
                                }
                            }}
                        >
                            Already registered? Login
                        </Button>
                    </Box>

                    <Box sx={{ 
                        mt: 2, 
                        mb: 2, 
                        textAlign: 'center',
                        maxWidth: '400px',
                        mx: 'auto'
                    }}>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: theme.palette.dodone.textSecondary,
                                fontSize: '0.875rem',
                                lineHeight: 1.4,
                                textAlign: 'center',
                            }}
                        >
                            Need help? Visit{' '}
                            <Typography 
                                component="span"
                                sx={{ 
                                    color: theme.palette.dodone.primary,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                        color: theme.palette.dodone.primaryDark,
                                    }
                                }}
                                onClick={() => navigate('/support')}
                            >
                                Support
                            </Typography>
                        </Typography>

                    </Box>
                </Box>
            </Box>
        </Container>
    );
}