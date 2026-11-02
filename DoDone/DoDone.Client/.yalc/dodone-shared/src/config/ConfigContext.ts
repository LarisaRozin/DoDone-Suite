/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { createContext } from 'react';

export interface LibraryConfig {
  baseUrl: string;
  // Add other global config options here as needed
  // timeout?: number;
  // defaultHeaders?: Record<string, string>;
}

export const ConfigContext = createContext<LibraryConfig | undefined>(undefined);
