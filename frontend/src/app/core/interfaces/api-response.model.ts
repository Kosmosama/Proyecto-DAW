export interface ApiResponse<T, M = undefined > {
    data: T;
    meta?: M;
}

