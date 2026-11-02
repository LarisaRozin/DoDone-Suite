/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useContext } from "react";
import { GlobalNotificationContext } from "./GlobalNotificationContext.ts";

export const useGlobalNotification = () => {
  const ctx = useContext(GlobalNotificationContext);
  if (!ctx) throw new Error("useGlobalNotification must be used within GlobalNotificationProvider");
  return ctx;
};

