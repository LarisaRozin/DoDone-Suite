export declare enum SubscriptionTier {
    Free = 0,
    Pro = 1
}
export declare enum SubscriptionAction {
    AddTeamMember = 0,
    AddAllowanceInterval = 1,
    AddTaskItem = 2
}
export declare const UNLIMITED = -1;
export interface FeatureLimit {
    max: number;
    currentTotal: number;
    currentActive: number;
    canAdd: boolean;
}
export interface SubscriptionLimitsResponse {
    subscriptionTier: SubscriptionTier;
    teamMembersLimit: FeatureLimit;
    taskItemsLimit: FeatureLimit;
    allowanceIntervalsLimit: FeatureLimit;
    bonuses: boolean;
    gradeConfiguration: boolean;
    multiselect: boolean;
    privateTasks: boolean;
    proposedTasks: boolean;
    taskComments: boolean;
    imageAvatars: boolean;
}
export interface ValidateSubscriptionActionRequest {
    action: SubscriptionAction;
}
export interface ValidateSubscriptionActionResponse {
    isAllowed: boolean;
    reason?: string;
    upgradeRequired: SubscriptionTier;
    currentTier: SubscriptionTier;
}
export interface SubscriptionStatusResponse {
    currentTier: SubscriptionTier;
    expirationDate?: Date;
    isTrialActive: boolean;
    trialEndsAt?: Date;
    isGracePeriodActive: boolean;
    gracePeriodEndsAt?: Date;
    platform?: string;
    isActive: boolean;
}
export interface VerifyPurchaseRequest {
    platform: string;
    productId: string;
    purchaseToken?: string;
    receiptData?: string;
    transactionId?: string;
}
export interface VerifyPurchaseResponse {
    success: boolean;
    message?: string;
    subscriptionTier?: SubscriptionTier;
    expirationDate?: Date;
}
export interface CancelSubscriptionRequest {
    platform: string;
}
export interface CancelSubscriptionResponse {
    success: boolean;
    message?: string;
    expirationDate?: Date;
    cancellationUrl?: string;
}
export interface PurchaseReceiptItem {
    id: number;
    platform: string;
    productId: string;
    subscriptionTier: SubscriptionTier;
    purchaseDate: Date;
    expiryDate?: Date;
    isActive: boolean;
    isCancelled: boolean;
    cancelledAt?: Date;
}
export interface PurchaseReceiptResponse {
    purchases: PurchaseReceiptItem[];
    currentPlatform?: string;
}
