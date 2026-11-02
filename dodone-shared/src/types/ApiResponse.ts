/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */

export interface ResponseBase {
  success: boolean;
  message?: string;
}
export interface DataResponse<T> extends ResponseBase {
    data: T;
}

