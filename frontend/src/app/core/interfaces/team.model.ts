import { ApiResponse } from "./api-response.model";

export interface Team {
    name: string;
    data: string;
    format?: string;
    strict?: boolean;
}

export type TeamResponse = ApiResponse<Team>;