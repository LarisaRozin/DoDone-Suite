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
exports.useTaskItems = useTaskItems;
const react_1 = require("react");
const useAuth_1 = require("./auth/useAuth");
const useConfig_1 = require("../config/useConfig");
const ApiClient_1 = require("../utils/ApiClient");
// TODO: Add other task item API operations
function useTaskItems(request) {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [pagedListRequest, setPagedListRequest] = (0, react_1.useState)(request);
    const [pagedTaskItems, setPagedTaskItems] = (0, react_1.useState)();
    const [loadingTaskItems, setLoadingTaskItems] = (0, react_1.useState)(true);
    const fetchTaskItems = (0, react_1.useCallback)((requestToUse) => __awaiter(this, void 0, void 0, function* () {
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
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.tasks.getPagedListDetails(requestToFetch);
            if (!data || data.success === false) {
                console.error("Failed to fetch task items:", (data === null || data === void 0 ? void 0 : data.message) || "Unknown error");
                setLoadingTaskItems(false);
                return;
            }
            setPagedTaskItems(data);
        }
        catch (error) {
            console.error("Error fetching task items:", error);
        }
        finally {
            setLoadingTaskItems(false);
        }
    }), [token, baseUrl]);
    function refreshTaskItems(request) {
        setPagedListRequest(request);
        // Pass the request directly to fetchTaskItems to avoid state timing issues
        fetchTaskItems(request);
    }
    (0, react_1.useEffect)(() => {
        // Only fetch on initial load if we have a valid request
        if (pagedListRequest) {
            fetchTaskItems(pagedListRequest);
        }
    }, [fetchTaskItems]);
    return { pagedTaskItems, loadingTaskItems, refreshTaskItems };
}
