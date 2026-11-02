/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

// Frontend TypeScript utilities for the new paging system

export enum FilterOperation {
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

export enum SortDirection {
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

export interface AllowanceStats
{
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

export interface BonusStats
{
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

export interface TaskItemStats
{
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

export class PagedListRequestBuilder {
  private request: PagedListRequest;

  constructor(request?: PagedListRequest) {
    if (request) {
      this.request = request;
    }
    else {
      this.request = {
        paging: { page: 1, pageSize: 10 },
        filtering: { filters: [] },
        sorting: { sortDirection: SortDirection.Ascending }
      };
    }
  }

  /**
   * Set the parent ID for hierarchical queries
   */
  setParentId(parentId: number): PagedListRequestBuilder {
    this.request.parentId = parentId;
    return this;
  }

  /**
   * Set paging parameters
   */
  setPaging(page: number, pageSize: number = 10): PagedListRequestBuilder {
    this.request.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
    return this;
  }

  /**
   * Add a filter criteria
   */
  addFilter(field: string, operation: FilterOperation, value?: unknown, values?: unknown[]): PagedListRequestBuilder {
    this.request.filtering.filters.push({
      field,
      operation,
      value,
      values,
      logicalOperator: 'AND'
    });
    return this;
  }

  clearFilter(field: string): PagedListRequestBuilder {
    this.request.filtering.filters = this.request.filtering.filters.filter(f => f.field !== field);
    return this;
  }

  /**
   * Set search term and fields
   */
  setSearch(searchTerm: string, searchFields?: string[]): PagedListRequestBuilder {
    this.request.filtering.searchTerm = searchTerm;
    this.request.filtering.searchFields = searchFields;
    return this;
  }

  clearSearch(): PagedListRequestBuilder {
    this.request.filtering.searchTerm = undefined;
    this.request.filtering.searchFields = undefined;
    return this;
  }

  /**
   * Set simple sorting
   */
  setSorting(sortBy: string, direction: SortDirection = SortDirection.Ascending): PagedListRequestBuilder {
    this.request.sorting.sortBy = sortBy;
    this.request.sorting.sortDirection = direction;
    return this;
  }

  /**
   * Add multi-column sorting criteria
   */
  addSortCriteria(field: string, direction: SortDirection, priority: number): PagedListRequestBuilder {
    if (!this.request.sorting.sortCriteria) {
      this.request.sorting.sortCriteria = [];
    }
    this.request.sorting.sortCriteria.push({ field, direction, priority });
    return this;
  }

  /**
   * Clear all filters
   */
  clearFilters(): PagedListRequestBuilder {
    this.request.filtering.filters = [];
    this.request.filtering.searchTerm = undefined;
    this.request.filtering.searchFields = undefined;
    return this;
  }

  /**
   * Clear sorting
   */
  clearSorting(): PagedListRequestBuilder {
    this.request.sorting = { sortDirection: SortDirection.Ascending };
    return this;
  }

  /**
   * Build the final request
   */
  build(): PagedListRequest {
    return { ...this.request };
  }
}

export class PagingUtils {
  static getPaginationText(paging: PagingInfo): string {
    if (paging.totalItems === 0) {
      return 'No items found';
    }
    return `Showing ${paging.firstItemIndex}-${paging.lastItemIndex} of ${paging.totalItems} items`;
  }

  static getPageNumbers(paging: PagingInfo, maxVisiblePages: number = 5): number[] {
    const { currentPage, totalPages } = paging;
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  static getNextPageRequest(currentRequest: PagedListRequest, paging: PagingInfo): PagedListRequest | null {
    if (!paging.hasNext) return null;
    
    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage + 1
      }
    };
  }

  static getPreviousPageRequest(currentRequest: PagedListRequest, paging: PagingInfo): PagedListRequest | null {
    if (!paging.hasPrevious) return null;
    
    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage - 1
      }
    };
  }
}


/**
 * Task Item Specific
 */

export enum TaskItemAssignmentStatusFilter
{
    Any,
    Mine,
    Private,
    Team,
    Unassigned,
}

export enum TaskItemCompletionStatusFilter
{
    Any,
    Completed,
    InProgress,
}

export enum TaskItemActiveStatusFilter
{
    Any,
    Active,
    Inactive,
}

export enum TaskItemArchivedStatusFilter
{
    Any,
    Archived,
    Unarchived,
}

export enum TaskItemDueStatusFilter
{
    Any,
    Due,
    NotDue,
}

export enum TaskItemStartedStatusFilter
{
    Any,
    Started,
    NotStarted,
}

export enum TaskItemEndedStatusFilter
{
    Any,
    Ended,
    NotEnded,
}

export enum TaskItemNeedReviewStatusFilter
{
    Any,
    NeedsReview,
}

export enum TaskItemAllowanceAccreditedStatusFilter
{
    Any,
    Accredited,
}

export enum TaskItemPriorityFilter
{
    Any,
    None,
    Low,
    Medium,
    High,
    Critical
}

export enum TaskItemBonusStatusFilter
{
    Any,
    Current,
    NeedsReview,
    Approved,
    Rejected,
    Claimed,
    NotClaimed,
    WithBonus,
    WithoutBonus
}

// export enum FilterDateType
// {
//     Created,
//     Updated,
//     Due,
//     Started,
//     Ended,
//     Completed,
//     Assigned,
//     Graded,
//     // Accredited,  // TODO
//     Active,
//     Archived,
//     BonusStatus,
//     AllowanceStatus,
// }

export interface TaskItemFilteringRequest 
{
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
    // dateFilter?: FilterDateType;
    // dateFrom?: string;
    // dateTo?: string;
    searchTerm?: string;
}

export interface PagedTaskItemListRequest 
{
    teamAllowanceIntervalId: number;
    taskItemFiltering?: TaskItemFilteringRequest;
    paging: PagingRequest;
}

export class PagedTaskItemListRequestBuilder {
  private teamAllowanceIntervalId: number;
  private taskItemFiltering: TaskItemFilteringRequest;
  private paging: PagingRequest;

  constructor(request?: PagedTaskItemListRequest) {
    this.teamAllowanceIntervalId = request?.teamAllowanceIntervalId || 0;
    this.paging = request?.paging || { page: 1, pageSize: 10 };
    this.taskItemFiltering = request?.taskItemFiltering || 
      { assignmentFilter: TaskItemAssignmentStatusFilter.Any
        , completionFilter: TaskItemCompletionStatusFilter.Any
        , activeFilter: TaskItemActiveStatusFilter.Any
        , priorityFilter: TaskItemPriorityFilter.Any
        , archivedFilter: TaskItemArchivedStatusFilter.Any
        , dueFilter: TaskItemDueStatusFilter.Any
        , startedFilter: TaskItemStartedStatusFilter.Any
        , endedFilter: TaskItemEndedStatusFilter.Any
        , allowanceNeedReviewFilter: TaskItemNeedReviewStatusFilter.Any
        , allowanceAccreditedFilter: TaskItemAllowanceAccreditedStatusFilter.Any
        , bonusStatusFilter: TaskItemBonusStatusFilter.Any
        , groupId: undefined
        , kindId: undefined
        , categoryId: undefined
        , assignedTo: undefined
        , gradeId: undefined
        , credits: undefined
        , searchTerm: undefined
      };
  }

  setTeamAllowanceIntervalId(teamAllowanceIntervalId: number): PagedTaskItemListRequestBuilder {
    this.teamAllowanceIntervalId = teamAllowanceIntervalId;
    return this;
  }

  setAssignmentFilter(filter: TaskItemAssignmentStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.assignmentFilter = filter;
    return this;
  }

  setCompletionFilter(filter: TaskItemCompletionStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.completionFilter = filter;
    return this;
  }

  setActiveFilter(filter: TaskItemActiveStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.activeFilter = filter;
    return this;
  }

  setPriorityFilter(filter: TaskItemPriorityFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.priorityFilter = filter;
    return this;
  }

  setArchivedFilter(filter: TaskItemArchivedStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.archivedFilter = filter;
    return this;
  }

  setDueFilter(filter: TaskItemDueStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.dueFilter = filter;
    return this;
  }

  setStartedFilter(filter: TaskItemStartedStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.startedFilter = filter;
    return this;
  }

  setEndedFilter(filter: TaskItemEndedStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.endedFilter = filter;
    return this;
  }

  setAllowanceNeedReviewFilter(filter: TaskItemNeedReviewStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.allowanceNeedReviewFilter = filter;
    return this;
  }

  setAllowanceAccreditedFilter(filter: TaskItemAllowanceAccreditedStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.allowanceAccreditedFilter = filter;
    return this;
  }
  setBonusStatusFilter(filter: TaskItemBonusStatusFilter): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.bonusStatusFilter = filter;
    return this;
  }

  setTeamMemberFilter(userId?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.assignedTo = userId;
    return this;
  }

  setSearchTerm(searchTerm?: string): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.searchTerm = searchTerm;
    return this;
  }

  clearTaskItemFilters(): PagedTaskItemListRequestBuilder {
    this.teamAllowanceIntervalId = 0;
    this.taskItemFiltering.activeFilter = TaskItemActiveStatusFilter.Any;
    this.taskItemFiltering.priorityFilter = TaskItemPriorityFilter.Any;
    this.taskItemFiltering.archivedFilter = TaskItemArchivedStatusFilter.Any;
    this.taskItemFiltering.completionFilter = TaskItemCompletionStatusFilter.Any;
    this.taskItemFiltering.dueFilter = TaskItemDueStatusFilter.Any;
    this.taskItemFiltering.startedFilter = TaskItemStartedStatusFilter.Any;
    this.taskItemFiltering.endedFilter = TaskItemEndedStatusFilter.Any;
    this.taskItemFiltering.allowanceNeedReviewFilter = TaskItemNeedReviewStatusFilter.Any;
    this.taskItemFiltering.allowanceAccreditedFilter = TaskItemAllowanceAccreditedStatusFilter.Any;
    this.taskItemFiltering.bonusStatusFilter = TaskItemBonusStatusFilter.Any;
    this.taskItemFiltering.assignmentFilter = TaskItemAssignmentStatusFilter.Any;
    this.taskItemFiltering.groupId = undefined;
    this.taskItemFiltering.kindId = undefined;
    this.taskItemFiltering.categoryId = undefined;
    this.taskItemFiltering.gradeId = undefined;
    this.taskItemFiltering.credits = undefined;
    this.taskItemFiltering.assignedTo = undefined;

    this.taskItemFiltering.searchTerm = undefined;
    return this;
  }

  setGroupId(groupId?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.groupId = groupId;
    return this;
  }

  setKindId(kindId?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.kindId = kindId;
    return this;
  }

  setCategoryId(categoryId?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.categoryId = categoryId;
    return this;
  }

  setGradeId(gradeId?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.gradeId = gradeId;
    return this;
  }

  setCredits(credits?: number): PagedTaskItemListRequestBuilder {
    this.taskItemFiltering.credits = credits;
    return this;
  }

  setPaging(page: number, pageSize: number = 10): PagedTaskItemListRequestBuilder {
    this.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
    return this;
  }

  build(): PagedTaskItemListRequest {
    return { 
      teamAllowanceIntervalId: this.teamAllowanceIntervalId,
      taskItemFiltering: this.taskItemFiltering,
      paging: this.paging
    };
  }
}

export class TaskItemPagingUtils {
  static getNextPageRequest(currentRequest: PagedTaskItemListRequest, paging: PagingInfo): PagedTaskItemListRequest | null {
    if (!paging.hasNext) return null;

    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage + 1
      }
    };
  }

  static getPreviousPageRequest(currentRequest: PagedTaskItemListRequest, paging: PagingInfo): PagedTaskItemListRequest | null {
    if (!paging.hasPrevious) return null;

    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage - 1
      }
    };
  }
}


// TaskComment
export interface PagedTaskCommentListRequest
{
    taskId: number;
    searchTerm?: string;
    paging: PagingRequest;
}

export class PagedTaskCommentListRequestBuilder {
  private request: PagedTaskCommentListRequest;

  constructor(taskId: number) {
    this.request = {
      taskId,
      searchTerm: undefined,
      paging: {
        page: 1,
        pageSize: 10
      }
    };
  }

  setSearchTerm(searchTerm?: string): PagedTaskCommentListRequestBuilder {
    this.request.searchTerm = searchTerm;
    return this;
  }

  setPaging(page: number, pageSize: number = 10): PagedTaskCommentListRequestBuilder {
    this.request.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
    return this;
  }

  build(): PagedTaskCommentListRequest {
    return this.request;
  }
}

export class TaskCommentPagingUtils {
  static getNextPageRequest(currentRequest: PagedTaskCommentListRequest, paging: PagingInfo): PagedTaskCommentListRequest | null {
    if (!paging.hasNext) return null;

    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage + 1
      }
    };
  }

  static getPreviousPageRequest(currentRequest: PagedTaskCommentListRequest, paging: PagingInfo): PagedTaskCommentListRequest | null {
    if (!paging.hasPrevious) return null;

    return {
      ...currentRequest,
      paging: {
        ...currentRequest.paging,
        page: paging.currentPage - 1
      }
    };
  }
}

export interface PagedTaskCommentListResponse<TaskCommentResponse> extends PagedListResponse<TaskCommentResponse> {
}