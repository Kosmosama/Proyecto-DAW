export interface GameRoom {
    roomId: string;
    player1: MatchmakingEntry;
    player2: MatchmakingEntry;
    spectators: MatchmakingEntry[];
}