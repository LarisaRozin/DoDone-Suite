import type { TaskCommentResponse } from "../types/TaskItem";
import { PagedTaskCommentListRequest, PagedTaskCommentListResponse } from "../utils/paging";
export declare function useTaskComments(request: PagedTaskCommentListRequest): {
    pagedTaskComments: PagedTaskCommentListResponse<TaskCommentResponse> | undefined;
    loadingTaskComments: boolean;
    refreshTaskComments: (request: PagedTaskCommentListRequest) => void;
};
