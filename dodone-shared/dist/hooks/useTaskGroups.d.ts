import type { TaskGroupDetailsResponse } from "../types/TaskItem";
import { PagedListRequest, PagedListResponse } from "../utils/paging";
export declare function useTaskGroups(request: PagedListRequest): {
    pagedTaskGroups: PagedListResponse<TaskGroupDetailsResponse> | undefined;
    taskGroupsLoading: boolean;
    refreshTaskGroups: (request: PagedListRequest) => void;
};
