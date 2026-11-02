/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState } from "react";
import { GlobalNotificationContext } from "./GlobalNotificationContext.ts";
import type { Notification as CustomNotification } from "./Notification.tsx";

export const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<CustomNotification | null>(null);
  return (
    <GlobalNotificationContext.Provider value={{ notification, setNotification }}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};