"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotificationPreferences = useNotificationPreferences;
const react_1 = require("react");
const useConfig_1 = require("../config/useConfig");
const useAuth_1 = require("./auth/useAuth");
const ApiClient_1 = require("../utils/ApiClient");
function useNotificationPreferences() {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [notificationPreferences, setNotificationPreferences] = (0, react_1.useState)(null);
    const [loadingNotificationPreferences, setLoading] = (0, react_1.useState)(false);
    const [updatingNotificationPreferences, setUpdating] = (0, react_1.useState)(false);
    const getUserNotificationPreferences = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setLoading(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.notifications.getUserNotificationPreferences();
            if (!response || response.success === false) {
                console.error("Failed to fetch user notification preferences:", (response === null || response === void 0 ? void 0 : response.message) || "Unknown error");
                return null;
            }
            setNotificationPreferences(response.data);
            return response.data;
        }
        catch (error) {
            console.error("Error fetching user notification preferences:", error);
            return null;
        }
        finally {
            setLoading(false);
        }
    }), [token, baseUrl]);
    const updateUserNotificationPreferences = (0, react_1.useCallback)((request) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setUpdating(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.notifications.updateUserNotificationPreferences(request);
            if (!response || response.success === false) {
                console.error("Failed to update user notification preferences:", (response === null || response === void 0 ? void 0 : response.message) || "Unknown error");
                return null;
            }
            // Refresh the preferences after successful update
            yield getUserNotificationPreferences();
            return response;
        }
        catch (error) {
            console.error("Error updating user notification preferences:", error);
            return null;
        }
        finally {
            setUpdating(false);
        }
    }), [token, baseUrl, getUserNotificationPreferences]);
    const createUserNotificationPreferences = (0, react_1.useCallback)((request) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setUpdating(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.notifications.createUserNotificationPreferences(request);
            if (!response || response.success === false) {
                console.error("Failed to create user notification preferences:", (response === null || response === void 0 ? void 0 : response.message) || "Unknown error");
                return null;
            }
            // Refresh the preferences after successful creation
            yield getUserNotificationPreferences();
            return response;
        }
        catch (error) {
            console.error("Error creating user notification preferences:", error);
            return null;
        }
        finally {
            setUpdating(false);
        }
    }), [token, baseUrl, getUserNotificationPreferences]);
    return {
        notificationPreferences,
        createUserNotificationPreferences,
        updateUserNotificationPreferences,
        getUserNotificationPreferences,
        loadingNotificationPreferences,
        updatingNotificationPreferences,
    };
}
