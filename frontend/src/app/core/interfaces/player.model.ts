import { ApiResponse } from "./api-response.model";

export interface Player {
    id?: number;
    email: string;
    username: string;
    password: string;
    online?: boolean;
    photo?: string;
    lastLogin?: Date;
}

export type SinglePlayerResponse = ApiResponse<Player>;

export type PlayersResponse = ApiResponse<Player[], { more: boolean }>;

export type PlayerLogin = Pick<Player, 'email' | 'password'>;