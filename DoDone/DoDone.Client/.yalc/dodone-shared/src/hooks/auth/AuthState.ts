/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { type User } from "../../types/User";

export type AuthState = {
    user: User | null;
    token: string | null;
    authError: string;
    authLoading: boolean;
};

export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; user: User; token: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SET_LOADING'; loading: boolean };
