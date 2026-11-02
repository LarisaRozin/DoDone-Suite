/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedListResponse } from "../utils/paging";
import { AllowanceHistoryTaskItemResponse, PagedAllowanceHistoryTaskItemsListRequest } from "../types/AllowanceHistory";

export function useAllowanceHistoryTaskItems(request: PagedAllowanceHistoryTaskItemsListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedAllowanceHistoryTaskItemsListRequest>(request);
  const [pagedAllowanceHistoryTaskItems, setPagedAllowanceHistoryTaskItems] = useState<PagedListResponse<AllowanceHistoryTaskItemResponse>>();
  const [loadingAllowanceHistoryTaskItems, setLoadingAllowanceHistoryTaskItems] = useState(true);

const fetchAllowanceHistoryTaskItems = useCallback(async (requestToUse?: PagedAllowanceHistoryTaskItemsListRequest) => {
  const requestToFetch = requestToUse || pagedListRequest;
  
  if (!token) {
    setLoadingAllowanceHistoryTaskItems(false);
    return;
  }

  if (!requestToFetch) {
    console.error("No request available for fetching allowance history task items");
    setLoadingAllowanceHistoryTaskItems(false);
    return;
  }

  setLoadingAllowanceHistoryTaskItems(true);

  try {
    const apiClient = createApiClient(baseUrl, token);
    const data = await apiClient.allowanceHistories.getPagedTaskItemsList(requestToFetch);
    if (!data || data.success === false) {
      console.error("Failed to fetch allowance history task items:", data?.message || "Unknown error");
      setLoadingAllowanceHistoryTaskItems(false);
      return;
    }

    setPagedAllowanceHistoryTaskItems(data);
  } catch (err) {
    console.error("Error fetching allowance history task items:", err);
  } finally {
    setLoadingAllowanceHistoryTaskItems(false);
  }
}, [token, baseUrl]);

function refreshAllowanceHistoryTaskItems(request: PagedAllowanceHistoryTaskItemsListRequest) {
  setPagedListRequest(request);
  // Pass the request directly to fetchAllowanceHistoryTaskItems to avoid state timing issues
  fetchAllowanceHistoryTaskItems(request);  
}

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchAllowanceHistoryTaskItems(pagedListRequest);
    }
  }, [fetchAllowanceHistoryTaskItems]);

  return { pagedAllowanceHistoryTaskItems, loadingAllowanceHistoryTaskItems, refreshAllowanceHistoryTaskItems };
}