import { ApiResponse } from "./api-response.model";

export interface Player {
    id?: number;
    email: string;
    username: string;
    password: string;
    online?: boolean;
    photo?: string;
    lastLogin?: Date;
    tag?: string;
}

export type PlayerResponse = ApiResponse<Player, { more: boolean }>;

export type PlayersResponse = ApiResponse<Player[], { more: boolean }>;

export type PlayerLogin = Pick<Player, 'email' | 'password'>;

export type PlayerProfileUpdate = Partial<Pick<Player, 'username' | 'password'>>;

export type PlayerProfileUpdateResponse = {
    data: Pick<Player, 'id' | 'username' | 'tag' | 'photo'>;
};

export type FriendRequest = Pick<Player, 'id' | 'username' | 'photo'> & {
    sentAt: string;
};

export type FriendRequestsResponse = ApiResponse<FriendRequest[], { more: boolean }>;
