/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { TaskGroupDetailsResponse } from "../types/TaskItem";
import { API_ROUTES } from "../api/routes";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedListRequest, PagedListResponse } from "../utils/paging";

export function useTaskGroups(request: PagedListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedListRequest>(request);
  const [pagedTaskGroups, setPagedTaskGroups] = useState<PagedListResponse<TaskGroupDetailsResponse>>();
  const [taskGroupsLoading, setLoading] = useState(true);

  const fetchGroups = useCallback(async (requestToUse?: PagedListRequest) => {
    const requestToFetch = requestToUse || pagedListRequest;
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (!requestToFetch) {
      console.error("No request available for fetching task groups");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.getPagedListDetails<TaskGroupDetailsResponse>(
        API_ROUTES.taskGroups.getPagedListDetails(), 
        requestToFetch
      );
      if (!data || data.success === false) {
        console.error("Failed to fetch task groups:", data?.message || "Unknown error");
        setLoading(false);
        return;
      }

      setPagedTaskGroups(data);
    } catch (error) {
      console.error("Error fetching task groups:", error);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  function refreshTaskGroups(request: PagedListRequest) {
    setPagedListRequest(request);
    // Pass the request directly to fetchGroups to avoid state timing issues
    fetchGroups(request);  
  }

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchGroups(pagedListRequest);
    }
  }, [fetchGroups]);

  return { pagedTaskGroups, taskGroupsLoading, refreshTaskGroups };
}