/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import type { NotificationType } from "./NotificationType.ts";

export type Notification = {
  type: NotificationType;
  message: string;
};