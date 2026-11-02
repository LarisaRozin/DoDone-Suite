/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

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

export class ApiClient {
  constructor(private config: ApiClientConfig) {}

  /**
   * Makes an authenticated GET request 
   * @param route - API route (will be concatenated with baseUrl)
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  async get<T>(route: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.config.baseUrl + route, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Read the error response body to get the detailed error message
      try {
        const errorBody: ResponseBase = await response.json();
        const errorMessage = errorBody.message || `Failed to fetch ${route}: ${response.status} - ${response.statusText}`;
        console.error(`Error fetching ${route}:`, response.status, errorMessage);
        throw new Error(errorMessage);
      } catch (parseError) {
        // If parsing fails, fall back to status text
        console.error(`Error fetching ${route}:`, response.status, response.statusText);
        throw new Error(`Failed to fetch ${route}: ${response.status} - ${response.statusText}`);
      }
    }
    return response.json() as Promise<T>; 
  }

  /**
   * Makes an authenticated POST request 
   */
  async post<T>(route: string, body?: any, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.config.baseUrl + route, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Read the error response body to get the detailed error message
      let errorMessage = '';
      try {
        const errorBody: ResponseBase = await response.json();
        errorMessage = errorBody.message || `Failed to post ${route}: ${response.status} - ${response.statusText}`;
        console.error(`Error posting ${route}:`, response.status, errorMessage);
      } catch (parseError) {
        // If parsing fails, fall back to status text
        console.error(`Error posting ${route}:`, response.status, response.statusText);
        throw new Error(`Failed to post ${route}: ${response.status} - ${response.statusText}`);
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>; 
  }

  async postMultimedia<T>(route: string, body?: any, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.config.baseUrl + route, {
      method: 'POST',
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        ...options.headers,
      },
      body: body,
    });

    if (!response.ok) {
      // Read the error response body to get the detailed error message
      let errorMessage = '';
      try {
        const errorBody: ResponseBase = await response.json();
        errorMessage = errorBody.message || `Failed to post multimedia ${route}: ${response.status} - ${response.statusText}`;
        console.error(`Error posting multimedia ${route}:`, response.status, errorMessage);
      } catch (parseError) {
        // If parsing fails, fall back to status text
        console.error(`Error posting multimedia ${route}:`, response.status, response.statusText);
        throw new Error(`Failed to post multimedia ${route}: ${response.status} - ${response.statusText}`);
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>; 
  }

  /**
   * Makes an authenticated PUT request 
   */
  async put<T>(route: string, body?: any, options: RequestInit = {}): Promise<T> {
    const response = await fetch(this.config.baseUrl + route, {
      method: 'PUT',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Read the error response body to get the detailed error message
      let errorMessage = '';
      try {
        const errorBody: ResponseBase = await response.json();
        errorMessage = errorBody.message || `Failed to update ${route}: ${response.status} - ${response.statusText}`;
        console.error(`Error updating ${route}:`, response.status, errorMessage);
      } catch (parseError) {
        // If parsing fails, fall back to status text
        console.error(`Error updating ${route}:`, response.status, response.statusText);
        throw new Error(`Failed to update ${route}: ${response.status} - ${response.statusText}`);
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>; 
  }

  /**
   * Makes an authenticated DELETE request with 
   */
  async delete(route: string, options: RequestInit = {}): Promise<ResponseBase> {
    const response = await fetch(this.config.baseUrl + route, {
      method: 'DELETE',
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Read the error response body to get the detailed error message
      let errorMessage = '';
      try {
        const errorBody: ResponseBase = await response.json();
        errorMessage = errorBody.message || `Failed to delete ${route}: ${response.status} - ${response.statusText}`;
        console.error(`Error deleting ${route}:`, response.status, errorMessage);
      } catch (parseError) {
        // If parsing fails, fall back to status text
        console.error(`Error deleting ${route}:`, response.status, response.statusText);
        throw new Error(`Failed to delete ${route}: ${response.status} - ${response.statusText}`);
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<ResponseBase>;
  }

  /**
   * Generic paged list request
   */
  async getPagedList<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>> {
    return this.post<PagedListResponse<T>>(endpoint, request, {});
  }

  async getPagedListDetails<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>> {
    return this.post<PagedListResponse<T>>(endpoint, request, {});
  }

  async getPagedTaskItemList<T>(endpoint: string, request: any): Promise<PagedTaskItemListResponse<T>> {
    return this.post<PagedTaskItemListResponse<T>>(endpoint, request, {});
  }

  async getPagedTaskItemListDetails<T>(endpoint: string, request: any): Promise<PagedTaskItemListResponse<T>> {
    return this.post<PagedTaskItemListResponse<T>>(endpoint, request, {});
  }

  async getPagedTaskCommentList<T>(endpoint: string, request: any): Promise<PagedTaskCommentListResponse<T>> {
    return this.post<PagedTaskCommentListResponse<T>>(endpoint, request, {});
  }

  async getPagedAllowanceHistoriesList<T>(endpoint: string, request: PagedAllowanceHistoriesListRequest): Promise<PagedListResponse<T>> {
    return this.post<PagedListResponse<T>>(endpoint, request, {});
  }

  async getPagedAllowanceHistoryTaskItemsList<T>(endpoint: string, request: PagedAllowanceHistoryTaskItemsListRequest): Promise<PagedListResponse<T>> {
    return this.post<PagedListResponse<T>>(endpoint, request, {});
  }

  private _tasks?: Tasks;
  private _comments?: TaskComments;
  private _auth?: Auth;
  private _notifications?: Notifications;
  private _teams?: Teams;
  private _avatar?: Avatar;
  private _allowanceHistories?: AllowanceHistories;
  private _subscriptions?: Subscriptions;
  private _users?: Users;

  get clientConfig(): ApiClientConfig {
    return this.config;
  }

  get subscriptions(): Subscriptions {
    if (!this._subscriptions) {
      this._subscriptions = new Subscriptions(this);
    }
    return this._subscriptions;
  }

  get users(): Users {
    if (!this._users) {
      this._users = new Users(this);
    }
    return this._users;
  }

  get allowanceHistories(): AllowanceHistories {
    if (!this._allowanceHistories) {
      this._allowanceHistories = new AllowanceHistories(this);
    }
    return this._allowanceHistories;
  }

  get avatar(): Avatar {
    if (!this._avatar) {
      this._avatar = new Avatar(this);
    }
    return this._avatar;
  }

  get notifications(): Notifications {
    if (!this._notifications) {
      this._notifications = new Notifications(this);
    }
    return this._notifications;
  }

  get teams(): Teams {
    if (!this._teams) {
      this._teams = new Teams(this);
    }
    return this._teams;
  }

  get tasks(): Tasks {
    if (!this._tasks) {
      this._tasks = new Tasks(this);
    }
    return this._tasks;
  }

  get comments(): TaskComments {
    if (!this._comments) {
      this._comments = new TaskComments(this);
    }
    return this._comments;
  }

  get auth(): Auth {
    if (!this._auth) {
      this._auth = new Auth(this);
    }
    return this._auth;
  }
}


/**
 * Auth API operations class
 */
class Auth {
  constructor(private client: ApiClient) {} 
  async login(username: string, password: string): Promise<string> {
    const response = await this.client.post<{ token: string }>('/api/auth/login', { username, password });
    return response.token;
  }
  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }
  async register(registerRequest: RegisterRequest): Promise<ResponseBase> {
    const response = await this.client.post<ResponseBase>('/api/auth/register', registerRequest, {});
    return response;
  }

  async forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await this.client.post<ForgotPasswordResponse>('/api/auth/forgot-password', forgotPasswordRequest, {});
    return response;
  }

  async resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await this.client.post<ResetPasswordResponse>('/api/auth/reset-password', resetPasswordRequest, {});
    return response;
  }

  async sendPasswordResetEmail(sendPasswordResetEmailRequest: SendPasswordResetEmailRequest): Promise<SendPasswordResetEmailResponse> {
    const response = await this.client.post<SendPasswordResetEmailResponse>('/api/auth/send-password-reset-email', sendPasswordResetEmailRequest, {});
    return response;
  }
}

/**
 * Teams API operations class
 */
class Teams {
  constructor(private client: ApiClient) {}

  async getTeamDetails(): Promise<any> {
    return this.client.get('/api/team/', {});
  }

  async updateTeamDetails(teamUpdateRequest: TeamDetailsUpdateRequest): Promise<DataResponse<TeamDetailsResponse>> {
    return this.client.put(`/api/team/`, teamUpdateRequest, {});
  }

  async getTeamMembers(request: PagedListRequest): Promise<PagedListResponse<User>> {
    return this.client.getPagedListDetails<User>('/api/team/members', request);
  }

  async getTeamAllowanceIntervals(): Promise<TeamAllowanceIntervalListResponse> {
    return this.client.get('/api/team/allowance-intervals', {});
  }

  async getTeamAllowanceInterval(id: number): Promise<TeamAllowanceIntervalResponse> {
    return this.client.get(`/api/team/allowance-intervals/${id}`, {});
  }

  async createTeamAllowanceInterval(request: TeamAllowanceIntervalCreateRequest): Promise<TeamAllowanceIntervalResponse> {
    return this.client.post('/api/team/allowance-intervals', request, {});
  }
  async updateTeamAllowanceInterval(request: TeamAllowanceIntervalUpdateRequest): Promise<TeamAllowanceIntervalResponse> {
    return this.client.put(`/api/team/allowance-intervals/`, request, {});
  }
  async deleteTeamAllowanceInterval(id: number): Promise<ResponseBase> { 
    return this.client.delete(`/api/team/allowance-intervals/${id}`, {});
  }
}

/**
 * User API operations class
 */
class Users {
  constructor(private client: ApiClient) {}

  async getDetails(id: number): Promise<DataResponse<User>> {
    return this.client.get<DataResponse<User>>(`/api/user/${id}`, {});
  }

  async create(request: UserCreateRequest): Promise<DataResponse<User>> {
    return this.client.post<DataResponse<User>>('/api/user/', request, {});
  }

  async update(request: UserUpdateRequest): Promise<DataResponse<User>> {
    return this.client.put<DataResponse<User>>(`/api/user/`, request, {});
  }

  async delete(id: number): Promise<ResponseBase> {
    return this.client.delete(`/api/user/${id}`, {});
  }

  async isLastTeamAdmin(): Promise<boolean> {
    return this.client.get<boolean>(`/api/user/is-last-team-admin`, {});
  }
}

/**
 * Notifications API operations class
 */
class Notifications {
  constructor(private client: ApiClient) {}

  async registerDevice(request: DeviceRegistrationRequest): Promise<ResponseBase> {
    return this.client.post<ResponseBase>('/api/userdeviceregistration/register-device', request, {});
  }

  async unregisterDevice(fcmToken: string): Promise<ResponseBase> {
    return this.client.post<ResponseBase>('/api/userdeviceregistration/unregister-device', { fcmToken }, {});
  }

  async updateUserNotificationPreferences(request: BulkNotificationPreferenceUpdateRequest): Promise<ResponseBase> {
    return this.client.put('/api/user/update-notification-preferences/bulk', request, {});
  }

  async createUserNotificationPreferences(request: BulkNotificationPreferenceCreateRequest): Promise<DataResponse<UserNotificationPreferenceResponse[]>> {
    return this.client.post<DataResponse<UserNotificationPreferenceResponse[]>>('/api/user/create-notification-preferences/bulk', request, {});
  }

  async getUserNotificationPreferences(): Promise<DataResponse<UserNotificationPreferenceResponse[]>> {
    return this.client.get<DataResponse<UserNotificationPreferenceResponse[]>>(`/api/user/notification-preferences/`, {});
  }
}

/**
 * Avatar API operations class
 */
class Avatar {
  constructor(private client: ApiClient) {}

  async uploadAvatar(formData: FormData): Promise<{ success: boolean; fileName?: string }> {
    const response = await this.client.postMultimedia<DataResponse<string>>(`/api/avatar/upload`, formData);
    return {
      success: response.success,
      fileName: response.data
    };
  }

  async deleteAvatar(): Promise<ResponseBase> {
    return this.client.delete(`/api/avatar/`);
  }

  getAvatarUrl(fileName: string): string {
    return `${this.client.clientConfig.baseUrl}/api/avatar/${fileName}`;
  }

  async getAvatar(fileName: string): Promise<File | null> {
    const response = await fetch(this.getAvatarUrl(fileName), {
      headers: {
        Authorization: `Bearer ${this.client.clientConfig.token}`,
      },
    });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }
}

/**
 * Task Comments API operations class
 */
class TaskComments {
  constructor(private client: ApiClient) {}

  async create(request: TaskCommentCreateRequest): Promise<any> {
    return this.client.post('/api/taskcomment/add', request, {});
  }

  async update(request: TaskCommentUpdateRequest): Promise<any> {
    return this.client.put(`/api/taskcomment/update`, request, {});
  }

  async delete(id: number): Promise<ResponseBase> {
    return this.client.delete(`/api/taskcomment/delete/${id}`, {});
  }

  async getList(request: PagedTaskCommentListRequest): Promise<PagedTaskCommentListResponse<any>> {
    return this.client.getPagedTaskCommentList('/api/taskcomment/paged-list', request );
  }
}

/**
 * Allowance Histories API operations class
 */
class AllowanceHistories {
  constructor(private client: ApiClient) {}

  async getPagedList(request: PagedAllowanceHistoriesListRequest): Promise<PagedListResponse<AllowanceHistoryResponse>> {
    return this.client.getPagedAllowanceHistoriesList('/api/allowancehistory/paged-list', request);
  }

  async getPagedTaskItemsList(request: PagedAllowanceHistoryTaskItemsListRequest): Promise<PagedListResponse<AllowanceHistoryTaskItemResponse>> {
    return this.client.getPagedAllowanceHistoryTaskItemsList('/api/allowancehistory/paged-task-items-list', request);
  }

  async approveAllowance(request: AllowanceHistoryApprovalRequest): Promise<AllowanceHistoryResponse> {
    return this.client.post<AllowanceHistoryResponse>('/api/allowancehistory/approve', request, {});
  }

  async claimAllowance(request: AllowanceHistoryClaimRequest): Promise<AllowanceHistoryResponse> {
    return this.client.post<AllowanceHistoryResponse>('/api/allowancehistory/claim', request, {});
  }
}

/**
 * Tasks API operations class
 */
class Tasks {
  constructor(private client: ApiClient) {}

  async create(data: any): Promise<any> {
    return this.client.post('/api/taskitem', data, {});
  }

  async update(id: number, data: any): Promise<any> {
    return this.client.put(`/api/taskitem/${id}`, data, {});
  }

  async copy(id: number): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/copy/${id}`, {}, {});
  }

  async copyList(body: any): Promise<ResponseBase> {
    return this.client.post<ResponseBase>(`/api/taskitem/copy-list`, body, {});
  }

  async delete(id: number): Promise<ResponseBase> {
    return this.client.delete(`/api/taskitem/${id}`);
  }

  async deleteList(body: any): Promise<ResponseBase> {
    return this.client.post<ResponseBase>(`/api/taskitem/delete-list`, body, {});
  }

  async pin(id: number, pinning: boolean): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/pin/${id}/${pinning}`);
  }

  async pinList(pinning: boolean, body: any): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/pin-list/${pinning}`, body);
  }

  async setActive(id: number, active: boolean): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/set-active/${id}/${active}`);
  }

  async setActiveList(activating: boolean, body: any): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/set-active-list/${activating}`, body);
  }

  async setComplete(id: number, completing: boolean): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/set-complete/${id}/${completing}`);
  }

  async setCompleteList(completing: boolean, body: any): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/set-complete-list/${completing}`, body);
  }

  async archive(id: number, archiving: boolean): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/archive/${id}/${archiving}`);
  }

  async archiveList(archiving: boolean, body: any): Promise<ResponseBase> {
    return this.client.post<ResponseBase>(`/api/taskitem/archive-list/${archiving}`, body, {});
  }

  async approveBonus(request: BonusApprovalRequest): Promise<ResponseBase> {
    return this.client.post<ResponseBase>('/api/taskitem/approve-bonus', request, {});
  }

  async approveTaskItemAllowance(request: TaskItemAllowanceApprovalRequest): Promise<ResponseBase> {
    return this.client.post<ResponseBase>('/api/taskitem/approve-allowance', request, {});
  }

  async claimBonus(id: number): Promise<ResponseBase> {
    return this.client.post<ResponseBase>(`/api/taskitem/claim-bonus/${id}`, {}, {});
  }

  async get(id: number): Promise<any> {
    return this.client.get(`/api/taskitem/${id}`);
  }

  async getDetails(id: number): Promise<any> {
    return this.client.get(`/api/taskitem/details/${id}`);
  }

  async getTaskDetails(id: number): Promise<any> {
    return this.client.get(`/api/taskitem/get-task-details/${id}`, {});
  }

  async updateTaskDetails(request: TaskItemTaskDetailsUpdateRequest): Promise<ResponseBase> {
    return this.client.post(`/api/taskitem/update-task-details`, request, {});
  }

  async getPagedList(request: PagedTaskItemListRequest): Promise<PagedTaskItemListResponse<any>> {
    return this.client.getPagedTaskItemList<any>('/api/taskitem/paged-list', request);
  }

  async getPagedListDetails(request: PagedTaskItemListRequest): Promise<PagedTaskItemDetailsListResponse<any>> {
    return this.client.getPagedTaskItemListDetails<any>('/api/taskitem/paged-list-details', request);
  }
}


/**
 * Subscriptions API operations class
 */
class Subscriptions {
  constructor(private client: ApiClient) {} 

  async getLimits(): Promise<SubscriptionLimitsResponse> {
    return this.client.get('/api/subscription/limits', {});
  }

  async validateAction(request: ValidateSubscriptionActionRequest): Promise<ValidateSubscriptionActionResponse> {
    return this.client.post<ValidateSubscriptionActionResponse>('/api/subscription/validate-action', request, {});
  }

  async getStatus(): Promise<SubscriptionStatusResponse> {
    return this.client.get('/api/subscription/status', {});
  }

  async verifyPurchase(request: VerifyPurchaseRequest): Promise<VerifyPurchaseResponse> {
    return this.client.post<VerifyPurchaseResponse>('/api/subscription/verify', request, {});
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    return this.client.post<CancelSubscriptionResponse>('/api/subscription/cancel', request, {});
  }

  async getPurchaseReceipt(): Promise<PurchaseReceiptResponse> {
    return this.client.get<PurchaseReceiptResponse>('/api/subscription/receipt', {});
  }
}



/**
 * Functional approach - creates an API client instance
 * @param baseUrl - Base URL for the API
 * @param token - Authentication token
 * @returns ApiClient instance
 */
export function createApiClient(baseUrl: string, token: string): ApiClient {
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
export async function apiCall<T>(
  baseUrl: string,
  token: string,
  route: string,
  options: RequestInit = {}
): Promise<T> {
  const client = createApiClient(baseUrl, token);
  return client.get<T>(route, options);
}