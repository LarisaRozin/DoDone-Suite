"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    auth: {
        login: "/api/auth/login",
        register: "/api/auth/register",
        logout: "/api/auth/logout",
        forgotPassword: "/api/auth/forgot-password",
        resetPassword: "/api/auth/reset-password",
        sendPasswordResetEmail: "/api/auth/send-password-reset-email",
    },
    user: {
        get: (id) => `/api/user/${id}`,
        // getMe: "/api/user/me",
        // getTeam: '/api/user/team/',
        create: "/api/user",
        update: "/api/user",
        delete: (id) => `/api/user/${id}`,
        // getPagedList: () => `/api/user/team-paged-list/`,
    },
    notifications: {
        register: "/api/userdeviceregistration/register-device",
        unregister: "/api/userdeviceregistration/unregister-device",
    },
    grades: {
        getList: () => `/api/grade/list/`,
    },
    taskGroups: {
        create: "/api/taskgroup",
        update: "/api/taskgroup",
        delete: (id) => `/api/taskgroup/${id}`,
        get: (id) => `/api/taskgroup/${id}`,
        getDetails: (id) => `/api/taskgroup/details/${id}`,
        // getList: (userId: number) => `/api/taskgroup/list/${userId}`,
        // getListDetails: (userId: number) => `/api/taskgroup/list-details/${userId}`,
        getPagedList: () => `/api/taskgroup/paged-list/`,
        getPagedListDetails: () => `/api/taskgroup/paged-list-details/`,
    },
    taskKinds: {
        create: "/api/taskkind",
        update: "/api/taskkind",
        delete: (id) => `/api/taskkind/${id}`,
        get: (id) => `/api/taskkind/${id}`,
        getDetails: (id) => `/api/taskkind/details/${id}`,
        // getList: (groupId: number) => `/api/taskkind/list/${groupId}`,
        // getListDetails: (groupId: number) => `/api/taskkind/list-details/${groupId}`,
        getPagedList: () => `/api/taskkind/paged-list/`,
        getPagedListDetails: () => `/api/taskkind/paged-list-details/`,
    },
    taskCategories: {
        create: "/api/taskcategory",
        update: "/api/taskcategory",
        delete: (id) => `/api/taskcategory/${id}`,
        get: (id) => `/api/taskcategory/${id}`,
        getDetails: (id) => `/api/taskcategory/details/${id}`,
        // getList: (kindId: number) => `/api/taskcategory/list/${kindId}`,
        // getListDetails: (kindId: number) => `/api/taskcategory/list-details/${kindId}`,
        getPagedList: () => `/api/taskcategory/paged-list/`,
        getPagedListDetails: () => `/api/taskcategory/paged-list-details/`,
    },
    taskItems: {
        create: "/api/taskitem",
        update: "/api/taskitem",
        copy: (id) => `/api/taskitem/copy/${id}`,
        archive: (id, archiving) => `/api/taskitem/${id}/${archiving}`,
        archiveList: (archiving) => `/api/taskitem/archive-list/${archiving}`,
        pin: (id, pinning) => `/api/taskitem/pin/${id}/${pinning}`,
        pinList: (pinning) => `/api/taskitem/pin-list/${pinning}`,
        setActive: (id, activating) => `/api/taskitem/set-active/${id}/${activating}`,
        setActiveList: (activating) => `/api/taskitem/set-active-list/${activating}`,
        setComplete: (id, completing) => `/api/taskitem/set-complete/${id}/${completing}`,
        setCompleteList: (completing) => `/api/taskitem/set-complete-list/${completing}`,
        delete: (id) => `/api/taskitem/${id}`,
        get: (id) => `/api/taskitem/${id}`,
        getDetails: (id) => `/api/taskitem/details/${id}`,
        // getList: (userId: number) => `/api/taskitem/list/${userId}`,
        // getListDetails: (userId: number) => `/api/taskitem/list-details/${userId}`,
        // getPagedList: (request: PagedTaskItemListRequest) => `/api/taskitem/list/${request.parentId}`,
        // getPagedListDetails: (request: PagedTaskItemListRequest) => `/api/taskitem/list-details/${request.parentId}`,
    },
};
