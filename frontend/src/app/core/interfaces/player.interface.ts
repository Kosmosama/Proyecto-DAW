export interface Player {
    id?: number;
    email: string;
    username: string;
    password: string;
    online?: boolean;
    photo?: string;
}

export interface PlayerLogin {
    email: string;
    password: string;
}

export interface SinglePlayerResponse {
    data: Player;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}