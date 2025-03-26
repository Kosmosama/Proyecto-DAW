export interface Player {
    id?: number;
    name: string;
    passwordHash: string;
    photo?: string;
}

export interface SinglePlayerResponse {
    data: Player;
}
