/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

export interface DeviceRegistrationRequest {
    deviceId: string;
    fcmToken: string;
    platform: "ios" | "android" | "windows" | "macos" | "web";
    timezone: string;
}