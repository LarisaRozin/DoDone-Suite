/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { createContext } from "react";
import type { GlobalNotificationContextType } from "./GlobalNotificationContextType.ts";

export const GlobalNotificationContext = createContext<GlobalNotificationContextType | null>(null);