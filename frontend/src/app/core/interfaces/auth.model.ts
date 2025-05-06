import { ApiResponse } from "./api-response.model";

export type TokenResponse = ApiResponse<{ accessToken: string; }>;

export type LoginResponse = ApiResponse<{
    accessToken: string;
    refreshToken: string;
}>;