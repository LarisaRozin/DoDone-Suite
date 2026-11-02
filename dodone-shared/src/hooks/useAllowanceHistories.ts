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
import { AllowanceHistoryApprovalRequest, AllowanceHistoryClaimRequest, AllowanceHistoryResponse, PagedAllowanceHistoriesListRequest } from "../types/AllowanceHistory";

export function useAllowanceHistories(request: PagedAllowanceHistoriesListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedAllowanceHistoriesListRequest>(request);
  const [pagedAllowanceHistories, setPagedAllowanceHistories] = useState<PagedListResponse<AllowanceHistoryResponse>>();
  const [loadingAllowanceHistories, setLoadingAllowanceHistories] = useState(true);

const fetchAllowanceHistories = useCallback(async (requestToUse?: PagedAllowanceHistoriesListRequest) => {
  const requestToFetch = requestToUse || pagedListRequest;
  
  if (!token) {
    setLoadingAllowanceHistories(false);
    return;
  }

  if (!requestToFetch) {
    console.error("No request available for fetching allowance histories");
    setLoadingAllowanceHistories(false);
    return;
  }

  setLoadingAllowanceHistories(true);

  try {
    const apiClient = createApiClient(baseUrl, token);
    const data = await apiClient.allowanceHistories.getPagedList(requestToFetch);
    if (!data || data.success === false) {
      console.error("Failed to fetch allowance histories:", data?.message || "Unknown error");
      setLoadingAllowanceHistories(false);
      return;
    }

    setPagedAllowanceHistories(data);
  } catch (err) {
    console.error("Error fetching allowance histories:", err);
  } finally {
    setLoadingAllowanceHistories(false);
  }
}, [token, baseUrl]);

function refreshAllowanceHistories(request: PagedAllowanceHistoriesListRequest) {
  setPagedListRequest(request);
  // Pass the request directly to fetchAllowanceHistories to avoid state timing issues
  fetchAllowanceHistories(request);  
}

function approveAllowance(request: AllowanceHistoryApprovalRequest) {
  if (!baseUrl || !token) {
    throw new Error("Missing baseUrl or token for API client");
  }
  const apiClient = createApiClient(baseUrl, token);
  const data = apiClient.allowanceHistories.approveAllowance(request);
//   refreshAllowanceHistories(pagedListRequest);
  return data;
}

function claimAllowance(request: AllowanceHistoryClaimRequest) {
  if (!baseUrl || !token) {
    throw new Error("Missing baseUrl or token for API client");
  }
  const apiClient = createApiClient(baseUrl, token);
  const data = apiClient.allowanceHistories.claimAllowance(request);
//   refreshAllowanceHistories(pagedListRequest);
  return data;
}



useEffect(() => {
  // Only fetch on initial load if we have a valid request
  if (pagedListRequest) {
      fetchAllowanceHistories(pagedListRequest);
  }
}, [fetchAllowanceHistories]);

  return { pagedAllowanceHistories, loadingAllowanceHistories, refreshAllowanceHistories, approveAllowance, claimAllowance };
}