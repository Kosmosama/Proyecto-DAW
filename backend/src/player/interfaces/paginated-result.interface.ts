interface PaginatedResult<T> {
    result: T[];
    more: boolean;
}