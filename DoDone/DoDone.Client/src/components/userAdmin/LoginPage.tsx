/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Alert, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

import { API_ROUTES, useAuth } from 'dodone-shared'; 
import type { User } from 'dodone-shared';

// Create config object like React Native app
const config = {
    // In development, use empty string to let Vite proxy handle API calls
    // In production, use the full API URL
    API_BASE_URL: (import.meta.env?.VITE_API_BASE_URL as string) || 
                  (import.meta.env?.DEV ? '' : 'https://localhost:7125')
};

interface LoginPageProps {
    authLoading: boolean;
    setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LoginPage({ authLoading, setAuthLoading }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');
    
    const { dispatch } = useAuth();
    const [authError, setAuthError] = useState('');
    
    const [showSuccess, setShowSuccess] = useState(
        location.state && location.state.registrationSuccess
    );

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const handleLogin = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const loginUrl = config.API_BASE_URL + API_ROUTES.auth.login;
            console.log('Attempting login to:', loginUrl);
            console.log('Config API_BASE_URL:', config.API_BASE_URL);
            console.log('API_ROUTES.auth.login:', API_ROUTES.auth.login);
            
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password }),
            });
            if (res.ok) {
                console.log('Login successful');
                const data = await res.json();
                const user = data.user as User;
                const token = data.token;
                dispatch({ type: 'LOGIN_SUCCESS', user, token })
                navigate('/');
            } else {
                console.error('Login failed with status:', res.status);
                setAuthError('Invalid username or password');
            }
        } catch (e) {
            console.error('Login error:', e);
            console.error('Full error details:', {
                message: e instanceof Error ? e.message : 'Unknown error',
                stack: e instanceof Error ? e.stack : undefined
            });
            setAuthError('Login failed');
        } finally {
            setAuthLoading(false);
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
                    Login
                </Typography>
            )}
            
            <Box sx={{
                width: '100%',
                maxWidth: '400px',
                alignSelf: 'center',
                paddingHorizontal: isLandscape ? '46px 16px' : '16px',
                paddingTop: isLandscape ? '16px' : '8px',
            }}>
                {showSuccess && (
                    <Alert 
                        severity="success" 
                        sx={{
                            marginBottom: 2,
                            backgroundColor: theme.palette.dodone.success,
                            color: theme.palette.dodone.textOnPrimary,
                        }}
                    >
                        ✅ Registration successful!
                    </Alert>
                )}
                
                <Box 
                    component="form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin();
                    }}
                    sx={{ width: '100%' }}
                >
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoCapitalize="none"
                        autoComplete="username"
                        fullWidth
                        margin="normal"
                        sx={{
                            marginBottom: 2,
                            backgroundColor: theme.palette.dodone.backgroundPaper,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.dodone.backgroundPaper,
                            },
                        }}
                    />
                    
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        fullWidth
                        margin="normal"
                        sx={{
                            marginBottom: 1,
                            backgroundColor: theme.palette.dodone.backgroundPaper,
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.dodone.backgroundPaper,
                            },
                        }}
                    />
                    
                    {authError && (
                        <Typography 
                            color="error" 
                            sx={{ 
                                marginBottom: 1,
                                color: theme.palette.dodone.error,
                            }}
                        >
                            {authError}
                        </Typography>
                    )}
                    
                    <Box sx={{
                        display: 'flex',
                        flexDirection: isLandscape ? 'row' : 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        marginTop: 1,
                    }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={authLoading}
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
                            Log In
                        </Button>
                        
                        <Button
                            type="button"
                            variant="text"
                            onClick={() => navigate('/forgot-password')}
                            sx={{
                                marginTop: 1,
                                marginBottom: 1,
                                color: theme.palette.dodone.primary,
                                fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
                                fontWeight: 500,
                                fontSize: '12px',
                                textTransform: 'none',
                            }}
                        >
                            Forgot Password?
                        </Button>
                        
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => navigate('/register')}
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
                            Need an account? Register
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}