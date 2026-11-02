import type { TaskCategoryDetailsResponse } from "../types/TaskItem";
import { PagedListRequest, PagedListResponse } from "../utils/paging";
export declare function useTaskCategories(request: PagedListRequest): {
    pagedTaskCategories: PagedListResponse<TaskCategoryDetailsResponse> | undefined;
    loading: boolean;
    refreshTaskCategories: (request: PagedListRequest) => void;
};
