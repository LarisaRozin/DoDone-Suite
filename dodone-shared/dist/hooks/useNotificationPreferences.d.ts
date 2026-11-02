import { UserNotificationPreferenceResponse, BulkNotificationPreferenceUpdateRequest, BulkNotificationPreferenceCreateRequest } from "../types/UserNotificationPreferences";
export declare function useNotificationPreferences(): {
    notificationPreferences: UserNotificationPreferenceResponse[] | null;
    createUserNotificationPreferences: (request: BulkNotificationPreferenceCreateRequest) => Promise<import("..").DataResponse<UserNotificationPreferenceResponse[]> | null>;
    updateUserNotificationPreferences: (request: BulkNotificationPreferenceUpdateRequest) => Promise<import("..").ResponseBase | null>;
    getUserNotificationPreferences: () => Promise<UserNotificationPreferenceResponse[] | null>;
    loadingNotificationPreferences: boolean;
    updatingNotificationPreferences: boolean;
};
