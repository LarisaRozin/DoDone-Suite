"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConfig = useConfig;
const react_1 = require("react");
const ConfigContext_1 = require("./ConfigContext");
function useConfig() {
    const context = (0, react_1.useContext)(ConfigContext_1.ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider. Make sure to wrap your app with <ConfigProvider config={{ baseUrl: "your-api-url" }}>');
    }
    return context;
}
