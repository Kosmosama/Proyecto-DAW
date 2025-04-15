import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusService {
    private onlineMap = new Map<number, Set<number>>();

    async setOnline(playerId: number, socketId: number): Promise<void> {
        const sockets = this.onlineMap.get(playerId) ?? new Set<number>();
        sockets.add(socketId);
        this.onlineMap.set(playerId, sockets);
    }

    async setOffline(playerId: number, socketId: number): Promise<boolean> {
        const sockets = this.onlineMap.get(playerId);
        if (!sockets) return false;

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.onlineMap.delete(playerId);
            return false;
        }

        this.onlineMap.set(playerId, sockets);
        return true;
    }

    async getStatus(playerId: number): Promise<'online' | 'offline'> {
        return this.onlineMap.has(playerId) ? 'online' : 'offline';
    }

    async getStatusBulk(playerIds: number[]): Promise<Record<number, 'online' | 'offline'>> {
        const result: Record<number, 'online' | 'offline'> = {};
        for (const id of playerIds) {
            result[id] = this.onlineMap.has(id) ? 'online' : 'offline';
        }
        return result;
    }

    getOnlinePlayerIds(): number[] {
        return Array.from(this.onlineMap.keys());
    }
}
