import { AllowanceHistoryApprovalRequest, AllowanceHistoryClaimRequest, AllowanceHistoryResponse, AllowanceHistoryTaskItemResponse, PagedAllowanceHistoriesListRequest, PagedAllowanceHistoryTaskItemsListRequest } from "../types/AllowanceHistory";
import { DataResponse, ResponseBase } from "../types/ApiResponse";
import { DeviceRegistrationRequest } from "../types/DeviceRegistration";
import { CancelSubscriptionRequest, CancelSubscriptionResponse, PurchaseReceiptResponse, SubscriptionLimitsResponse, SubscriptionStatusResponse, ValidateSubscriptionActionRequest, ValidateSubscriptionActionResponse, VerifyPurchaseRequest, VerifyPurchaseResponse } from "../types/Subscription";
import { BonusApprovalRequest, TaskItemAllowanceApprovalRequest, TaskCommentCreateRequest, TaskCommentUpdateRequest, TaskItemTaskDetailsUpdateRequest } from "../types/TaskItem";
import { TeamAllowanceIntervalCreateRequest, TeamAllowanceIntervalListResponse, TeamAllowanceIntervalResponse, TeamAllowanceIntervalUpdateRequest, TeamDetailsResponse, TeamDetailsUpdateRequest } from "../types/Team";
import { ForgotPasswordRequest, ForgotPasswordResponse, RegisterRequest, ResetPasswordRequest, ResetPasswordResponse, SendPasswordResetEmailRequest, SendPasswordResetEmailResponse, User, UserCreateRequest, UserUpdateRequest } from "../types/User";
import { BulkNotificationPreferenceCreateRequest, BulkNotificationPreferenceUpdateRequest, UserNotificationPreferenceResponse } from "../types/UserNotificationPreferences";
import { PagedListRequest, PagedListResponse, PagedTaskCommentListRequest, PagedTaskCommentListResponse, PagedTaskItemDetailsListResponse, PagedTaskItemListRequest, PagedTaskItemListResponse } from "./paging";
export interface ApiClientConfig {
    baseUrl: string;
    token: string;
}
export declare class ApiClient {
    private config;
    constructor(config: ApiClientConfig);
    /**
     * Makes an authenticated GET request
     * @param route - API route (will be concatenated with baseUrl)
     * @param options - Additional fetch options
     * @returns Promise with the response data
     */
    get<T>(route: string, options?: RequestInit): Promise<T>;
    /**
     * Makes an authenticated POST request
     */
    post<T>(route: string, body?: any, options?: RequestInit): Promise<T>;
    postMultimedia<T>(route: string, body?: any, options?: RequestInit): Promise<T>;
    /**
     * Makes an authenticated PUT request
     */
    put<T>(route: string, body?: any, options?: RequestInit): Promise<T>;
    /**
     * Makes an authenticated DELETE request with
     */
    delete(route: string, options?: RequestInit): Promise<ResponseBase>;
    /**
     * Generic paged list request
     */
    getPagedList<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>>;
    getPagedListDetails<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>>;
    getPagedTaskItemList<T>(endpoint: string, request: any): Promise<PagedTaskItemListResponse<T>>;
    getPagedTaskItemListDetails<T>(endpoint: string, request: any): Promise<PagedTaskItemListResponse<T>>;
    getPagedTaskCommentList<T>(endpoint: string, request: any): Promise<PagedTaskCommentListResponse<T>>;
    getPagedAllowanceHistoriesList<T>(endpoint: string, request: PagedAllowanceHistoriesListRequest): Promise<PagedListResponse<T>>;
    getPagedAllowanceHistoryTaskItemsList<T>(endpoint: string, request: PagedAllowanceHistoryTaskItemsListRequest): Promise<PagedListResponse<T>>;
    private _tasks?;
    private _comments?;
    private _auth?;
    private _notifications?;
    private _teams?;
    private _avatar?;
    private _allowanceHistories?;
    private _subscriptions?;
    private _users?;
    get clientConfig(): ApiClientConfig;
    get subscriptions(): Subscriptions;
    get users(): Users;
    get allowanceHistories(): AllowanceHistories;
    get avatar(): Avatar;
    get notifications(): Notifications;
    get teams(): Teams;
    get tasks(): Tasks;
    get comments(): TaskComments;
    get auth(): Auth;
}
/**
 * Auth API operations class
 */
declare class Auth {
    private client;
    constructor(client: ApiClient);
    login(username: string, password: string): Promise<string>;
    logout(): Promise<void>;
    register(registerRequest: RegisterRequest): Promise<ResponseBase>;
    forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
    resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<ResetPasswordResponse>;
    sendPasswordResetEmail(sendPasswordResetEmailRequest: SendPasswordResetEmailRequest): Promise<SendPasswordResetEmailResponse>;
}
/**
 * Teams API operations class
 */
declare class Teams {
    private client;
    constructor(client: ApiClient);
    getTeamDetails(): Promise<any>;
    updateTeamDetails(teamUpdateRequest: TeamDetailsUpdateRequest): Promise<DataResponse<TeamDetailsResponse>>;
    getTeamMembers(request: PagedListRequest): Promise<PagedListResponse<User>>;
    getTeamAllowanceIntervals(): Promise<TeamAllowanceIntervalListResponse>;
    getTeamAllowanceInterval(id: number): Promise<TeamAllowanceIntervalResponse>;
    createTeamAllowanceInterval(request: TeamAllowanceIntervalCreateRequest): Promise<TeamAllowanceIntervalResponse>;
    updateTeamAllowanceInterval(request: TeamAllowanceIntervalUpdateRequest): Promise<TeamAllowanceIntervalResponse>;
    deleteTeamAllowanceInterval(id: number): Promise<ResponseBase>;
}
/**
 * User API operations class
 */
declare class Users {
    private client;
    constructor(client: ApiClient);
    getDetails(id: number): Promise<DataResponse<User>>;
    create(request: UserCreateRequest): Promise<DataResponse<User>>;
    update(request: UserUpdateRequest): Promise<DataResponse<User>>;
    delete(id: number): Promise<ResponseBase>;
    isLastTeamAdmin(): Promise<boolean>;
}
/**
 * Notifications API operations class
 */
declare class Notifications {
    private client;
    constructor(client: ApiClient);
    registerDevice(request: DeviceRegistrationRequest): Promise<ResponseBase>;
    unregisterDevice(fcmToken: string): Promise<ResponseBase>;
    updateUserNotificationPreferences(request: BulkNotificationPreferenceUpdateRequest): Promise<ResponseBase>;
    createUserNotificationPreferences(request: BulkNotificationPreferenceCreateRequest): Promise<DataResponse<UserNotificationPreferenceResponse[]>>;
    getUserNotificationPreferences(): Promise<DataResponse<UserNotificationPreferenceResponse[]>>;
}
/**
 * Avatar API operations class
 */
declare class Avatar {
    private client;
    constructor(client: ApiClient);
    uploadAvatar(formData: FormData): Promise<{
        success: boolean;
        fileName?: string;
    }>;
    deleteAvatar(): Promise<ResponseBase>;
    getAvatarUrl(fileName: string): string;
    getAvatar(fileName: string): Promise<File | null>;
}
/**
 * Task Comments API operations class
 */
declare class TaskComments {
    private client;
    constructor(client: ApiClient);
    create(request: TaskCommentCreateRequest): Promise<any>;
    update(request: TaskCommentUpdateRequest): Promise<any>;
    delete(id: number): Promise<ResponseBase>;
    getList(request: PagedTaskCommentListRequest): Promise<PagedTaskCommentListResponse<any>>;
}
/**
 * Allowance Histories API operations class
 */
declare class AllowanceHistories {
    private client;
    constructor(client: ApiClient);
    getPagedList(request: PagedAllowanceHistoriesListRequest): Promise<PagedListResponse<AllowanceHistoryResponse>>;
    getPagedTaskItemsList(request: PagedAllowanceHistoryTaskItemsListRequest): Promise<PagedListResponse<AllowanceHistoryTaskItemResponse>>;
    approveAllowance(request: AllowanceHistoryApprovalRequest): Promise<AllowanceHistoryResponse>;
    claimAllowance(request: AllowanceHistoryClaimRequest): Promise<AllowanceHistoryResponse>;
}
/**
 * Tasks API operations class
 */
declare class Tasks {
    private client;
    constructor(client: ApiClient);
    create(data: any): Promise<any>;
    update(id: number, data: any): Promise<any>;
    copy(id: number): Promise<ResponseBase>;
    copyList(body: any): Promise<ResponseBase>;
    delete(id: number): Promise<ResponseBase>;
    deleteList(body: any): Promise<ResponseBase>;
    pin(id: number, pinning: boolean): Promise<ResponseBase>;
    pinList(pinning: boolean, body: any): Promise<ResponseBase>;
    setActive(id: number, active: boolean): Promise<ResponseBase>;
    setActiveList(activating: boolean, body: any): Promise<ResponseBase>;
    setComplete(id: number, completing: boolean): Promise<ResponseBase>;
    setCompleteList(completing: boolean, body: any): Promise<ResponseBase>;
    archive(id: number, archiving: boolean): Promise<ResponseBase>;
    archiveList(archiving: boolean, body: any): Promise<ResponseBase>;
    approveBonus(request: BonusApprovalRequest): Promise<ResponseBase>;
    approveTaskItemAllowance(request: TaskItemAllowanceApprovalRequest): Promise<ResponseBase>;
    claimBonus(id: number): Promise<ResponseBase>;
    get(id: number): Promise<any>;
    getDetails(id: number): Promise<any>;
    getTaskDetails(id: number): Promise<any>;
    updateTaskDetails(request: TaskItemTaskDetailsUpdateRequest): Promise<ResponseBase>;
    getPagedList(request: PagedTaskItemListRequest): Promise<PagedTaskItemListResponse<any>>;
    getPagedListDetails(request: PagedTaskItemListRequest): Promise<PagedTaskItemDetailsListResponse<any>>;
}
/**
 * Subscriptions API operations class
 */
declare class Subscriptions {
    private client;
    constructor(client: ApiClient);
    getLimits(): Promise<SubscriptionLimitsResponse>;
    validateAction(request: ValidateSubscriptionActionRequest): Promise<ValidateSubscriptionActionResponse>;
    getStatus(): Promise<SubscriptionStatusResponse>;
    verifyPurchase(request: VerifyPurchaseRequest): Promise<VerifyPurchaseResponse>;
    cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse>;
    getPurchaseReceipt(): Promise<PurchaseReceiptResponse>;
}
/**
 * Functional approach - creates an API client instance
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @returns ApiClient instance
 */
export declare function createApiClient(baseUrl: string, token: string): ApiClient;
/**
 * Hook-friendly function for making authenticated API calls
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @param route - API route to call
 * @param options - Additional fetch options
 * @returns Promise with the response data
 */
export declare function apiCall<T>(baseUrl: string, token: string, route: string, options?: RequestInit): Promise<T>;
export {};
