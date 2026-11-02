/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from "react";
import type { User } from "../types/User";
import { useConfig } from "../config/useConfig";
import { useAuth } from "./auth/useAuth";
import { createApiClient } from "../utils/ApiClient";
import { PagedListRequest, PagedListResponse } from "../utils/paging";
import { 
  TeamDetailsResponse, 
  TeamDetailsUpdateRequest, 
  // TeamAllowanceIntervalListResponse,
  TeamAllowanceIntervalResponse,
  TeamAllowanceIntervalCreateRequest,
  TeamAllowanceIntervalUpdateRequest
} from "../types/Team";

export function useTeam(request: PagedListRequest) {
  const { token } = useAuth();
  const { baseUrl } = useConfig();
  const [pagedListRequest, setPagedListRequest] = useState<PagedListRequest>(request);
  const [teamMembersList, setPagedTeam] = useState<PagedListResponse<User>>();
  const [loadingTeamMembers, setLoading] = useState(true);
  const [teamDetails, setTeamDetails] = useState<TeamDetailsResponse | null>(null);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(false);
  const [updatingTeamDetails, setUpdatingTeamDetails] = useState(false);
  const [allowanceIntervals, setAllowanceIntervals] = useState<TeamAllowanceIntervalResponse[]>([]);
  const [loadingAllowanceIntervals, setLoadingAllowanceIntervals] = useState(false);
  const [creatingAllowanceInterval, setCreatingAllowanceInterval] = useState(false);
  const [updatingAllowanceInterval, setUpdatingAllowanceInterval] = useState(false);
  const [deletingAllowanceInterval, setDeletingAllowanceInterval] = useState(false);
  const [fetchingAllowanceInterval, setFetchingAllowanceInterval] = useState(false);

  const fetchTeamMembers = useCallback(async (requestToUse?: PagedListRequest) => {
    const requestToFetch = requestToUse || pagedListRequest;
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (!requestToFetch) {
      console.error("No request available for fetching team members");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.teams.getTeamMembers(
        requestToFetch
      );
      if (!data || data.success === false) {
        console.error("Failed to fetch team members:", data?.message || "Unknown error");
        setLoading(false);
        return;
      }

      setPagedTeam(data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  function refreshTeamMembers(request: PagedListRequest) {
    setPagedListRequest(request);
    // Pass the request directly to fetchTeam to avoid state timing issues
    fetchTeamMembers(request);  
  }

  const fetchTeamDetails = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoadingTeamDetails(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.teams.getTeamDetails();
      
      if (!data || data.success === false) {
        console.error("Failed to fetch team details:", data?.message || "Unknown error");
        return null;
      }

      setTeamDetails(data);
      return data;
    } catch (error) {
      console.error("Error fetching team details:", error);
      return null;
    } finally {
      setLoadingTeamDetails(false);
    }
  }, [token, baseUrl]);

  const updateTeamDetails = useCallback(async (teamUpdateRequest: TeamDetailsUpdateRequest) => {
    if (!token) {
      return null;
    }

    setUpdatingTeamDetails(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.teams.updateTeamDetails(teamUpdateRequest);
      
      if (!response || response.success === false) {
        console.error("Failed to update team details:", response?.message || "Unknown error");
        return null;
      }

      // Update local state with the updated team details
      if (response.data) {
        // Convert TeamResponse to TeamDetailsResponse format for consistency
        const updatedTeamDetails: TeamDetailsResponse = {
          ...response.data,
        };
        setTeamDetails(updatedTeamDetails);
      }

      return response;
    } catch (error) {
      console.error("Error updating team details:", error);
      return null;
    } finally {
      setUpdatingTeamDetails(false);
    }
  }, [token, baseUrl]);

  const fetchAllowanceIntervals = useCallback(async () => {
    if (!token) {
      return null;
    }

    setLoadingAllowanceIntervals(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.teams.getTeamAllowanceIntervals();
      
      setAllowanceIntervals(data.allowanceIntervals || []);
      return data;
    } catch (error) {
      console.error("Error fetching allowance intervals:", error);
      return null;
    } finally {
      setLoadingAllowanceIntervals(false);
    }
  }, [token, baseUrl]);

  const fetchAllowanceInterval = useCallback(async (id: number) => {
    if (!token) {
      return null;
    }

    setFetchingAllowanceInterval(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const data = await apiClient.teams.getTeamAllowanceInterval(id);
      
      return data;
    } catch (error) {
      console.error("Error fetching allowance interval:", error);
      return null;
    } finally {
      setFetchingAllowanceInterval(false);
    }
  }, [token, baseUrl]);

  const createAllowanceInterval = useCallback(async (request: TeamAllowanceIntervalCreateRequest) => {
    if (!token) {
      return null;
    }

    setCreatingAllowanceInterval(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.teams.createTeamAllowanceInterval(request);
      
      // Refresh the allowance intervals list after creation
      await fetchAllowanceIntervals();

      return response;
    } catch (error) {
      console.error("Error creating allowance interval:", error);
      return null;
    } finally {
      setCreatingAllowanceInterval(false);
    }
  }, [token, baseUrl, fetchAllowanceIntervals]);

  const updateAllowanceInterval = useCallback(async (request: TeamAllowanceIntervalUpdateRequest) => {
    if (!token) {
      return null;
    }

    setUpdatingAllowanceInterval(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.teams.updateTeamAllowanceInterval(request);
      
      // Update the local state with the updated allowance interval
      setAllowanceIntervals(prev => 
        prev.map(interval => 
          interval.id === request.id ? response : interval
        )
      );

      return response;
    } catch (error) {
      console.error("Error updating allowance interval:", error);
      return null;
    } finally {
      setUpdatingAllowanceInterval(false);
    }
  }, [token, baseUrl]);

  const deleteAllowanceInterval = useCallback(async (id: number) => {
    if (!token) {
      return false;
    }

    setDeletingAllowanceInterval(true);

    try {
      const apiClient = createApiClient(baseUrl, token);
      const success = await apiClient.teams.deleteTeamAllowanceInterval(id);
      
      if (!success) {
        console.error("Failed to delete allowance interval");
        return false;
      }

      // Remove the deleted interval from local state
      setAllowanceIntervals(prev => 
        prev.filter(interval => interval.id !== id)
      );

      return true;
    } catch (error) {
      console.error("Error deleting allowance interval:", error);
      return false;
    } finally {
      setDeletingAllowanceInterval(false);
    }
  }, [token, baseUrl]);

  useEffect(() => {
    if (!token) {
      return;
    }

    // Only fetch on initial load if we have a valid request
      fetchTeamDetails();
      fetchAllowanceIntervals();
    if (pagedListRequest) {
      fetchTeamMembers(pagedListRequest);
    }
  }, [fetchTeamDetails, fetchAllowanceIntervals, fetchTeamMembers, pagedListRequest]);

  return { 
    teamMembersList, 
    loadingTeamMembers, 
    refreshTeamMembers, 
    teamDetails, 
    loadingTeamDetails, 
    updatingTeamDetails, 
    fetchTeamDetails, 
    updateTeamDetails,
    allowanceIntervals,
    loadingAllowanceIntervals,
    creatingAllowanceInterval,
    updatingAllowanceInterval,
    deletingAllowanceInterval,
    fetchingAllowanceInterval,
    fetchAllowanceIntervals,
    fetchAllowanceInterval,
    createAllowanceInterval,
    updateAllowanceInterval,
    deleteAllowanceInterval
  };
}