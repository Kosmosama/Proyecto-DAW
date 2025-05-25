export interface PaginatedResult<T> {
    data: T[];
    more: boolean;
}