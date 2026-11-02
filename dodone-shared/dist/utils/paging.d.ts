export declare enum FilterOperation {
    Equals = 0,
    NotEquals = 1,
    Contains = 2,
    NotContains = 3,
    StartsWith = 4,
    EndsWith = 5,
    GreaterThan = 6,
    GreaterThanOrEqual = 7,
    LessThan = 8,
    LessThanOrEqual = 9,
    In = 10,
    NotIn = 11,
    IsNull = 12,
    IsNotNull = 13,
    Between = 14
}
export declare enum SortDirection {
    Ascending = 0,
    Descending = 1
}
export interface FilterCriteria {
    field: string;
    operation: FilterOperation;
    value?: unknown;
    values?: unknown[];
    logicalOperator?: 'AND' | 'OR';
}
export interface SortCriteria {
    field: string;
    direction: SortDirection;
    priority: number;
}
export interface PagingRequest {
    page: number;
    pageSize: number;
}
export interface FilteringRequest {
    filters: FilterCriteria[];
    searchTerm?: string;
    searchFields?: string[];
}
export interface SortingRequest {
    sortBy?: string;
    sortDirection: SortDirection;
    sortCriteria?: SortCriteria[];
}
export interface PagedListRequest {
    parentId?: number;
    paging: PagingRequest;
    filtering: FilteringRequest;
    sorting: SortingRequest;
}
export interface PagingInfo {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
    firstItemIndex: number;
    lastItemIndex: number;
}
export interface ListResponse<T> {
    data: T[];
    success: boolean;
    message: string;
}
export interface PagedListResponse<T> extends ListResponse<T> {
    paging: PagingInfo;
}
export interface AllowanceStats {
    teamAllowanceIntervalId: number;
    teamAllowanceIntervalName: string;
    totalCredits: number;
    gpa: number;
    allowance: number;
    needsReviewCount: number;
    calculatedStartAt: string;
    actualStartAt: string;
    calculatedEndAt: string;
    bonusTotalCount: number;
}
export interface BonusStats {
    totalCount: number;
    withBonusCount: number;
    withoutBonusCount: number;
    currentBonusCount: number;
    needsReviewCount: number;
    approvedCount: number;
    rejectedCount: number;
    claimedCount: number;
    notClaimedCount: number;
}
export interface TaskItemStats {
    totalCount: number;
    filteredCount: number;
    completedCount: number;
    activeCount: number;
    archivedCount: number;
    dueCount: number;
    startedCount: number;
    endedCount: number;
    unassignedCount: number;
}
export interface PagedTaskItemListResponse<TaskItemResponse> extends PagedListResponse<TaskItemResponse> {
    stats: TaskItemStats;
    allowanceStats: AllowanceStats[];
    bonusStats: BonusStats;
}
export interface PagedTaskItemDetailsListResponse<TaskItemDetailsResponse> extends PagedListResponse<TaskItemDetailsResponse> {
    stats: TaskItemStats;
    allowanceStats: AllowanceStats[];
    bonusStats: BonusStats;
}
export declare class PagedListRequestBuilder {
    private request;
    constructor(request?: PagedListRequest);
    /**
     * Set the parent ID for hierarchical queries
     */
    setParentId(parentId: number): PagedListRequestBuilder;
    /**
     * Set paging parameters
     */
    setPaging(page: number, pageSize?: number): PagedListRequestBuilder;
    /**
     * Add a filter criteria
     */
    addFilter(field: string, operation: FilterOperation, value?: unknown, values?: unknown[]): PagedListRequestBuilder;
    clearFilter(field: string): PagedListRequestBuilder;
    /**
     * Set search term and fields
     */
    setSearch(searchTerm: string, searchFields?: string[]): PagedListRequestBuilder;
    clearSearch(): PagedListRequestBuilder;
    /**
     * Set simple sorting
     */
    setSorting(sortBy: string, direction?: SortDirection): PagedListRequestBuilder;
    /**
     * Add multi-column sorting criteria
     */
    addSortCriteria(field: string, direction: SortDirection, priority: number): PagedListRequestBuilder;
    /**
     * Clear all filters
     */
    clearFilters(): PagedListRequestBuilder;
    /**
     * Clear sorting
     */
    clearSorting(): PagedListRequestBuilder;
    /**
     * Build the final request
     */
    build(): PagedListRequest;
}
export declare class PagingUtils {
    static getPaginationText(paging: PagingInfo): string;
    static getPageNumbers(paging: PagingInfo, maxVisiblePages?: number): number[];
    static getNextPageRequest(currentRequest: PagedListRequest, paging: PagingInfo): PagedListRequest | null;
    static getPreviousPageRequest(currentRequest: PagedListRequest, paging: PagingInfo): PagedListRequest | null;
}
/**
 * Task Item Specific
 */
export declare enum TaskItemAssignmentStatusFilter {
    Any = 0,
    Mine = 1,
    Private = 2,
    Team = 3,
    Unassigned = 4
}
export declare enum TaskItemCompletionStatusFilter {
    Any = 0,
    Completed = 1,
    InProgress = 2
}
export declare enum TaskItemActiveStatusFilter {
    Any = 0,
    Active = 1,
    Inactive = 2
}
export declare enum TaskItemArchivedStatusFilter {
    Any = 0,
    Archived = 1,
    Unarchived = 2
}
export declare enum TaskItemDueStatusFilter {
    Any = 0,
    Due = 1,
    NotDue = 2
}
export declare enum TaskItemStartedStatusFilter {
    Any = 0,
    Started = 1,
    NotStarted = 2
}
export declare enum TaskItemEndedStatusFilter {
    Any = 0,
    Ended = 1,
    NotEnded = 2
}
export declare enum TaskItemNeedReviewStatusFilter {
    Any = 0,
    NeedsReview = 1
}
export declare enum TaskItemAllowanceAccreditedStatusFilter {
    Any = 0,
    Accredited = 1
}
export declare enum TaskItemPriorityFilter {
    Any = 0,
    None = 1,
    Low = 2,
    Medium = 3,
    High = 4,
    Critical = 5
}
export declare enum TaskItemBonusStatusFilter {
    Any = 0,
    Current = 1,
    NeedsReview = 2,
    Approved = 3,
    Rejected = 4,
    Claimed = 5,
    NotClaimed = 6,
    WithBonus = 7,
    WithoutBonus = 8
}
export interface TaskItemFilteringRequest {
    assignmentFilter?: TaskItemAssignmentStatusFilter;
    completionFilter?: TaskItemCompletionStatusFilter;
    activeFilter?: TaskItemActiveStatusFilter;
    archivedFilter?: TaskItemArchivedStatusFilter;
    dueFilter?: TaskItemDueStatusFilter;
    startedFilter?: TaskItemStartedStatusFilter;
    endedFilter?: TaskItemEndedStatusFilter;
    allowanceNeedReviewFilter?: TaskItemNeedReviewStatusFilter;
    allowanceAccreditedFilter?: TaskItemAllowanceAccreditedStatusFilter;
    bonusStatusFilter?: TaskItemBonusStatusFilter;
    priorityFilter?: TaskItemPriorityFilter;
    assignedTo?: number;
    groupId?: number;
    kindId?: number;
    categoryId?: number;
    gradeId?: number;
    credits?: number;
    searchTerm?: string;
}
export interface PagedTaskItemListRequest {
    teamAllowanceIntervalId: number;
    taskItemFiltering?: TaskItemFilteringRequest;
    paging: PagingRequest;
}
export declare class PagedTaskItemListRequestBuilder {
    private teamAllowanceIntervalId;
    private taskItemFiltering;
    private paging;
    constructor(request?: PagedTaskItemListRequest);
    setTeamAllowanceIntervalId(teamAllowanceIntervalId: number): PagedTaskItemListRequestBuilder;
    setAssignmentFilter(filter: TaskItemAssignmentStatusFilter): PagedTaskItemListRequestBuilder;
    setCompletionFilter(filter: TaskItemCompletionStatusFilter): PagedTaskItemListRequestBuilder;
    setActiveFilter(filter: TaskItemActiveStatusFilter): PagedTaskItemListRequestBuilder;
    setPriorityFilter(filter: TaskItemPriorityFilter): PagedTaskItemListRequestBuilder;
    setArchivedFilter(filter: TaskItemArchivedStatusFilter): PagedTaskItemListRequestBuilder;
    setDueFilter(filter: TaskItemDueStatusFilter): PagedTaskItemListRequestBuilder;
    setStartedFilter(filter: TaskItemStartedStatusFilter): PagedTaskItemListRequestBuilder;
    setEndedFilter(filter: TaskItemEndedStatusFilter): PagedTaskItemListRequestBuilder;
    setAllowanceNeedReviewFilter(filter: TaskItemNeedReviewStatusFilter): PagedTaskItemListRequestBuilder;
    setAllowanceAccreditedFilter(filter: TaskItemAllowanceAccreditedStatusFilter): PagedTaskItemListRequestBuilder;
    setBonusStatusFilter(filter: TaskItemBonusStatusFilter): PagedTaskItemListRequestBuilder;
    setTeamMemberFilter(userId?: number): PagedTaskItemListRequestBuilder;
    setSearchTerm(searchTerm?: string): PagedTaskItemListRequestBuilder;
    clearTaskItemFilters(): PagedTaskItemListRequestBuilder;
    setGroupId(groupId?: number): PagedTaskItemListRequestBuilder;
    setKindId(kindId?: number): PagedTaskItemListRequestBuilder;
    setCategoryId(categoryId?: number): PagedTaskItemListRequestBuilder;
    setGradeId(gradeId?: number): PagedTaskItemListRequestBuilder;
    setCredits(credits?: number): PagedTaskItemListRequestBuilder;
    setPaging(page: number, pageSize?: number): PagedTaskItemListRequestBuilder;
    build(): PagedTaskItemListRequest;
}
export declare class TaskItemPagingUtils {
    static getNextPageRequest(currentRequest: PagedTaskItemListRequest, paging: PagingInfo): PagedTaskItemListRequest | null;
    static getPreviousPageRequest(currentRequest: PagedTaskItemListRequest, paging: PagingInfo): PagedTaskItemListRequest | null;
}
export interface PagedTaskCommentListRequest {
    taskId: number;
    searchTerm?: string;
    paging: PagingRequest;
}
export declare class PagedTaskCommentListRequestBuilder {
    private request;
    constructor(taskId: number);
    setSearchTerm(searchTerm?: string): PagedTaskCommentListRequestBuilder;
    setPaging(page: number, pageSize?: number): PagedTaskCommentListRequestBuilder;
    build(): PagedTaskCommentListRequest;
}
export declare class TaskCommentPagingUtils {
    static getNextPageRequest(currentRequest: PagedTaskCommentListRequest, paging: PagingInfo): PagedTaskCommentListRequest | null;
    static getPreviousPageRequest(currentRequest: PagedTaskCommentListRequest, paging: PagingInfo): PagedTaskCommentListRequest | null;
}
export interface PagedTaskCommentListResponse<TaskCommentResponse> extends PagedListResponse<TaskCommentResponse> {
}
