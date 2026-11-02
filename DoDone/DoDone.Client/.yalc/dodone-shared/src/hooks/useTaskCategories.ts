/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { TaskCategoryDetailsResponse } from "../types/TaskItem";
import { API_ROUTES } from "../api/routes";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedListRequest, PagedListResponse } from "../utils/paging";

export function useTaskCategories(request: PagedListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedListRequest>(request);
  const [pagedTaskCategories, setPagedTaskCategories] = useState<PagedListResponse<TaskCategoryDetailsResponse>>();
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async (requestToUse?: PagedListRequest) => {
    const requestToFetch = requestToUse || pagedListRequest;
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (!requestToFetch) {
      console.error("No request available for fetching task categories");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.getPagedListDetails<TaskCategoryDetailsResponse>(
        API_ROUTES.taskCategories.getPagedListDetails(), 
        requestToFetch
      );
      if (!data || data.success === false) {
        console.error("Failed to fetch task categories:", data?.message || "Unknown error");
        setLoading(false);
        return;
      }

      setPagedTaskCategories(data);
    } catch (error) {
      console.error("Error fetching task categories:", error);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  function refreshTaskCategories(request: PagedListRequest) {
    setPagedListRequest(request);
    // Pass the request directly to fetchCategories to avoid state timing issues
    fetchCategories(request);  
  }

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchCategories(pagedListRequest);
    }
  }, [fetchCategories]);

  return { pagedTaskCategories, loading, refreshTaskCategories };
}