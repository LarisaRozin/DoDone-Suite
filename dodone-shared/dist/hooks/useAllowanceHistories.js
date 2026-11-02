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
exports.useAllowanceHistories = useAllowanceHistories;
const react_1 = require("react");
const useAuth_1 = require("./auth/useAuth");
const useConfig_1 = require("../config/useConfig");
const ApiClient_1 = require("../utils/ApiClient");
function useAllowanceHistories(request) {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [pagedListRequest, setPagedListRequest] = (0, react_1.useState)(request);
    const [pagedAllowanceHistories, setPagedAllowanceHistories] = (0, react_1.useState)();
    const [loadingAllowanceHistories, setLoadingAllowanceHistories] = (0, react_1.useState)(true);
    const fetchAllowanceHistories = (0, react_1.useCallback)((requestToUse) => __awaiter(this, void 0, void 0, function* () {
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
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.allowanceHistories.getPagedList(requestToFetch);
            if (!data || data.success === false) {
                console.error("Failed to fetch allowance histories:", (data === null || data === void 0 ? void 0 : data.message) || "Unknown error");
                setLoadingAllowanceHistories(false);
                return;
            }
            setPagedAllowanceHistories(data);
        }
        catch (err) {
            console.error("Error fetching allowance histories:", err);
        }
        finally {
            setLoadingAllowanceHistories(false);
        }
    }), [token, baseUrl]);
    function refreshAllowanceHistories(request) {
        setPagedListRequest(request);
        // Pass the request directly to fetchAllowanceHistories to avoid state timing issues
        fetchAllowanceHistories(request);
    }
    function approveAllowance(request) {
        if (!baseUrl || !token) {
            throw new Error("Missing baseUrl or token for API client");
        }
        const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
        const data = apiClient.allowanceHistories.approveAllowance(request);
        //   refreshAllowanceHistories(pagedListRequest);
        return data;
    }
    function claimAllowance(request) {
        if (!baseUrl || !token) {
            throw new Error("Missing baseUrl or token for API client");
        }
        const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
        const data = apiClient.allowanceHistories.claimAllowance(request);
        //   refreshAllowanceHistories(pagedListRequest);
        return data;
    }
    (0, react_1.useEffect)(() => {
        // Only fetch on initial load if we have a valid request
        if (pagedListRequest) {
            fetchAllowanceHistories(pagedListRequest);
        }
    }, [fetchAllowanceHistories]);
    return { pagedAllowanceHistories, loadingAllowanceHistories, refreshAllowanceHistories, approveAllowance, claimAllowance };
}
