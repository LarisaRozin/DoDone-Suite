/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { createContext } from 'react';
import { type AuthState, type AuthAction } from "./AuthState";

type AuthContextType = AuthState & { dispatch: React.Dispatch<AuthAction> };

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
