/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { createApiClient as originalCreateApiClient, ResponseBase } from '@larisarozin/dodone-shared';
import { navigationRef } from '../services/NavigationService';

// Store the dispatch function globally so the interceptor can access it
let authDispatch: any = null;

/**
 * Sets the auth dispatch function for the API client wrapper
 * This should be called from a component that has access to useAuth()
 * @param dispatch - The dispatch function from useAuth()
 */
export function setAuthDispatch(dispatch: any) {
  authDispatch = dispatch;
}

/**
 * Enhanced API client wrapper that intercepts 401 errors and automatically logs out
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @returns Enhanced ApiClient instance with 401 error handling
 */
export function createApiClientWithAuth(baseUrl: string, token: string) {
  const client = originalCreateApiClient(baseUrl, token);

  // Store the original methods to wrap them
  const originalGet = client.get.bind(client);
  const originalPost = client.post.bind(client);
  const originalPut = client.put.bind(client);
  const originalDelete = client.delete.bind(client);
  const originalGetPagedList = client.getPagedList.bind(client);
  const originalGetPagedListDetails = client.getPagedListDetails.bind(client);
  const originalGetPagedTaskItemList = client.getPagedTaskItemList.bind(client);
  const originalGetPagedTaskItemListDetails = client.getPagedTaskItemListDetails.bind(client);
  const originalGetPagedTaskCommentList = client.getPagedTaskCommentList.bind(client);
  const originalGetPagedAllowanceHistoriesList = client.getPagedAllowanceHistoriesList.bind(client);
  const originalGetPagedAllowanceHistoryTaskItemsList = client.getPagedAllowanceHistoryTaskItemsList.bind(client);

  /**
   * Handles 401 errors by logging out the user and navigating to login screen
   */
  const handle401Error = () => {
    console.log('🔒 Token expired - logging out user');
    
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
            console.error('Error navigating to login after 401:', navError);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error in handle401Error:', error);
    }
  };

  /**
   * Wraps an API call to intercept 401 errors
   */
  const wrapApiCall = async <T,>(apiCall: () => Promise<T>): Promise<T> => {
    try {
      return await apiCall();
    } catch (error: any) {
      // Check if it's a 401 error
      if (error?.status === 401 || error?.message?.includes('401') || error?.message?.toLowerCase().includes('unauthorized')) {
        handle401Error();
        throw new Error('Authentication token expired. Please log in again.');
      }
      
      // Re-throw other errors
      throw error;
    }
  };

  // Wrap all HTTP methods - use bind to preserve context
  client.get = <T,>(route: string, options?: RequestInit): Promise<T> => {
    return wrapApiCall(() => originalGet(route, options));
  };

  client.post = <T,>(route: string, body?: any, options?: RequestInit): Promise<T> => {
    return wrapApiCall(() => originalPost(route, body, options));
  };

  client.put = <T,>(route: string, body?: any, options?: RequestInit): Promise<T> => {
    return wrapApiCall(() => originalPut(route, body, options));
  };

  client.delete = (route: string, options?: RequestInit): Promise<ResponseBase> => {
    return wrapApiCall(() => originalDelete(route, options));
  };

  client.getPagedList = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedList(endpoint, request));
  };

  client.getPagedListDetails = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedListDetails(endpoint, request));
  };

  client.getPagedTaskItemList = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedTaskItemList(endpoint, request));
  };

  client.getPagedTaskItemListDetails = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedTaskItemListDetails(endpoint, request));
  };

  client.getPagedTaskCommentList = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedTaskCommentList(endpoint, request));
  };

  client.getPagedAllowanceHistoriesList = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedAllowanceHistoriesList(endpoint, request));
  };

  client.getPagedAllowanceHistoryTaskItemsList = (endpoint: string, request: any): Promise<any> => {
    return wrapApiCall(() => originalGetPagedAllowanceHistoryTaskItemsList(endpoint, request));
  };

  return client;
}

/**
 * Re-export createApiClient as the wrapped version for convenience
 * This allows existing code to continue using createApiClient with enhanced 401 handling
 */
export const createApiClient = createApiClientWithAuth;
