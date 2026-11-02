/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import type { Notification } from './Notification.tsx';

export type GlobalNotificationContextType = {
  notification: Notification | null;
  setNotification: (n: Notification | null) => void;
};

