import { ResponseBase } from "./ApiResponse";
import type { TaskItemDetailsResponse } from "./TaskItem";
export declare const SYSTEM_USER_ID = 1;
export declare const DELETED_USER_ID = 100000;
export interface Team {
    id: number;
    name: string;
    description?: string;
    isBusiness: boolean;
    members: User[];
    taskItems?: TaskItemDetailsResponse[];
}
export interface User {
    id: number;
    teamId: number;
    userName: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    salutation?: string;
    avatarUri?: string;
    isAdmin: boolean;
    isActive: boolean;
    createdBy: number;
    updatedBy: number;
    createdAt: string;
    updatedAt?: string;
}
export interface RegisterRequest {
    userName: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    salutation?: string;
    teamName?: string;
    teamDescription?: string;
    isBusiness?: boolean;
    deviceId: string;
    platform: string;
    timezone: string;
}
export interface LoginRequest {
    userName: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
}
export interface UserUpdateRequest {
    id: number;
    userName?: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    salutation?: string;
    avatarUri?: string;
    isAdmin?: boolean;
    isActive?: boolean;
}
export interface UserCreateRequest {
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    salutation?: string;
    avatarUri?: string;
    isAdmin?: boolean;
    isActive?: boolean;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ForgotPasswordResponse extends ResponseBase {
}
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
export interface ResetPasswordResponse extends ResponseBase {
}
export interface SendPasswordResetEmailRequest {
    userId: number;
}
export interface SendPasswordResetEmailResponse extends ResponseBase {
}
