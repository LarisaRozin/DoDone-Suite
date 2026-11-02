/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import type { guid } from "../types/aliases.ts";

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  user: {
    getById: (id: guid) => `/api/user/${id}`,
    getTeam: (userId: guid, teamId: guid) => `/api/user/${userId}/team/${teamId}`,
    save: (id: guid) => `/api/user/${id}`,
    delete: (id: guid) => `/api/user/${id}`,
    create: "/api/user",
    // `/api/user/${user.id}/team/${user.teamId}`

    // update: (id: string | number) => `/api/user/${id}`,
    // delete: (id: string | number) => `/api/user/${id}`,
  },
  toDoGroups: {
    updateList: "/api/todogroup/updateList",
    getByTeamId: (teamId: guid) => `/api/todogroup/${teamId}`,
    delete: (id: guid) => `/api/todogroup/${id}`,
  },


  toDos: "/api/todos",
  toDoById: (id: guid) => `/api/todos/${id}`,
};