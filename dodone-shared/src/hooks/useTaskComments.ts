/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { TaskCommentResponse } from "../types/TaskItem";
import { useAuth } from "./auth/useAuth";
import { useConfig } from "../config/useConfig";
import { createApiClient } from "../utils/ApiClient";
import { PagedTaskCommentListRequest, PagedTaskCommentListResponse } from "../utils/paging";

export function useTaskComments(request: PagedTaskCommentListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedTaskCommentListRequest>(request);
  const [pagedTaskComments, setPagedTaskComments] = useState<PagedTaskCommentListResponse<TaskCommentResponse>>();
  const [loadingTaskComments, setLoadingTaskComments] = useState(true);

const fetchTaskComments = useCallback(async (requestToUse?: PagedTaskCommentListRequest) => {
  const requestToFetch = requestToUse || pagedListRequest;
  
  if (!token) {
    setLoadingTaskComments(false);
    return;
  }

  if (!requestToFetch) {
    console.error("No request available for fetching task items");
    setLoadingTaskComments(false);
    return;
  }

  setLoadingTaskComments(true);

  try {
    const apiClient = createApiClient(baseUrl, token);
    const data = await apiClient.comments.getList(requestToFetch);
    if (!data || data.success === false) {
      console.error("Failed to fetch task comments:", data?.message || "Unknown error");
      setLoadingTaskComments(false);
      return;
    }

    setPagedTaskComments(data);
  } catch (err) {
    console.error("Error fetching task comments:", err);
  } finally {
    setLoadingTaskComments(false);
  }
}, [token, baseUrl]);

function refreshTaskComments(request: PagedTaskCommentListRequest) {
  setPagedListRequest(request);
  // Pass the request directly to fetchTaskComments to avoid state timing issues
  fetchTaskComments(request);  
}

  useEffect(() => {
    // Only fetch on initial load if we have a valid request
    if (pagedListRequest) {
      fetchTaskComments(pagedListRequest);
    }
  }, [fetchTaskComments]);

  return { pagedTaskComments, loadingTaskComments, refreshTaskComments };
}