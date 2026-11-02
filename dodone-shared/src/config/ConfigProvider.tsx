/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { type ReactNode } from 'react';
import { ConfigContext, type LibraryConfig } from './ConfigContext';

interface ConfigProviderProps {
  children: ReactNode;
  config: LibraryConfig;
}

export function ConfigProvider({ children, config }: ConfigProviderProps) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
