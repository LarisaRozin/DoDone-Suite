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
exports.useTeam = useTeam;
const react_1 = require("react");
const useConfig_1 = require("../config/useConfig");
const useAuth_1 = require("./auth/useAuth");
const ApiClient_1 = require("../utils/ApiClient");
function useTeam(request) {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [pagedListRequest, setPagedListRequest] = (0, react_1.useState)(request);
    const [teamMembersList, setPagedTeam] = (0, react_1.useState)();
    const [loadingTeamMembers, setLoading] = (0, react_1.useState)(true);
    const [teamDetails, setTeamDetails] = (0, react_1.useState)(null);
    const [loadingTeamDetails, setLoadingTeamDetails] = (0, react_1.useState)(false);
    const [updatingTeamDetails, setUpdatingTeamDetails] = (0, react_1.useState)(false);
    const [allowanceIntervals, setAllowanceIntervals] = (0, react_1.useState)([]);
    const [loadingAllowanceIntervals, setLoadingAllowanceIntervals] = (0, react_1.useState)(false);
    const [creatingAllowanceInterval, setCreatingAllowanceInterval] = (0, react_1.useState)(false);
    const [updatingAllowanceInterval, setUpdatingAllowanceInterval] = (0, react_1.useState)(false);
    const [deletingAllowanceInterval, setDeletingAllowanceInterval] = (0, react_1.useState)(false);
    const [fetchingAllowanceInterval, setFetchingAllowanceInterval] = (0, react_1.useState)(false);
    const fetchTeamMembers = (0, react_1.useCallback)((requestToUse) => __awaiter(this, void 0, void 0, function* () {
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
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.teams.getTeamMembers(requestToFetch);
            if (!data || data.success === false) {
                console.error("Failed to fetch team members:", (data === null || data === void 0 ? void 0 : data.message) || "Unknown error");
                setLoading(false);
                return;
            }
            setPagedTeam(data);
        }
        catch (error) {
            console.error("Error fetching team members:", error);
        }
        finally {
            setLoading(false);
        }
    }), [token, baseUrl]);
    function refreshTeamMembers(request) {
        setPagedListRequest(request);
        // Pass the request directly to fetchTeam to avoid state timing issues
        fetchTeamMembers(request);
    }
    const fetchTeamDetails = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return;
        }
        setLoadingTeamDetails(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.teams.getTeamDetails();
            if (!data || data.success === false) {
                console.error("Failed to fetch team details:", (data === null || data === void 0 ? void 0 : data.message) || "Unknown error");
                return null;
            }
            setTeamDetails(data);
            return data;
        }
        catch (error) {
            console.error("Error fetching team details:", error);
            return null;
        }
        finally {
            setLoadingTeamDetails(false);
        }
    }), [token, baseUrl]);
    const updateTeamDetails = (0, react_1.useCallback)((teamUpdateRequest) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setUpdatingTeamDetails(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.teams.updateTeamDetails(teamUpdateRequest);
            if (!response || response.success === false) {
                console.error("Failed to update team details:", (response === null || response === void 0 ? void 0 : response.message) || "Unknown error");
                return null;
            }
            // Update local state with the updated team details
            if (response.data) {
                // Convert TeamResponse to TeamDetailsResponse format for consistency
                const updatedTeamDetails = Object.assign({}, response.data);
                setTeamDetails(updatedTeamDetails);
            }
            return response;
        }
        catch (error) {
            console.error("Error updating team details:", error);
            return null;
        }
        finally {
            setUpdatingTeamDetails(false);
        }
    }), [token, baseUrl]);
    const fetchAllowanceIntervals = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setLoadingAllowanceIntervals(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.teams.getTeamAllowanceIntervals();
            setAllowanceIntervals(data.allowanceIntervals || []);
            return data;
        }
        catch (error) {
            console.error("Error fetching allowance intervals:", error);
            return null;
        }
        finally {
            setLoadingAllowanceIntervals(false);
        }
    }), [token, baseUrl]);
    const fetchAllowanceInterval = (0, react_1.useCallback)((id) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setFetchingAllowanceInterval(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.teams.getTeamAllowanceInterval(id);
            return data;
        }
        catch (error) {
            console.error("Error fetching allowance interval:", error);
            return null;
        }
        finally {
            setFetchingAllowanceInterval(false);
        }
    }), [token, baseUrl]);
    const createAllowanceInterval = (0, react_1.useCallback)((request) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setCreatingAllowanceInterval(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.teams.createTeamAllowanceInterval(request);
            // Refresh the allowance intervals list after creation
            yield fetchAllowanceIntervals();
            return response;
        }
        catch (error) {
            console.error("Error creating allowance interval:", error);
            return null;
        }
        finally {
            setCreatingAllowanceInterval(false);
        }
    }), [token, baseUrl, fetchAllowanceIntervals]);
    const updateAllowanceInterval = (0, react_1.useCallback)((request) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return null;
        }
        setUpdatingAllowanceInterval(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const response = yield apiClient.teams.updateTeamAllowanceInterval(request);
            // Update the local state with the updated allowance interval
            setAllowanceIntervals(prev => prev.map(interval => interval.id === request.id ? response : interval));
            return response;
        }
        catch (error) {
            console.error("Error updating allowance interval:", error);
            return null;
        }
        finally {
            setUpdatingAllowanceInterval(false);
        }
    }), [token, baseUrl]);
    const deleteAllowanceInterval = (0, react_1.useCallback)((id) => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return false;
        }
        setDeletingAllowanceInterval(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const success = yield apiClient.teams.deleteTeamAllowanceInterval(id);
            if (!success) {
                console.error("Failed to delete allowance interval");
                return false;
            }
            // Remove the deleted interval from local state
            setAllowanceIntervals(prev => prev.filter(interval => interval.id !== id));
            return true;
        }
        catch (error) {
            console.error("Error deleting allowance interval:", error);
            return false;
        }
        finally {
            setDeletingAllowanceInterval(false);
        }
    }), [token, baseUrl]);
    (0, react_1.useEffect)(() => {
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
