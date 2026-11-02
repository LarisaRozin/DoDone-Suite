import type { TaskItemDetailsResponse } from "../types/TaskItem";
import { PagedTaskItemListRequest, PagedTaskItemListResponse } from "../utils/paging";
export declare function useTaskItems(request: PagedTaskItemListRequest): {
    pagedTaskItems: PagedTaskItemListResponse<TaskItemDetailsResponse> | undefined;
    loadingTaskItems: boolean;
    refreshTaskItems: (request: PagedTaskItemListRequest) => void;
};
