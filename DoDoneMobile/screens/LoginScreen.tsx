/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Keyboard, StyleSheet, Dimensions } from 'react-native';
import { TextInput } from 'react-native-paper';
import { HelperText, Snackbar } from '../components/StyledText';
import { Text, Button } from '../components/StyledText';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_ROUTES, useAuth } from '@larisarozin/dodone-shared'; 
import { User } from '@larisarozin/dodone-shared'; 
import config from '../config/config';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, styles } from '../defaultTheme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface LoginScreenProps {
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({
  authLoading,
  setAuthLoading,
  navigation,
}: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const insets = useSafeAreaInsets();

  const { dispatch } = useAuth();
  const [authError, setAuthError] = React.useState('');

  const route = useRoute();
  const [showSuccess, setShowSuccess] = useState(
    (route.params as any)?.registrationSuccess || false
  );

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };

    // Set initial orientation
    updateOrientation();

    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleLogin = async () => {
    // Validate inputs before making API call
    if (!username || !username.trim()) {
      setAuthError('Username is required');
      console.warn('⚠️ Login attempted with empty username');
      return;
    }
    
    if (!password || !password.trim()) {
      setAuthError('Password is required');
      console.warn('⚠️ Login attempted with empty password');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    try {
      const url = config.API_BASE_URL + API_ROUTES.auth.login;
      const requestBody = { Username: username, Password: password };
      
      console.log('***Login attempt:', {
        username,
        url,
        timestamp: new Date().toISOString(),
        bodyKeys: Object.keys(requestBody),
        usernameLength: username.length,
        passwordLength: password.length,
      });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'DoDoneMobile/1.0.0'
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('***Login response received:', {
        status: res.status,
        ok: res.ok,
        timestamp: new Date().toISOString(),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success === false) {
          setAuthError(data.message || 'Invalid username or password');
          console.log('Login failed:', data.message || 'Invalid username or password');
          setAuthLoading(false);
          return;
        }
        const user = data.user as User;
        const token = data.token;
        dispatch({ type: 'LOGIN_SUCCESS', user, token });
        
        // Reset navigation stack to prevent deep link interference
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else {
        const errorText = await res.text();
        console.log('Error response:', errorText);
        setAuthError('Invalid username or password');
      }
    } catch (e) {
      console.error('Login error:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setAuthError(`Login failed: ${errorMessage}`);
    } finally {
      setAuthLoading(false);
    }
  };
  return (
    <View style={[styles.primaryContainer, isLandscape && localStyles.landscapeContainer, { 
      paddingTop: Math.max(insets.top, 20),
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: Math.max(insets.left, 12),
      paddingRight: Math.max(insets.right, 12),
    }]}>
        {!isLandscape ? <Text variant="displaySmall" style={styles.gameTitle}>Login</Text> : null}
        <View style={styles.formContainer}>
          <Snackbar
            visible={showSuccess}
            onDismiss={() => setShowSuccess(false)}
            duration={4000}
            style={localStyles.successSnackbar}
          >
            ✅ Registration successful!
          </Snackbar>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => Keyboard.dismiss()}
            accessibilityRole="text"
            accessibilityLabel="Username"
            accessibilityHint="Enter your username"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            secureTextEntry
            autoComplete="password"
            style={localStyles.input}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessibilityRole="text"
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
          />
          <HelperText type="error" visible={!!authError}>
            {authError}
          </HelperText>
          <View style={[isLandscape ? localStyles.buttonRow : localStyles.buttonColumn, isLandscape && localStyles.landscapeButtonContainer]}>
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={authLoading}
              disabled={authLoading}
              style={[styles.gameButton, isLandscape && localStyles.landscapeButton]}
            >
              <Text variant='labelLarge' style={styles.primaryButtonText}>Log In</Text>
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={localStyles.forgotPasswordButton}
            >
              <Text variant='labelMedium' style={localStyles.forgotPasswordText}>Forgot Password?</Text>
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={[styles.outlineButton, isLandscape && localStyles.landscapeButton]}
            >
              <Text variant='labelLarge' style={styles.outlineButtonTextSmall}>Need an account? Register</Text>
            </Button>
          </View>
        </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  successSnackbar: {
    backgroundColor: colors.success,  
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 0,
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
  },
  landscapeContainer: {
    // Ensure proper alignment in landscape mode, especially for iOS
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: '100%',
  },
  landscapeButtonContainer: {
    // Ensure button container stays centered and doesn't stretch
    width: '100%',
    maxWidth: 480,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  landscapeButton: {
    width: 180,
    maxWidth: 180,
    minWidth: 180,
  },
  input: {
    marginBottom: 0,
    marginTop: 0,
    backgroundColor: colors.backgroundPaper,
  },
  forgotPasswordButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: colors.primary,
  },
});