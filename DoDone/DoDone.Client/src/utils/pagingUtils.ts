/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
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

export interface PagedListResponse<T> {
  data: T[];
  success: boolean;
  message: string;
  paging: PagingInfo;
  appliedFilters?: FilteringRequest;
  appliedSorting?: SortingRequest;
}

/**
 * Builder class for creating paged list requests
 */
export class PagedListRequestBuilder {
  private request: PagedListRequest;

  constructor() {
    this.request = {
      paging: { page: 1, pageSize: 10 },
      filtering: { filters: [] },
      sorting: { sortDirection: SortDirection.Ascending }
    };
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

  /**
   * Set search term and fields
   */
  setSearch(searchTerm: string, searchFields?: string[]): PagedListRequestBuilder {
    this.request.filtering.searchTerm = searchTerm;
    this.request.filtering.searchFields = searchFields;
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

/**
 * API client helper for paged requests
 */
export class PagedApiClient {
  constructor(private baseUrl: string) {}

  /**
   * Generic paged list request
   */
  async getPagedList<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>> {
    const response = await fetch(`${this.baseUrl}/${endpoint}/paged-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generic paged details list request
   */
  async getPagedListDetails<T>(endpoint: string, request: PagedListRequest): Promise<PagedListResponse<T>> {
    const response = await fetch(`${this.baseUrl}/${endpoint}/paged-list-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

/**
 * Utility functions for working with paged data
 */
export class PagingUtils {
  /**
   * Generate pagination info text
   */
  static getPaginationText(paging: PagingInfo): string {
    if (paging.totalItems === 0) {
      return 'No items found';
    }
    return `Showing ${paging.firstItemIndex}-${paging.lastItemIndex} of ${paging.totalItems} items`;
  }

  /**
   * Generate page numbers for pagination control
   */
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

  /**
   * Create a request for the next page
   */
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

  /**
   * Create a request for the previous page
   */
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

// Example usage:
export const exampleUsage = {
  // Simple request
  simple: () => {
    return new PagedListRequestBuilder()
      .setPaging(1, 20)
      .setSearch('urgent')
      .setSorting('name', SortDirection.Ascending)
      .build();
  },

  // Complex request with multiple filters and sorts
  complex: () => {
    return new PagedListRequestBuilder()
      .setParentId(123)
      .setPaging(2, 25)
      .addFilter('isActive', FilterOperation.Equals, true)
      .addFilter('priority', FilterOperation.GreaterThanOrEqual, 5)
      .addFilter('status', FilterOperation.In, undefined, ['Open', 'InProgress'])
      .addSortCriteria('priority', SortDirection.Descending, 0)
      .addSortCriteria('dueDate', SortDirection.Ascending, 1)
      .build();
  },

  // API client usage
  apiUsage: async () => {
    const client = new PagedApiClient('/api');
    const request = new PagedListRequestBuilder()
      .setPaging(1, 10)
      .setSearch('project')
      .build();

    try {
      const response = await client.getPagedList('taskitem', request);
      console.log(PagingUtils.getPaginationText(response.paging));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch paged data:', error);
      return [];
    }
  }
};
