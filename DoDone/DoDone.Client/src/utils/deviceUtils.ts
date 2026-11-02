/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

/**
 * Generates or retrieves a stable device identifier for web browsers.
 * The identifier is stored in localStorage to persist across sessions.
 * Falls back to generating a new UUID if localStorage is unavailable.
 */
export function getWebDeviceId(): string {
    const DEVICE_ID_KEY = 'dodone_web_device_id';
    
    try {
        // Try to get existing device ID from localStorage
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!deviceId) {
            // Generate a new UUID-like identifier
            deviceId = generateUUID();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        
        return deviceId;
    } catch {
        // If localStorage is not available (e.g., private browsing), 
        // generate a session-only identifier
        console.warn('localStorage unavailable, using session-only device ID');
        return generateUUID();
    }
}

/**
 * Generates a UUID v4 compatible identifier
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Gets the user's timezone in IANA format
 */
export function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        console.warn('Unable to detect timezone, defaulting to UTC');
        return 'UTC';
    }
}

/**
 * Gets the platform identifier for web
 */
export function getWebPlatform(): string {
    return 'web';
}
