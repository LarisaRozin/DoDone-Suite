"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCommentPagingUtils = exports.PagedTaskCommentListRequestBuilder = exports.TaskItemPagingUtils = exports.PagedTaskItemListRequestBuilder = exports.TaskItemBonusStatusFilter = exports.TaskItemPriorityFilter = exports.TaskItemAllowanceAccreditedStatusFilter = exports.TaskItemNeedReviewStatusFilter = exports.TaskItemEndedStatusFilter = exports.TaskItemStartedStatusFilter = exports.TaskItemDueStatusFilter = exports.TaskItemArchivedStatusFilter = exports.TaskItemActiveStatusFilter = exports.TaskItemCompletionStatusFilter = exports.TaskItemAssignmentStatusFilter = exports.PagingUtils = exports.PagedListRequestBuilder = exports.SortDirection = exports.FilterOperation = void 0;
// Frontend TypeScript utilities for the new paging system
var FilterOperation;
(function (FilterOperation) {
    FilterOperation[FilterOperation["Equals"] = 0] = "Equals";
    FilterOperation[FilterOperation["NotEquals"] = 1] = "NotEquals";
    FilterOperation[FilterOperation["Contains"] = 2] = "Contains";
    FilterOperation[FilterOperation["NotContains"] = 3] = "NotContains";
    FilterOperation[FilterOperation["StartsWith"] = 4] = "StartsWith";
    FilterOperation[FilterOperation["EndsWith"] = 5] = "EndsWith";
    FilterOperation[FilterOperation["GreaterThan"] = 6] = "GreaterThan";
    FilterOperation[FilterOperation["GreaterThanOrEqual"] = 7] = "GreaterThanOrEqual";
    FilterOperation[FilterOperation["LessThan"] = 8] = "LessThan";
    FilterOperation[FilterOperation["LessThanOrEqual"] = 9] = "LessThanOrEqual";
    FilterOperation[FilterOperation["In"] = 10] = "In";
    FilterOperation[FilterOperation["NotIn"] = 11] = "NotIn";
    FilterOperation[FilterOperation["IsNull"] = 12] = "IsNull";
    FilterOperation[FilterOperation["IsNotNull"] = 13] = "IsNotNull";
    FilterOperation[FilterOperation["Between"] = 14] = "Between";
})(FilterOperation || (exports.FilterOperation = FilterOperation = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection[SortDirection["Ascending"] = 0] = "Ascending";
    SortDirection[SortDirection["Descending"] = 1] = "Descending";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
class PagedListRequestBuilder {
    constructor(request) {
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
    setParentId(parentId) {
        this.request.parentId = parentId;
        return this;
    }
    /**
     * Set paging parameters
     */
    setPaging(page, pageSize = 10) {
        this.request.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
        return this;
    }
    /**
     * Add a filter criteria
     */
    addFilter(field, operation, value, values) {
        this.request.filtering.filters.push({
            field,
            operation,
            value,
            values,
            logicalOperator: 'AND'
        });
        return this;
    }
    clearFilter(field) {
        this.request.filtering.filters = this.request.filtering.filters.filter(f => f.field !== field);
        return this;
    }
    /**
     * Set search term and fields
     */
    setSearch(searchTerm, searchFields) {
        this.request.filtering.searchTerm = searchTerm;
        this.request.filtering.searchFields = searchFields;
        return this;
    }
    clearSearch() {
        this.request.filtering.searchTerm = undefined;
        this.request.filtering.searchFields = undefined;
        return this;
    }
    /**
     * Set simple sorting
     */
    setSorting(sortBy, direction = SortDirection.Ascending) {
        this.request.sorting.sortBy = sortBy;
        this.request.sorting.sortDirection = direction;
        return this;
    }
    /**
     * Add multi-column sorting criteria
     */
    addSortCriteria(field, direction, priority) {
        if (!this.request.sorting.sortCriteria) {
            this.request.sorting.sortCriteria = [];
        }
        this.request.sorting.sortCriteria.push({ field, direction, priority });
        return this;
    }
    /**
     * Clear all filters
     */
    clearFilters() {
        this.request.filtering.filters = [];
        this.request.filtering.searchTerm = undefined;
        this.request.filtering.searchFields = undefined;
        return this;
    }
    /**
     * Clear sorting
     */
    clearSorting() {
        this.request.sorting = { sortDirection: SortDirection.Ascending };
        return this;
    }
    /**
     * Build the final request
     */
    build() {
        return Object.assign({}, this.request);
    }
}
exports.PagedListRequestBuilder = PagedListRequestBuilder;
class PagingUtils {
    static getPaginationText(paging) {
        if (paging.totalItems === 0) {
            return 'No items found';
        }
        return `Showing ${paging.firstItemIndex}-${paging.lastItemIndex} of ${paging.totalItems} items`;
    }
    static getPageNumbers(paging, maxVisiblePages = 5) {
        const { currentPage, totalPages } = paging;
        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(1, currentPage - half);
        const end = Math.min(totalPages, start + maxVisiblePages - 1);
        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }
    static getNextPageRequest(currentRequest, paging) {
        if (!paging.hasNext)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage + 1 }) });
    }
    static getPreviousPageRequest(currentRequest, paging) {
        if (!paging.hasPrevious)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage - 1 }) });
    }
}
exports.PagingUtils = PagingUtils;
/**
 * Task Item Specific
 */
var TaskItemAssignmentStatusFilter;
(function (TaskItemAssignmentStatusFilter) {
    TaskItemAssignmentStatusFilter[TaskItemAssignmentStatusFilter["Any"] = 0] = "Any";
    TaskItemAssignmentStatusFilter[TaskItemAssignmentStatusFilter["Mine"] = 1] = "Mine";
    TaskItemAssignmentStatusFilter[TaskItemAssignmentStatusFilter["Private"] = 2] = "Private";
    TaskItemAssignmentStatusFilter[TaskItemAssignmentStatusFilter["Team"] = 3] = "Team";
    TaskItemAssignmentStatusFilter[TaskItemAssignmentStatusFilter["Unassigned"] = 4] = "Unassigned";
})(TaskItemAssignmentStatusFilter || (exports.TaskItemAssignmentStatusFilter = TaskItemAssignmentStatusFilter = {}));
var TaskItemCompletionStatusFilter;
(function (TaskItemCompletionStatusFilter) {
    TaskItemCompletionStatusFilter[TaskItemCompletionStatusFilter["Any"] = 0] = "Any";
    TaskItemCompletionStatusFilter[TaskItemCompletionStatusFilter["Completed"] = 1] = "Completed";
    TaskItemCompletionStatusFilter[TaskItemCompletionStatusFilter["InProgress"] = 2] = "InProgress";
})(TaskItemCompletionStatusFilter || (exports.TaskItemCompletionStatusFilter = TaskItemCompletionStatusFilter = {}));
var TaskItemActiveStatusFilter;
(function (TaskItemActiveStatusFilter) {
    TaskItemActiveStatusFilter[TaskItemActiveStatusFilter["Any"] = 0] = "Any";
    TaskItemActiveStatusFilter[TaskItemActiveStatusFilter["Active"] = 1] = "Active";
    TaskItemActiveStatusFilter[TaskItemActiveStatusFilter["Inactive"] = 2] = "Inactive";
})(TaskItemActiveStatusFilter || (exports.TaskItemActiveStatusFilter = TaskItemActiveStatusFilter = {}));
var TaskItemArchivedStatusFilter;
(function (TaskItemArchivedStatusFilter) {
    TaskItemArchivedStatusFilter[TaskItemArchivedStatusFilter["Any"] = 0] = "Any";
    TaskItemArchivedStatusFilter[TaskItemArchivedStatusFilter["Archived"] = 1] = "Archived";
    TaskItemArchivedStatusFilter[TaskItemArchivedStatusFilter["Unarchived"] = 2] = "Unarchived";
})(TaskItemArchivedStatusFilter || (exports.TaskItemArchivedStatusFilter = TaskItemArchivedStatusFilter = {}));
var TaskItemDueStatusFilter;
(function (TaskItemDueStatusFilter) {
    TaskItemDueStatusFilter[TaskItemDueStatusFilter["Any"] = 0] = "Any";
    TaskItemDueStatusFilter[TaskItemDueStatusFilter["Due"] = 1] = "Due";
    TaskItemDueStatusFilter[TaskItemDueStatusFilter["NotDue"] = 2] = "NotDue";
})(TaskItemDueStatusFilter || (exports.TaskItemDueStatusFilter = TaskItemDueStatusFilter = {}));
var TaskItemStartedStatusFilter;
(function (TaskItemStartedStatusFilter) {
    TaskItemStartedStatusFilter[TaskItemStartedStatusFilter["Any"] = 0] = "Any";
    TaskItemStartedStatusFilter[TaskItemStartedStatusFilter["Started"] = 1] = "Started";
    TaskItemStartedStatusFilter[TaskItemStartedStatusFilter["NotStarted"] = 2] = "NotStarted";
})(TaskItemStartedStatusFilter || (exports.TaskItemStartedStatusFilter = TaskItemStartedStatusFilter = {}));
var TaskItemEndedStatusFilter;
(function (TaskItemEndedStatusFilter) {
    TaskItemEndedStatusFilter[TaskItemEndedStatusFilter["Any"] = 0] = "Any";
    TaskItemEndedStatusFilter[TaskItemEndedStatusFilter["Ended"] = 1] = "Ended";
    TaskItemEndedStatusFilter[TaskItemEndedStatusFilter["NotEnded"] = 2] = "NotEnded";
})(TaskItemEndedStatusFilter || (exports.TaskItemEndedStatusFilter = TaskItemEndedStatusFilter = {}));
var TaskItemNeedReviewStatusFilter;
(function (TaskItemNeedReviewStatusFilter) {
    TaskItemNeedReviewStatusFilter[TaskItemNeedReviewStatusFilter["Any"] = 0] = "Any";
    TaskItemNeedReviewStatusFilter[TaskItemNeedReviewStatusFilter["NeedsReview"] = 1] = "NeedsReview";
})(TaskItemNeedReviewStatusFilter || (exports.TaskItemNeedReviewStatusFilter = TaskItemNeedReviewStatusFilter = {}));
var TaskItemAllowanceAccreditedStatusFilter;
(function (TaskItemAllowanceAccreditedStatusFilter) {
    TaskItemAllowanceAccreditedStatusFilter[TaskItemAllowanceAccreditedStatusFilter["Any"] = 0] = "Any";
    TaskItemAllowanceAccreditedStatusFilter[TaskItemAllowanceAccreditedStatusFilter["Accredited"] = 1] = "Accredited";
})(TaskItemAllowanceAccreditedStatusFilter || (exports.TaskItemAllowanceAccreditedStatusFilter = TaskItemAllowanceAccreditedStatusFilter = {}));
var TaskItemPriorityFilter;
(function (TaskItemPriorityFilter) {
    TaskItemPriorityFilter[TaskItemPriorityFilter["Any"] = 0] = "Any";
    TaskItemPriorityFilter[TaskItemPriorityFilter["None"] = 1] = "None";
    TaskItemPriorityFilter[TaskItemPriorityFilter["Low"] = 2] = "Low";
    TaskItemPriorityFilter[TaskItemPriorityFilter["Medium"] = 3] = "Medium";
    TaskItemPriorityFilter[TaskItemPriorityFilter["High"] = 4] = "High";
    TaskItemPriorityFilter[TaskItemPriorityFilter["Critical"] = 5] = "Critical";
})(TaskItemPriorityFilter || (exports.TaskItemPriorityFilter = TaskItemPriorityFilter = {}));
var TaskItemBonusStatusFilter;
(function (TaskItemBonusStatusFilter) {
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["Any"] = 0] = "Any";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["Current"] = 1] = "Current";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["NeedsReview"] = 2] = "NeedsReview";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["Approved"] = 3] = "Approved";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["Rejected"] = 4] = "Rejected";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["Claimed"] = 5] = "Claimed";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["NotClaimed"] = 6] = "NotClaimed";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["WithBonus"] = 7] = "WithBonus";
    TaskItemBonusStatusFilter[TaskItemBonusStatusFilter["WithoutBonus"] = 8] = "WithoutBonus";
})(TaskItemBonusStatusFilter || (exports.TaskItemBonusStatusFilter = TaskItemBonusStatusFilter = {}));
class PagedTaskItemListRequestBuilder {
    constructor(request) {
        this.teamAllowanceIntervalId = (request === null || request === void 0 ? void 0 : request.teamAllowanceIntervalId) || 0;
        this.paging = (request === null || request === void 0 ? void 0 : request.paging) || { page: 1, pageSize: 10 };
        this.taskItemFiltering = (request === null || request === void 0 ? void 0 : request.taskItemFiltering) ||
            { assignmentFilter: TaskItemAssignmentStatusFilter.Any,
                completionFilter: TaskItemCompletionStatusFilter.Any,
                activeFilter: TaskItemActiveStatusFilter.Any,
                priorityFilter: TaskItemPriorityFilter.Any,
                archivedFilter: TaskItemArchivedStatusFilter.Any,
                dueFilter: TaskItemDueStatusFilter.Any,
                startedFilter: TaskItemStartedStatusFilter.Any,
                endedFilter: TaskItemEndedStatusFilter.Any,
                allowanceNeedReviewFilter: TaskItemNeedReviewStatusFilter.Any,
                allowanceAccreditedFilter: TaskItemAllowanceAccreditedStatusFilter.Any,
                bonusStatusFilter: TaskItemBonusStatusFilter.Any,
                groupId: undefined,
                kindId: undefined,
                categoryId: undefined,
                assignedTo: undefined,
                gradeId: undefined,
                credits: undefined,
                searchTerm: undefined
            };
    }
    setTeamAllowanceIntervalId(teamAllowanceIntervalId) {
        this.teamAllowanceIntervalId = teamAllowanceIntervalId;
        return this;
    }
    setAssignmentFilter(filter) {
        this.taskItemFiltering.assignmentFilter = filter;
        return this;
    }
    setCompletionFilter(filter) {
        this.taskItemFiltering.completionFilter = filter;
        return this;
    }
    setActiveFilter(filter) {
        this.taskItemFiltering.activeFilter = filter;
        return this;
    }
    setPriorityFilter(filter) {
        this.taskItemFiltering.priorityFilter = filter;
        return this;
    }
    setArchivedFilter(filter) {
        this.taskItemFiltering.archivedFilter = filter;
        return this;
    }
    setDueFilter(filter) {
        this.taskItemFiltering.dueFilter = filter;
        return this;
    }
    setStartedFilter(filter) {
        this.taskItemFiltering.startedFilter = filter;
        return this;
    }
    setEndedFilter(filter) {
        this.taskItemFiltering.endedFilter = filter;
        return this;
    }
    setAllowanceNeedReviewFilter(filter) {
        this.taskItemFiltering.allowanceNeedReviewFilter = filter;
        return this;
    }
    setAllowanceAccreditedFilter(filter) {
        this.taskItemFiltering.allowanceAccreditedFilter = filter;
        return this;
    }
    setBonusStatusFilter(filter) {
        this.taskItemFiltering.bonusStatusFilter = filter;
        return this;
    }
    setTeamMemberFilter(userId) {
        this.taskItemFiltering.assignedTo = userId;
        return this;
    }
    setSearchTerm(searchTerm) {
        this.taskItemFiltering.searchTerm = searchTerm;
        return this;
    }
    clearTaskItemFilters() {
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
    setGroupId(groupId) {
        this.taskItemFiltering.groupId = groupId;
        return this;
    }
    setKindId(kindId) {
        this.taskItemFiltering.kindId = kindId;
        return this;
    }
    setCategoryId(categoryId) {
        this.taskItemFiltering.categoryId = categoryId;
        return this;
    }
    setGradeId(gradeId) {
        this.taskItemFiltering.gradeId = gradeId;
        return this;
    }
    setCredits(credits) {
        this.taskItemFiltering.credits = credits;
        return this;
    }
    setPaging(page, pageSize = 10) {
        this.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
        return this;
    }
    build() {
        return {
            teamAllowanceIntervalId: this.teamAllowanceIntervalId,
            taskItemFiltering: this.taskItemFiltering,
            paging: this.paging
        };
    }
}
exports.PagedTaskItemListRequestBuilder = PagedTaskItemListRequestBuilder;
class TaskItemPagingUtils {
    static getNextPageRequest(currentRequest, paging) {
        if (!paging.hasNext)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage + 1 }) });
    }
    static getPreviousPageRequest(currentRequest, paging) {
        if (!paging.hasPrevious)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage - 1 }) });
    }
}
exports.TaskItemPagingUtils = TaskItemPagingUtils;
class PagedTaskCommentListRequestBuilder {
    constructor(taskId) {
        this.request = {
            taskId,
            searchTerm: undefined,
            paging: {
                page: 1,
                pageSize: 10
            }
        };
    }
    setSearchTerm(searchTerm) {
        this.request.searchTerm = searchTerm;
        return this;
    }
    setPaging(page, pageSize = 10) {
        this.request.paging = { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) };
        return this;
    }
    build() {
        return this.request;
    }
}
exports.PagedTaskCommentListRequestBuilder = PagedTaskCommentListRequestBuilder;
class TaskCommentPagingUtils {
    static getNextPageRequest(currentRequest, paging) {
        if (!paging.hasNext)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage + 1 }) });
    }
    static getPreviousPageRequest(currentRequest, paging) {
        if (!paging.hasPrevious)
            return null;
        return Object.assign(Object.assign({}, currentRequest), { paging: Object.assign(Object.assign({}, currentRequest.paging), { page: paging.currentPage - 1 }) });
    }
}
exports.TaskCommentPagingUtils = TaskCommentPagingUtils;
