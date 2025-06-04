export function generateBattleRoomId(playerId1: string, playerId2: string): string {
    const [a, b] = [playerId1, playerId2].sort();

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

    return `battle-${a}-${b}-${timestamp}`;
}
