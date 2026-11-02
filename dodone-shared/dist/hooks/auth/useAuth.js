"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
const AuthContext_1 = require("./AuthContext");
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext_1.AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
