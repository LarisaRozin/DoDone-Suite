import { PagedListResponse } from "../utils/paging";
import { AllowanceHistoryTaskItemResponse, PagedAllowanceHistoryTaskItemsListRequest } from "../types/AllowanceHistory";
export declare function useAllowanceHistoryTaskItems(request: PagedAllowanceHistoryTaskItemsListRequest): {
    pagedAllowanceHistoryTaskItems: PagedListResponse<AllowanceHistoryTaskItemResponse> | undefined;
    loadingAllowanceHistoryTaskItems: boolean;
    refreshAllowanceHistoryTaskItems: (request: PagedAllowanceHistoryTaskItemsListRequest) => void;
};
