export function generateBattleRoomId(playerId1: number, playerId2: number): string {
    const [a, b] = [playerId1, playerId2].sort();

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

    return `battle-${a}-${b}-${timestamp}`;
}
