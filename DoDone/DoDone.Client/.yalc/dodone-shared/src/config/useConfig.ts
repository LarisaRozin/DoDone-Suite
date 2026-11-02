/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useContext } from 'react';
import { ConfigContext } from './ConfigContext';

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider. Make sure to wrap your app with <ConfigProvider config={{ baseUrl: "your-api-url" }}>');
  }
  return context;
}
