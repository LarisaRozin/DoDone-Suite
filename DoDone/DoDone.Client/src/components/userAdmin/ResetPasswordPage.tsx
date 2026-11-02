/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Container,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createApiClient } from 'dodone-shared';
import type { ResetPasswordRequest } from 'dodone-shared';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isLandscape = useMediaQuery('(orientation: landscape)');
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // Use relative URL to go through Vite proxy
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const apiClient = createApiClient(apiBaseUrl, '');

    useEffect(() => {
        // Validate that we have a reset token from deep link
        if (!token || token.trim() === '') {
            console.log('ResetPasswordPage - Missing token, showing error');
            setError('Invalid reset link. Please request a new password reset. No token received.');
        } else {
            console.log('ResetPasswordPage - Token received successfully:', token.substring(0, 20) + '...');
        }
    }, [token]);

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

    const validateForm = () => {
        let isValid = true;
        
        // Reset errors
        setPasswordError('');
        setConfirmPasswordError('');
        setError('');

        // Password validation
        const passwordValidationError = validatePasswordStrength(newPassword);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            isValid = false;
        }
        
        // Confirm password validation
        if (newPassword !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        } else if (!confirmPassword.trim() && newPassword.trim()) {
            setConfirmPasswordError('Please confirm your password');
            isValid = false;
        }

        return isValid;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const request: ResetPasswordRequest = {
                token: token || '',
                newPassword,
            };
            console.log('Sending reset password request:', request);

            const response = await apiClient.auth.resetPassword(request);

            if (response && response.success) {
                setSuccess('Password reset successfully! You can now log in with your new password.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response?.message || 'Failed to reset password. The reset link may have expired.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('An error occurred. Please try again or request a new password reset link.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
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
                Set New Password
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

                <Typography 
                    variant="body1" 
                    sx={{ 
                        textAlign: 'center',
                        mb: 3,
                        px: 2,
                        color: theme.palette.dodone.textOnBackground,
                        lineHeight: 1.6
                    }}
                >
                    {email ? `Setting new password for ${email}` : 'Enter your new password below. Make sure it meets all the security requirements.'}
                </Typography>

                <Box 
                    component="form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleResetPassword();
                    }}
                    sx={{ width: '100%' }}
                >
                    <TextField
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError('');
                        }}
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        disabled={loading || !!success}
                        autoComplete="new-password"
                        error={!!passwordError}
                        helperText={passwordError || ' '}
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
                                color: passwordError ? theme.palette.error.main : 'transparent',
                            }
                        }}
                    />

                    <TextField
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setConfirmPasswordError('');
                        }}
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        disabled={loading || !!success}
                        autoComplete="new-password"
                        error={!!confirmPasswordError}
                        helperText={confirmPasswordError || ' '}
                        sx={{ 
                            mb: 2,
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
                                color: confirmPasswordError ? theme.palette.error.main : 'transparent',
                            }
                        }}
                    />

                    <Box sx={{ mt: 1, mb: 3, px: 2 }}>
                        <Typography 
                            variant="subtitle2" 
                            sx={{ 
                                fontWeight: 'bold',
                                mb: 1,
                                color: theme.palette.dodone.textOnBackground
                            }}
                        >
                            Password Requirements:
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.dodone.textSecondary, mb: 0.5 }}>
                            • At least 6 characters long
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.dodone.textSecondary, mb: 0.5 }}>
                            • Contains uppercase and lowercase letters
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.dodone.textSecondary, mb: 0.5 }}>
                            • Contains at least one number
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.dodone.textSecondary, mb: 0.5 }}>
                            • Contains at least one special character
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
                            disabled={loading || !!success}
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
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={handleBackToLogin}
                            disabled={loading}
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
                            Back to Login
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
