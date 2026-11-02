/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Alert, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { createApiClient } from 'dodone-shared';
import type { ForgotPasswordRequest } from 'dodone-shared';

const config = {
    // In development, use empty string to let Vite proxy handle API calls
    // In production, use the full API URL
    API_BASE_URL: (import.meta.env?.VITE_API_BASE_URL as string) || 
                  (import.meta.env?.DEV ? '' : 'https://localhost:7125')
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();
    const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

    const apiClient = createApiClient(config.API_BASE_URL, '');

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    const validateEmail = (emailToValidate: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailToValidate);
    };

    const handleForgotPassword = async () => {
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const request: ForgotPasswordRequest = {
                email: email.trim().toLowerCase(),
            };

            console.log('Sending forgot password request:', request);
            console.log('Request payload:', request);
            const response = await apiClient.auth.forgotPassword(request);

            if (response && response.success) {
                setSuccess('Password reset instructions have been sent to your email address.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(response?.message || 'Failed to send password reset email. Please try again.');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleForgotPassword();
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: theme.palette.dodone.backgroundDefault,
            width: '100%',
            padding: '20px 12px',
        }}>
            {!isLandscape && (
                <Typography
                    variant="h2"
                    sx={{
                        fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 700,
                        width: '100%',
                        textAlign: 'center',
                        marginBottom: 2,
                        color: theme.palette.dodone.highlight,
                        textShadow: `1px 1px 2px ${theme.palette.dodone.shadow}`,
                        fontSize: '2.25rem',
                    }}
                >
                    Reset Password
                </Typography>
            )}
            
            <Box sx={{
                width: '100%',
                maxWidth: '400px',
                alignSelf: 'center',
                paddingHorizontal: isLandscape ? '46px 16px' : '16px',
                paddingTop: isLandscape ? '16px' : '8px',
            }}>
                <Typography
                    variant="body1"
                    sx={{
                        textAlign: 'center',
                        marginBottom: '20px',
                        paddingHorizontal: '16px',
                        color: theme.palette.dodone.textOnBackground,
                        lineHeight: 1.6,
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    }}
                >
                    Enter your email address and we'll send you instructions to reset your password.
                </Typography>

                <TextField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoCapitalize="none"
                    autoComplete="email"
                    fullWidth
                    margin="normal"
                    disabled={loading}
                    sx={{
                        marginBottom: 2,
                        backgroundColor: theme.palette.dodone.backgroundPaper,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: theme.palette.dodone.backgroundPaper,
                        },
                    }}
                />

                <Box sx={{
                    display: 'flex',
                    flexDirection: isLandscape ? 'row' : 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    marginTop: 1,
                }}>
                    <Button
                        variant="contained"
                        onClick={handleForgotPassword}
                        disabled={loading || !!success}
                        sx={{
                            backgroundColor: theme.palette.dodone.buttonPrimary,
                            color: theme.palette.dodone.textOnPrimary,
                            paddingY: '14px',
                            paddingX: '28px',
                            borderRadius: '30px',
                            border: `3px solid ${theme.palette.dodone.primaryLight}`,
                            boxShadow: `0px 4px 6px ${theme.palette.dodone.shadow}`,
                            marginY: 1,
                            minWidth: '200px',
                            maxWidth: isLandscape ? '220px' : 'none',
                            flex: isLandscape ? 1 : 'none',
                            fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: 600,
                            fontSize: '16px',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: theme.palette.dodone.primaryDark,
                                boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
                            },
                            '&:disabled': {
                                backgroundColor: theme.palette.dodone.buttonDisabled,
                            },
                        }}
                    >
                        Send Email
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleBackToLogin}
                        disabled={loading}
                        sx={{
                            backgroundColor: 'transparent',
                            borderWidth: '2px',
                            borderColor: theme.palette.dodone.primary,
                            color: theme.palette.dodone.primary,
                            paddingY: '10px',
                            paddingX: '22px',
                            borderRadius: '30px',
                            minWidth: '200px',
                            maxWidth: isLandscape ? '220px' : 'none',
                            flex: isLandscape ? 1 : 'none',
                            fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: 600,
                            fontSize: '10px',
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: `rgba(245, 124, 0, 0.1)`,
                                borderColor: theme.palette.dodone.primaryDark,
                                color: theme.palette.dodone.primaryDark,
                            },
                        }}
                    >
                        Back to Login
                    </Button>
                </Box>
            </Box>
            
            {success && (
                <Alert 
                    severity="success" 
                    sx={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: theme.palette.dodone.success,
                        color: theme.palette.dodone.textOnPrimary,
                        zIndex: 1000,
                    }}
                >
                    {success}
                </Alert>
            )}

            {error && (
                <Alert 
                    severity="error" 
                    sx={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: theme.palette.dodone.error,
                        color: theme.palette.dodone.textOnPrimary,
                        zIndex: 1000,
                    }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}
        </Box>
    );
}
