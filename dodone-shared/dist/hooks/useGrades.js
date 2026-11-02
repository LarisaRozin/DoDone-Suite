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
exports.useGrades = useGrades;
const react_1 = require("react");
const routes_1 = require("../api/routes");
const useAuth_1 = require("./auth/useAuth");
const useConfig_1 = require("../config/useConfig");
const ApiClient_1 = require("../utils/ApiClient");
function useGrades() {
    const { token } = (0, useAuth_1.useAuth)();
    const { baseUrl } = (0, useConfig_1.useConfig)();
    const [grades, setGrades] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchGrades = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const apiClient = (0, ApiClient_1.createApiClient)(baseUrl, token);
            const data = yield apiClient.get(routes_1.API_ROUTES.grades.getList());
            setGrades(data.data);
        }
        catch (error) {
            console.error("Error fetching grades:", error);
        }
        finally {
            setLoading(false);
        }
    }), [token, baseUrl]);
    (0, react_1.useEffect)(() => {
        fetchGrades();
    }, [fetchGrades]);
    return { grades, loading };
}
