/*
 * Copyright (c) 2025 LarisaRozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { TaskKindDetailsResponse } from "../types/TaskItem";
import { API_ROUTES } from "../api/routes";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedListRequest, PagedListResponse } from "../utils/paging";

export function useTaskKinds(request: PagedListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedListRequest>(request);
  const [pagedTaskKinds, setPagedTaskKinds] = useState<PagedListResponse<TaskKindDetailsResponse>>();
  const [loading, setLoading] = useState(true);

  const fetchKinds = useCallback(async (requestToUse?: PagedListRequest) => {
    const requestToFetch = requestToUse || pagedListRequest;
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (!requestToFetch) {
      console.error("No request available for fetching task kinds");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.getPagedListDetails<TaskKindDetailsResponse>(
        API_ROUTES.taskKinds.getPagedListDetails(), 
        requestToFetch
      );
      if (!data || data.success === false) {
        console.error("Failed to fetch task kinds:", data?.message || "Unknown error");
        setLoading(false);
        return;
      }

      setPagedTaskKinds(data);
    } catch (error) {
      console.error("Error fetching task kinds:", error);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  function refreshTaskKinds(request: PagedListRequest) {
    setPagedListRequest(request);
    // Pass the request directly to fetchKinds to avoid state timing issues
    fetchKinds(request);  
  }

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchKinds(pagedListRequest);
    }
  }, [fetchKinds]);

  return { pagedTaskKinds, loading, refreshTaskKinds };
}