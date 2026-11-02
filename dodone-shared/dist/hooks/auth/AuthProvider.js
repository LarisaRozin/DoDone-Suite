"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
const react_1 = require("react");
const AuthContext_1 = require("./AuthContext");
const storage_1 = __importDefault(require("../../utils/storage"));
const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';
function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return Object.assign(Object.assign({}, state), { user: action.user, token: action.token, authError: '', authLoading: false });
        case 'LOGOUT':
            return Object.assign(Object.assign({}, state), { user: null, token: null, authError: '', authLoading: false });
        case 'SET_ERROR':
            return Object.assign(Object.assign({}, state), { authError: action.error, authLoading: false });
        case 'SET_LOADING':
            return Object.assign(Object.assign({}, state), { authLoading: action.loading });
        default:
            return state;
    }
}
const initialState = {
    user: null,
    token: null,
    authError: '',
    authLoading: false,
};
function AuthProvider({ children }) {
    const [state, dispatch] = (0, react_1.useReducer)(authReducer, initialState);
    (0, react_1.useEffect)(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            const storedUser = yield storage_1.default.getItem(USER_KEY);
            const storedToken = yield storage_1.default.getItem(TOKEN_KEY);
            if (storedUser && storedToken) {
                dispatch({
                    type: 'LOGIN_SUCCESS',
                    user: JSON.parse(storedUser),
                    token: storedToken,
                });
            }
        }))();
    }, []);
    (0, react_1.useEffect)(() => {
        if (state.user) {
            storage_1.default.setItem(USER_KEY, JSON.stringify(state.user));
            // Store user_id separately for easy access (e.g., for celebration checks)
            storage_1.default.setItem('user_id', state.user.id.toString());
        }
        else {
            storage_1.default.removeItem(USER_KEY);
            storage_1.default.removeItem('user_id');
        }
    }, [state.user]);
    (0, react_1.useEffect)(() => {
        if (state.token) {
            storage_1.default.setItem(TOKEN_KEY, state.token);
        }
        else {
            storage_1.default.removeItem(TOKEN_KEY);
        }
    }, [state.token]);
    const value = (0, react_1.useMemo)(() => (Object.assign(Object.assign({}, state), { dispatch })), [state]);
    return ((0, jsx_runtime_1.jsx)(AuthContext_1.AuthContext.Provider, { value: value, children: children }));
}
