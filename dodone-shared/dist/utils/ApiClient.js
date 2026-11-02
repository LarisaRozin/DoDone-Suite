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
exports.ApiClient = void 0;
exports.createApiClient = createApiClient;
exports.apiCall = apiCall;
class ApiClient {
    constructor(config) {
        this.config = config;
    }
    /**
     * Makes an authenticated GET request
     * @param route - API route (will be concatenated with baseUrl)
     * @param options - Additional fetch options
     * @returns Promise with the response data
     */
    get(route_1) {
        return __awaiter(this, arguments, void 0, function* (route, options = {}) {
            const response = yield fetch(this.config.baseUrl + route, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: `Bearer ${this.config.token}` }, options.headers) }));
            if (!response.ok) {
                // Read the error response body to get the detailed error message
                try {
                    const errorBody = yield response.json();
                    const errorMessage = errorBody.message || `Failed to fetch ${route}: ${response.status} - ${response.statusText}`;
                    console.error(`Error fetching ${route}:`, response.status, errorMessage);
                    throw new Error(errorMessage);
                }
                catch (parseError) {
                    // If parsing fails, fall back to status text
                    console.error(`Error fetching ${route}:`, response.status, response.statusText);
                    throw new Error(`Failed to fetch ${route}: ${response.status} - ${response.statusText}`);
                }
            }
            return response.json();
        });
    }
    /**
     * Makes an authenticated POST request
     */
    post(route_1, body_1) {
        return __awaiter(this, arguments, void 0, function* (route, body, options = {}) {
            const response = yield fetch(this.config.baseUrl + route, Object.assign(Object.assign({ method: 'POST' }, options), { headers: Object.assign({ 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.token}` }, options.headers), body: body ? JSON.stringify(body) : undefined }));
            if (!response.ok) {
                // Read the error response body to get the detailed error message
                let errorMessage = '';
                try {
                    const errorBody = yield response.json();
                    errorMessage = errorBody.message || `Failed to post ${route}: ${response.status} - ${response.statusText}`;
                    console.error(`Error posting ${route}:`, response.status, errorMessage);
                }
                catch (parseError) {
                    // If parsing fails, fall back to status text
                    console.error(`Error posting ${route}:`, response.status, response.statusText);
                    throw new Error(`Failed to post ${route}: ${response.status} - ${response.statusText}`);
                }
                throw new Error(errorMessage);
            }
            return response.json();
        });
    }
    postMultimedia(route_1, body_1) {
        return __awaiter(this, arguments, void 0, function* (route, body, options = {}) {
            const response = yield fetch(this.config.baseUrl + route, Object.assign(Object.assign({ method: 'POST' }, options), { headers: Object.assign({ Authorization: `Bearer ${this.config.token}` }, options.headers), body: body }));
            if (!response.ok) {
                // Read the error response body to get the detailed error message
                let errorMessage = '';
                try {
                    const errorBody = yield response.json();
                    errorMessage = errorBody.message || `Failed to post multimedia ${route}: ${response.status} - ${response.statusText}`;
                    console.error(`Error posting multimedia ${route}:`, response.status, errorMessage);
                }
                catch (parseError) {
                    // If parsing fails, fall back to status text
                    console.error(`Error posting multimedia ${route}:`, response.status, response.statusText);
                    throw new Error(`Failed to post multimedia ${route}: ${response.status} - ${response.statusText}`);
                }
                throw new Error(errorMessage);
            }
            return response.json();
        });
    }
    /**
     * Makes an authenticated PUT request
     */
    put(route_1, body_1) {
        return __awaiter(this, arguments, void 0, function* (route, body, options = {}) {
            const response = yield fetch(this.config.baseUrl + route, Object.assign(Object.assign({ method: 'PUT' }, options), { headers: Object.assign({ 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.token}` }, options.headers), body: body ? JSON.stringify(body) : undefined }));
            if (!response.ok) {
                // Read the error response body to get the detailed error message
                let errorMessage = '';
                try {
                    const errorBody = yield response.json();
                    errorMessage = errorBody.message || `Failed to update ${route}: ${response.status} - ${response.statusText}`;
                    console.error(`Error updating ${route}:`, response.status, errorMessage);
                }
                catch (parseError) {
                    // If parsing fails, fall back to status text
                    console.error(`Error updating ${route}:`, response.status, response.statusText);
                    throw new Error(`Failed to update ${route}: ${response.status} - ${response.statusText}`);
                }
                throw new Error(errorMessage);
            }
            return response.json();
        });
    }
    /**
     * Makes an authenticated DELETE request with
     */
    delete(route_1) {
        return __awaiter(this, arguments, void 0, function* (route, options = {}) {
            const response = yield fetch(this.config.baseUrl + route, Object.assign(Object.assign({ method: 'DELETE' }, options), { headers: Object.assign({ Authorization: `Bearer ${this.config.token}` }, options.headers) }));
            if (!response.ok) {
                // Read the error response body to get the detailed error message
                let errorMessage = '';
                try {
                    const errorBody = yield response.json();
                    errorMessage = errorBody.message || `Failed to delete ${route}: ${response.status} - ${response.statusText}`;
                    console.error(`Error deleting ${route}:`, response.status, errorMessage);
                }
                catch (parseError) {
                    // If parsing fails, fall back to status text
                    console.error(`Error deleting ${route}:`, response.status, response.statusText);
                    throw new Error(`Failed to delete ${route}: ${response.status} - ${response.statusText}`);
                }
                throw new Error(errorMessage);
            }
            return response.json();
        });
    }
    /**
     * Generic paged list request
     */
    getPagedList(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedListDetails(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedTaskItemList(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedTaskItemListDetails(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedTaskCommentList(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedAllowanceHistoriesList(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    getPagedAllowanceHistoryTaskItemsList(endpoint, request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(endpoint, request, {});
        });
    }
    get clientConfig() {
        return this.config;
    }
    get subscriptions() {
        if (!this._subscriptions) {
            this._subscriptions = new Subscriptions(this);
        }
        return this._subscriptions;
    }
    get users() {
        if (!this._users) {
            this._users = new Users(this);
        }
        return this._users;
    }
    get allowanceHistories() {
        if (!this._allowanceHistories) {
            this._allowanceHistories = new AllowanceHistories(this);
        }
        return this._allowanceHistories;
    }
    get avatar() {
        if (!this._avatar) {
            this._avatar = new Avatar(this);
        }
        return this._avatar;
    }
    get notifications() {
        if (!this._notifications) {
            this._notifications = new Notifications(this);
        }
        return this._notifications;
    }
    get teams() {
        if (!this._teams) {
            this._teams = new Teams(this);
        }
        return this._teams;
    }
    get tasks() {
        if (!this._tasks) {
            this._tasks = new Tasks(this);
        }
        return this._tasks;
    }
    get comments() {
        if (!this._comments) {
            this._comments = new TaskComments(this);
        }
        return this._comments;
    }
    get auth() {
        if (!this._auth) {
            this._auth = new Auth(this);
        }
        return this._auth;
    }
}
exports.ApiClient = ApiClient;
/**
 * Auth API operations class
 */
class Auth {
    constructor(client) {
        this.client = client;
    }
    login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post('/api/auth/login', { username, password });
            return response.token;
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.post('/api/auth/logout');
        });
    }
    register(registerRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post('/api/auth/register', registerRequest, {});
            return response;
        });
    }
    forgotPassword(forgotPasswordRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post('/api/auth/forgot-password', forgotPasswordRequest, {});
            return response;
        });
    }
    resetPassword(resetPasswordRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post('/api/auth/reset-password', resetPasswordRequest, {});
            return response;
        });
    }
    sendPasswordResetEmail(sendPasswordResetEmailRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post('/api/auth/send-password-reset-email', sendPasswordResetEmailRequest, {});
            return response;
        });
    }
}
/**
 * Teams API operations class
 */
class Teams {
    constructor(client) {
        this.client = client;
    }
    getTeamDetails() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get('/api/team/', {});
        });
    }
    updateTeamDetails(teamUpdateRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put(`/api/team/`, teamUpdateRequest, {});
        });
    }
    getTeamMembers(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedListDetails('/api/team/members', request);
        });
    }
    getTeamAllowanceIntervals() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get('/api/team/allowance-intervals', {});
        });
    }
    getTeamAllowanceInterval(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/team/allowance-intervals/${id}`, {});
        });
    }
    createTeamAllowanceInterval(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/team/allowance-intervals', request, {});
        });
    }
    updateTeamAllowanceInterval(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put(`/api/team/allowance-intervals/`, request, {});
        });
    }
    deleteTeamAllowanceInterval(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.delete(`/api/team/allowance-intervals/${id}`, {});
        });
    }
}
/**
 * User API operations class
 */
class Users {
    constructor(client) {
        this.client = client;
    }
    getDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/user/${id}`, {});
        });
    }
    create(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/user/', request, {});
        });
    }
    update(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put(`/api/user/`, request, {});
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.delete(`/api/user/${id}`, {});
        });
    }
    isLastTeamAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/user/is-last-team-admin`, {});
        });
    }
}
/**
 * Notifications API operations class
 */
class Notifications {
    constructor(client) {
        this.client = client;
    }
    registerDevice(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/userdeviceregistration/register-device', request, {});
        });
    }
    unregisterDevice(fcmToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/userdeviceregistration/unregister-device', { fcmToken }, {});
        });
    }
    updateUserNotificationPreferences(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put('/api/user/update-notification-preferences/bulk', request, {});
        });
    }
    createUserNotificationPreferences(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/user/create-notification-preferences/bulk', request, {});
        });
    }
    getUserNotificationPreferences() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/user/notification-preferences/`, {});
        });
    }
}
/**
 * Avatar API operations class
 */
class Avatar {
    constructor(client) {
        this.client = client;
    }
    uploadAvatar(formData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.postMultimedia(`/api/avatar/upload`, formData);
            return {
                success: response.success,
                fileName: response.data
            };
        });
    }
    deleteAvatar() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.delete(`/api/avatar/`);
        });
    }
    getAvatarUrl(fileName) {
        return `${this.client.clientConfig.baseUrl}/api/avatar/${fileName}`;
    }
    getAvatar(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(this.getAvatarUrl(fileName), {
                headers: {
                    Authorization: `Bearer ${this.client.clientConfig.token}`,
                },
            });
            if (!response.ok) {
                return null;
            }
            const blob = yield response.blob();
            return new File([blob], fileName, { type: blob.type });
        });
    }
}
/**
 * Task Comments API operations class
 */
class TaskComments {
    constructor(client) {
        this.client = client;
    }
    create(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/taskcomment/add', request, {});
        });
    }
    update(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put(`/api/taskcomment/update`, request, {});
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.delete(`/api/taskcomment/delete/${id}`, {});
        });
    }
    getList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedTaskCommentList('/api/taskcomment/paged-list', request);
        });
    }
}
/**
 * Allowance Histories API operations class
 */
class AllowanceHistories {
    constructor(client) {
        this.client = client;
    }
    getPagedList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedAllowanceHistoriesList('/api/allowancehistory/paged-list', request);
        });
    }
    getPagedTaskItemsList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedAllowanceHistoryTaskItemsList('/api/allowancehistory/paged-task-items-list', request);
        });
    }
    approveAllowance(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/allowancehistory/approve', request, {});
        });
    }
    claimAllowance(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/allowancehistory/claim', request, {});
        });
    }
}
/**
 * Tasks API operations class
 */
class Tasks {
    constructor(client) {
        this.client = client;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/taskitem', data, {});
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.put(`/api/taskitem/${id}`, data, {});
        });
    }
    copy(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/copy/${id}`, {}, {});
        });
    }
    copyList(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/copy-list`, body, {});
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.delete(`/api/taskitem/${id}`);
        });
    }
    deleteList(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/delete-list`, body, {});
        });
    }
    pin(id, pinning) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/pin/${id}/${pinning}`);
        });
    }
    pinList(pinning, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/pin-list/${pinning}`, body);
        });
    }
    setActive(id, active) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/set-active/${id}/${active}`);
        });
    }
    setActiveList(activating, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/set-active-list/${activating}`, body);
        });
    }
    setComplete(id, completing) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/set-complete/${id}/${completing}`);
        });
    }
    setCompleteList(completing, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/set-complete-list/${completing}`, body);
        });
    }
    archive(id, archiving) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/archive/${id}/${archiving}`);
        });
    }
    archiveList(archiving, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/archive-list/${archiving}`, body, {});
        });
    }
    approveBonus(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/taskitem/approve-bonus', request, {});
        });
    }
    approveTaskItemAllowance(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/taskitem/approve-allowance', request, {});
        });
    }
    claimBonus(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/claim-bonus/${id}`, {}, {});
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/taskitem/${id}`);
        });
    }
    getDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/taskitem/details/${id}`);
        });
    }
    getTaskDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get(`/api/taskitem/get-task-details/${id}`, {});
        });
    }
    updateTaskDetails(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post(`/api/taskitem/update-task-details`, request, {});
        });
    }
    getPagedList(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedTaskItemList('/api/taskitem/paged-list', request);
        });
    }
    getPagedListDetails(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.getPagedTaskItemListDetails('/api/taskitem/paged-list-details', request);
        });
    }
}
/**
 * Subscriptions API operations class
 */
class Subscriptions {
    constructor(client) {
        this.client = client;
    }
    getLimits() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get('/api/subscription/limits', {});
        });
    }
    validateAction(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/subscription/validate-action', request, {});
        });
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get('/api/subscription/status', {});
        });
    }
    verifyPurchase(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/subscription/verify', request, {});
        });
    }
    cancelSubscription(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.post('/api/subscription/cancel', request, {});
        });
    }
    getPurchaseReceipt() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.get('/api/subscription/receipt', {});
        });
    }
}
/**
 * Functional approach - creates an API client instance
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @returns ApiClient instance
 */
function createApiClient(baseUrl, token) {
    return new ApiClient({ baseUrl, token });
}
/**
 * Hook-friendly function for making authenticated API calls
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @param route - API route to call
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
function apiCall(baseUrl_1, token_1, route_1) {
    return __awaiter(this, arguments, void 0, function* (baseUrl, token, route, options = {}) {
        const client = createApiClient(baseUrl, token);
        return client.get(route, options);
    });
}
