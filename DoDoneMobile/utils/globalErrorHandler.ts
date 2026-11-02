/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { navigationRef } from '../services/NavigationService';

// Store the dispatch function globally
let authDispatch: any = null;

/**
 * Sets the auth dispatch function for the global error handler
 * @param dispatch - The dispatch function from useAuth()
 */
export function setGlobalAuthDispatch(dispatch: any) {
  authDispatch = dispatch;
}

/**
 * Checks if an error is a 401 authentication error
 */
function is401Error(error: any): boolean {
  if (!error) return false;
  
  // Check various ways 401 errors might be represented
  if (error.status === 401) return true;
  if (error.statusCode === 401) return true;
  if (error.response?.status === 401) return true;
  
  // Check error message for 401 or unauthorized
  const message = error.message?.toLowerCase() || '';
  if (message.includes('401') || message.includes('unauthorized')) return true;
  
  return false;
}

/**
 * Handles 401 errors by logging out the user and navigating to login screen
 */
function handle401Error() {
  console.log('🔒 Global handler: Token expired - logging out user');
  
  try {
    // Dispatch logout action to clear auth state
    if (authDispatch) {
      authDispatch({ type: 'LOGOUT' });
    }
    
    // Navigate to login screen with a slight delay to allow state to update
    if (navigationRef.isReady()) {
      setTimeout(() => {
        try {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' as any }],
          });
        } catch (navError) {
          console.error('Error navigating to login during 401 handling:', navError);
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error in handle401Error:', error);
  }
}

/**
 * Sets up global error handlers for unhandled promise rejections and errors
 * This catches 401 errors from anywhere in the app, including hooks from dodone-shared
 */
export function setupGlobalErrorHandlers() {
  // Track if we've already handled a 401 to prevent multiple logouts
  let hasHandled401 = false;
  let lastHandledTime = 0;
  
  // Reset the flag if enough time has passed (prevents rapid repeated logouts)
  const shouldHandle401 = () => {
    const now = Date.now();
    if (hasHandled401 && now - lastHandledTime < 2000) {
      return false; // Less than 2 seconds since last 401, skip
    }
    return true;
  };

  // Intercept fetch to catch 401 responses globally
  // This is the most reliable way to catch 401s from hooks and anywhere else
  const originalFetch = globalThis.fetch;
  
  globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
   
    try {
      const response = await originalFetch(input, init);
      
      // Check if response is 401 Unauthorized
      if (response.status === 401 && shouldHandle401()) {
        // Don't auto-logout for login/register endpoints - let them handle their own errors
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        
        if (!isAuthEndpoint) {
          hasHandled401 = true;
          lastHandledTime = Date.now();
          console.log('🔒 Fetch interceptor: 401 Unauthorized detected');
          handle401Error();
        }
      }
      
      return response;
    } catch (error: any) {
      // Also check for network errors that might indicate auth issues
      if (is401Error(error) && shouldHandle401()) {
        hasHandled401 = true;
        lastHandledTime = Date.now();
        console.log('🔒 Fetch error: 401 error detected', error);
        handle401Error();
      }
      throw error;
    }
  };

  // React Native global error handler - catches uncaught errors and promise rejections
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (is401Error(error) && shouldHandle401()) {
      hasHandled401 = true;
      lastHandledTime = Date.now();
      console.log('🔒 Global error handler: 401 error detected', error.message || error);
      handle401Error();
    }
    
    // Call original handler for all errors (including 401s, for logging purposes)
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });

  console.log('✅ Global error handlers and fetch interceptor for 401 detection set up');
}

/**
 * Wraps an async function to catch and handle 401 errors
 * Useful for wrapping hook results or custom async operations
 */
export function with401Handler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (is401Error(error)) {
        console.log('🔒 Function wrapper: 401 error detected');
        handle401Error();
      }
      throw error;
    }
  }) as T;
}
