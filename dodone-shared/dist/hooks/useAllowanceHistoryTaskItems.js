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
exports.useAllowanceHistoryTaskItems = useAllowanceHistoryTaskItems;
const react_1 = require("react");
const useAuth_1 = require("./auth/useAuth");
const useConfig_1 = require("../config/useConfig");
const ApiClient_1 = require("../utils/ApiClient");
function useAllowanceHistoryTaskItems(request) {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [pagedListRequest, setPagedListRequest] = (0, react_1.useState)(request);
    const [pagedAllowanceHistoryTaskItems, setPagedAllowanceHistoryTaskItems] = (0, react_1.useState)();
    const [loadingAllowanceHistoryTaskItems, setLoadingAllowanceHistoryTaskItems] = (0, react_1.useState)(true);
    const fetchAllowanceHistoryTaskItems = (0, react_1.useCallback)((requestToUse) => __awaiter(this, void 0, void 0, function* () {
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
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.allowanceHistories.getPagedTaskItemsList(requestToFetch);
            if (!data || data.success === false) {
                console.error("Failed to fetch allowance history task items:", (data === null || data === void 0 ? void 0 : data.message) || "Unknown error");
                setLoadingAllowanceHistoryTaskItems(false);
                return;
            }
            setPagedAllowanceHistoryTaskItems(data);
        }
        catch (err) {
            console.error("Error fetching allowance history task items:", err);
        }
        finally {
            setLoadingAllowanceHistoryTaskItems(false);
        }
    }), [token, baseUrl]);
    function refreshAllowanceHistoryTaskItems(request) {
        setPagedListRequest(request);
        // Pass the request directly to fetchAllowanceHistoryTaskItems to avoid state timing issues
        fetchAllowanceHistoryTaskItems(request);
    }
    (0, react_1.useEffect)(() => {
        // Only fetch on initial load if we have a valid request
        if (pagedListRequest) {
            fetchAllowanceHistoryTaskItems(pagedListRequest);
        }
    }, [fetchAllowanceHistoryTaskItems]);
    return { pagedAllowanceHistoryTaskItems, loadingAllowanceHistoryTaskItems, refreshAllowanceHistoryTaskItems };
}
