export interface FriendBattleRequest { // value stored under battle:request:<from>:<to>
    from: number;
    to: number;
    fromTeamId: number;
}