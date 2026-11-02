/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useCallback } from "react";
import { useConfig } from "../config/useConfig";
import { useAuth } from "./auth/useAuth";
import { createApiClient } from "../utils/ApiClient";
import { 
  UserNotificationPreferenceResponse, 
  BulkNotificationPreferenceUpdateRequest, 
  BulkNotificationPreferenceCreateRequest
} from "../types/UserNotificationPreferences";

export function useNotificationPreferences() {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [notificationPreferences, setNotificationPreferences] = useState<UserNotificationPreferenceResponse[] | null>(null);
  const [loadingNotificationPreferences, setLoading] = useState(false);
  const [updatingNotificationPreferences, setUpdating] = useState(false);

  const getUserNotificationPreferences = useCallback(async () => {
    if (!token) {
      return null;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.notifications.getUserNotificationPreferences();
      
      if (!response || response.success === false) {
        console.error("Failed to fetch user notification preferences:", response?.message || "Unknown error");
        return null;
      }

      setNotificationPreferences(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user notification preferences:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  const updateUserNotificationPreferences = useCallback(async (request: BulkNotificationPreferenceUpdateRequest) => {
    if (!token) {
      return null;
    }

    setUpdating(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.notifications.updateUserNotificationPreferences(request);
      
      if (!response || response.success === false) {
        console.error("Failed to update user notification preferences:", response?.message || "Unknown error");
        return null;
      }

      // Refresh the preferences after successful update
      await getUserNotificationPreferences();

      return response;
    } catch (error) {
      console.error("Error updating user notification preferences:", error);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [token, baseUrl, getUserNotificationPreferences]);

  const createUserNotificationPreferences = useCallback(async (request: BulkNotificationPreferenceCreateRequest) => {
    if (!token) {
      return null;
    }

    setUpdating(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.notifications.createUserNotificationPreferences(request);

      if (!response || response.success === false) {
        console.error("Failed to create user notification preferences:", response?.message || "Unknown error");
        return null;
      }

      // Refresh the preferences after successful creation
      await getUserNotificationPreferences();

      return response;
    } catch (error) {
      console.error("Error creating user notification preferences:", error);
      return null;
    } finally {
      setUpdating(false);
    }
  }, [token, baseUrl, getUserNotificationPreferences]);

  return {
    notificationPreferences,
    createUserNotificationPreferences,
    updateUserNotificationPreferences,
    getUserNotificationPreferences,
    loadingNotificationPreferences,
    updatingNotificationPreferences,
  };
}
