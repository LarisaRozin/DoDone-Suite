import type { TaskKindDetailsResponse } from "../types/TaskItem";
import { PagedListRequest, PagedListResponse } from "../utils/paging";
export declare function useTaskKinds(request: PagedListRequest): {
    pagedTaskKinds: PagedListResponse<TaskKindDetailsResponse> | undefined;
    loading: boolean;
    refreshTaskKinds: (request: PagedListRequest) => void;
};
