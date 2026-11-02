export interface ResponseBase {
    success: boolean;
    message?: string;
}
export interface DataResponse<T> extends ResponseBase {
    data: T;
}
