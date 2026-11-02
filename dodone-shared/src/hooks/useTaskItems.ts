/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { TaskItemDetailsResponse } from "../types/TaskItem";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedTaskItemListRequest, PagedTaskItemListResponse } from "../utils/paging";

// TODO: Add other task item API operations
export function useTaskItems(request: PagedTaskItemListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedTaskItemListRequest>(request);
  const [pagedTaskItems, setPagedTaskItems] = useState<PagedTaskItemListResponse<TaskItemDetailsResponse>>();
  const [loadingTaskItems, setLoadingTaskItems] = useState(true);

const fetchTaskItems = useCallback(async (requestToUse?: PagedTaskItemListRequest) => {
  const requestToFetch = requestToUse || pagedListRequest;
  
  if (!token) {
    setLoadingTaskItems(false);
    return;
  }

  if (!requestToFetch) {
    console.error("No request available for fetching task items");
    setLoadingTaskItems(false);
    return;
  }

  setLoadingTaskItems(true);

  try {
    const apiClient = createApiClient(baseUrl, token);
    const data = await apiClient.tasks.getPagedListDetails(requestToFetch);
    if (!data || data.success === false) {
      console.error("Failed to fetch task items:", data?.message || "Unknown error");
      setLoadingTaskItems(false);
      return;
    }

    setPagedTaskItems(data);
  } catch (error) {
    console.error("Error fetching task items:", error);
  } finally {
    setLoadingTaskItems(false);
  }
}, [token, baseUrl]);

function refreshTaskItems(request: PagedTaskItemListRequest) {
  setPagedListRequest(request);
  // Pass the request directly to fetchTaskItems to avoid state timing issues
  fetchTaskItems(request);  
}

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchTaskItems(pagedListRequest);
    }
  }, [fetchTaskItems]);

  return { pagedTaskItems, loadingTaskItems, refreshTaskItems };
}