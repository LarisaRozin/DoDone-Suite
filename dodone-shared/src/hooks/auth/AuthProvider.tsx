/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useReducer, useMemo, useEffect, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { type User } from '../../types/User';
import { type AuthState, type AuthAction } from './AuthState';
import storage from '../../utils/storage';

interface AuthProviderProps {
  children: ReactNode;
}

const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.user, token: action.token, authError: '', authLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, authError: '', authLoading: false };
    case 'SET_ERROR':
      return { ...state, authError: action.error, authLoading: false };
    case 'SET_LOADING':
      return { ...state, authLoading: action.loading };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  authError: '',
  authLoading: false,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    (async () => {
      const storedUser = await storage.getItem(USER_KEY);
      const storedToken = await storage.getItem(TOKEN_KEY);
      if (storedUser && storedToken) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          user: JSON.parse(storedUser) as User,
          token: storedToken,
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (state.user) {
      storage.setItem(USER_KEY, JSON.stringify(state.user));
      // Store user_id separately for easy access (e.g., for celebration checks)
      storage.setItem('user_id', state.user.id.toString());
    } else {
      storage.removeItem(USER_KEY);
      storage.removeItem('user_id');
    }
  }, [state.user]);

  useEffect(() => {
    if (state.token) {
      storage.setItem(TOKEN_KEY, state.token);
    } else {
      storage.removeItem(TOKEN_KEY);
    }
  }, [state.token]);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
    }),
    [state]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

