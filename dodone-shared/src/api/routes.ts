/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

import { PagedListRequest, PagedTaskItemListRequest } from "../utils/paging";

export const API_ROUTES = {
    auth: {
        login: "/api/auth/login",
        register: "/api/auth/register",
        logout: "/api/auth/logout",
        forgotPassword: "/api/auth/forgot-password",
        resetPassword: "/api/auth/reset-password",
        sendPasswordResetEmail: "/api/auth/send-password-reset-email",
    },
    user: {
        get: (id: number) => `/api/user/${id}`,
        // getMe: "/api/user/me",
        // getTeam: '/api/user/team/',
        create: "/api/user",
        update: "/api/user",
        delete: (id: number) => `/api/user/${id}`,
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
        delete: (id: number) => `/api/taskgroup/${id}`,
        get: (id: number) => `/api/taskgroup/${id}`,
        getDetails: (id: number) => `/api/taskgroup/details/${id}`,
        // getList: (userId: number) => `/api/taskgroup/list/${userId}`,
        // getListDetails: (userId: number) => `/api/taskgroup/list-details/${userId}`,
        getPagedList: () => `/api/taskgroup/paged-list/`,
        getPagedListDetails: () => `/api/taskgroup/paged-list-details/`,
    },
    taskKinds: {
        create: "/api/taskkind",
        update: "/api/taskkind",
        delete: (id: number) => `/api/taskkind/${id}`,
        get: (id: number) => `/api/taskkind/${id}`,
        getDetails: (id: number) => `/api/taskkind/details/${id}`,
        // getList: (groupId: number) => `/api/taskkind/list/${groupId}`,
        // getListDetails: (groupId: number) => `/api/taskkind/list-details/${groupId}`,
        getPagedList: () => `/api/taskkind/paged-list/`,
        getPagedListDetails: () => `/api/taskkind/paged-list-details/`,

    },
    taskCategories: {
        create: "/api/taskcategory",
        update: "/api/taskcategory",
        delete: (id: number) => `/api/taskcategory/${id}`,
        get: (id: number) => `/api/taskcategory/${id}`,
        getDetails: (id: number) => `/api/taskcategory/details/${id}`,
        // getList: (kindId: number) => `/api/taskcategory/list/${kindId}`,
        // getListDetails: (kindId: number) => `/api/taskcategory/list-details/${kindId}`,
        getPagedList: () => `/api/taskcategory/paged-list/`,
        getPagedListDetails: () => `/api/taskcategory/paged-list-details/`,
    },
    taskItems: {
        create: "/api/taskitem",
        update: "/api/taskitem",
        copy: (id: number) => `/api/taskitem/copy/${id}`,
        archive: (id: number, archiving: boolean) => `/api/taskitem/${id}/${archiving}`,
        archiveList: (archiving: boolean) => `/api/taskitem/archive-list/${archiving}`,
        pin: (id: number, pinning: boolean) => `/api/taskitem/pin/${id}/${pinning}`,
        pinList: (pinning: boolean) => `/api/taskitem/pin-list/${pinning}`,
        setActive: (id: number, activating: boolean) => `/api/taskitem/set-active/${id}/${activating}`,
        setActiveList: (activating: boolean) => `/api/taskitem/set-active-list/${activating}`,
        setComplete: (id: number, completing: boolean) => `/api/taskitem/set-complete/${id}/${completing}`,
        setCompleteList: (completing: boolean) => `/api/taskitem/set-complete-list/${completing}`,
        delete: (id: number) => `/api/taskitem/${id}`,
        get: (id: number) => `/api/taskitem/${id}`,
        getDetails: (id: number) => `/api/taskitem/details/${id}`,
        // getList: (userId: number) => `/api/taskitem/list/${userId}`,
        // getListDetails: (userId: number) => `/api/taskitem/list-details/${userId}`,
        // getPagedList: (request: PagedTaskItemListRequest) => `/api/taskitem/list/${request.parentId}`,
        // getPagedListDetails: (request: PagedTaskItemListRequest) => `/api/taskitem/list-details/${request.parentId}`,
    },
};

