export interface Player {
    id?: number;
    email: string;
    name: string;
    password: string;
    photo?: string;
}

export interface SinglePlayerResponse {
    data: Player;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}