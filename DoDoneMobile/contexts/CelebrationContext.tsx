/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationData } from '../services/PushNotificationService';
import { NotificationType } from '@larisarozin/dodone-shared';

export interface CelebrationData {
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
}

interface CelebrationContextType {
  showCelebration: (data: CelebrationData) => void;
  celebrationData: CelebrationData | null;
  isCelebrationVisible: boolean;
  hideCelebration: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const useCelebration = (): CelebrationContextType => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: ReactNode;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({ children }) => {
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [isCelebrationVisible, setIsCelebrationVisible] = useState(false);

  const showCelebration = (data: CelebrationData) => {
    setCelebrationData(data);
    setIsCelebrationVisible(true);
  };

  const hideCelebration = () => {
    setIsCelebrationVisible(false);
    setCelebrationData(null);
  };

  const value: CelebrationContextType = {
    showCelebration,
    celebrationData,
    isCelebrationVisible,
    hideCelebration,
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
};

export default CelebrationContext;