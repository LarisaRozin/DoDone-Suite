/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { type ErrorInfo } from 'react';
import './App.css';
import {
    Typography, Box, ThemeProvider, CssBaseline
} from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import theme from './themes/default.tsx';   
import MainAppBar from './components/MainAppBar.tsx';
import AppContent from './components/AppContent.tsx';
import LoginPage from './components/userAdmin/LoginPage.tsx';
import RegisterPage from './components/userAdmin/RegisterPage.tsx';
import ResetPasswordPage from './components/userAdmin/ResetPasswordPage.tsx';
import ForgotPasswordPage from './components/userAdmin/ForgotPasswordPage.tsx';
import PrivacyPolicyPage from './components/PrivacyPolicyPage.tsx';
import SupportPage from './components/SupportPage.tsx';
// import ManageTeamPage from './components/userAdmin/ManageTeamPage.tsx';
// import EditProfilePage from './components/userAdmin/EditProfilePage.tsx';
import { useAuth } from 'dodone-shared';
// import SettingsPage from './components/settingsAdmin/SettingsPage.tsx';
import { useGlobalNotification } from "./components/globalNotificationProvider/UseGlobalNotification.tsx";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { NotificationTypeEnum } from './components/globalNotificationProvider/NotificationTypeEnum.ts';
import { GlobalNotificationProvider } from './components/globalNotificationProvider/GlobalNotificationProvider.tsx';

class ErrorBoundary extends React.Component<React.PropsWithChildren<object>, { hasError: boolean, error: unknown }> {
    constructor(props: React.PropsWithChildren<object>) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, error };
    }
    componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }
    render() : React.ReactNode {
        if (this.state.hasError) {
            let errorMessage = "Unknown error";
            if (this.state.error instanceof Error) {
                errorMessage = this.state.error.message;
            } else if (typeof this.state.error === "string") {
                errorMessage = this.state.error;
            } else if (this.state.error) {
                errorMessage = JSON.stringify(this.state.error);
            }
            return (
                <Box sx={{ color: 'red', padding: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Something went wrong.
                    </Typography>
                    <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {errorMessage}
                    </Typography>
                </Box>
            );
        }
        return this.props.children;
    }
}

function GlobalNotificationAlert() {
  const { notification, setNotification } = useGlobalNotification();
  return (
    (notification?.type == NotificationTypeEnum.Error && 
        <Snackbar 
            open={!!notification?.message} 
            autoHideDuration={6000} 
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }} 
            >
            <Alert severity="error" onClose={() => setNotification(null)}>
                {notification?.message}
            </Alert>
        </Snackbar>
    ) || (notification?.type == NotificationTypeEnum.Warning && 
        <Snackbar 
            open={!!notification?.message} 
            autoHideDuration={6000} 
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }} 
            >
            <Alert severity="warning" onClose={() => setNotification(null)}>
                {notification?.message}
            </Alert>
        </Snackbar>
    ) || (notification?.type == NotificationTypeEnum.Info && 
        <Snackbar 
            open={!!notification?.message} 
            autoHideDuration={6000} 
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }} 
            >    
            <Alert severity="info" onClose={() => setNotification(null)}>
                {notification?.message}
            </Alert>
        </Snackbar>
    ) || (notification?.type == NotificationTypeEnum.Success && 
        <Snackbar 
            open={!!notification?.message} 
            autoHideDuration={6000} 
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }} 
            > 
            <Alert severity="success" onClose={() => setNotification(null)}>
                {notification?.message}
            </Alert>    
        </Snackbar>
    ) || null
  );
}

function App() {
    const { user } = useAuth();
    const [authLoading, setAuthLoading] = React.useState(false);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ErrorBoundary>
                <GlobalNotificationProvider>
                    <GlobalNotificationAlert />
                    <MainAppBar />
                    <Routes>
                        <Route path="/login" element={
                            user
                                ? <Navigate to="/" replace />
                                : <LoginPage
                                    authLoading={authLoading}
                                    setAuthLoading={setAuthLoading}
                                />
                        } />
                        <Route path="/register" element={
                            user
                                ? <Navigate to="/" replace />
                                : <RegisterPage 
                                    authLoading={authLoading} 
                                    setAuthLoading={setAuthLoading} />
                        } />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/support" element={<SupportPage />} />
                        {/* <Route path="/edit-profile" element={<EditProfilePage user={user} />} /> */}
                        {/* <Route path="/manage-team" element={<ManageTeamPage />} /> */}
                        {/* <Route path="/settings" element={<SettingsPage />} /> */}
                        <Route path="/*" element={<AppContent user={user} />} />
                    </Routes>
                </GlobalNotificationProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;

