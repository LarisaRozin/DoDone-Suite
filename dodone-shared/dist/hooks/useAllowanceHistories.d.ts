import { PagedListResponse } from "../utils/paging";
import { AllowanceHistoryApprovalRequest, AllowanceHistoryClaimRequest, AllowanceHistoryResponse, PagedAllowanceHistoriesListRequest } from "../types/AllowanceHistory";
export declare function useAllowanceHistories(request: PagedAllowanceHistoriesListRequest): {
    pagedAllowanceHistories: PagedListResponse<AllowanceHistoryResponse> | undefined;
    loadingAllowanceHistories: boolean;
    refreshAllowanceHistories: (request: PagedAllowanceHistoriesListRequest) => void;
    approveAllowance: (request: AllowanceHistoryApprovalRequest) => Promise<AllowanceHistoryResponse>;
    claimAllowance: (request: AllowanceHistoryClaimRequest) => Promise<AllowanceHistoryResponse>;
};
