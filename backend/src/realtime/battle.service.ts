import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
const { Battle } = require('pokemon-showdown');

@Injectable()
export class BattleService {
    private activeBattles = new Map<string, InstanceType<typeof Battle>>();

    /**
     * Creates a new battle and associates it with the roomId
     */
    createBattle(roomId: string): InstanceType<typeof Battle> {
        const battle = new Battle({ formatid: 'gen9ou' });
        this.activeBattles.set(roomId, battle);
        return battle;
    }

    /**
     * Retrieves an active battle by its roomId
     */
    getBattle(roomId: string): InstanceType<typeof Battle> | undefined {
        return this.activeBattles.get(roomId);
    }

    /**
     * Handles a player's action (move, switch, etc.)
     * @param roomId Battle room
     * @param player 'p1' or 'p2'
     * @param input String like 'move 1' or 'switch 2'
     * @returns Updated battle log
     */
    handleInput(roomId: string, player: 'p1' | 'p2', input: string): string[] {
        const battle = this.getBattle(roomId);
        if (!battle) throw new Error('Battle not found');

        battle.input(`[${player}] ${input}`);
        return [...battle.log];
    }

    startRealtimeBattle(p1Id: number, p2Id: number, server: Server) {
        const roomId = `battle-${p1Id}-${p2Id}`;
        const battle = this.createBattle(roomId);
        battle.setPlayer('p1', { name: `Player ${p1Id}` });
        battle.setPlayer('p2', { name: `Player ${p2Id}` });

        server.fetchSockets().then(sockets => {
            for (const socket of sockets) {
                const pid = socket.data.playerId;
                if (pid === p1Id) socket.emit('battle:ready', { roomId, as: 'p1' });
                if (pid === p2Id) socket.emit('battle:ready', { roomId, as: 'p2' });
            }
        });

        return roomId;
    }

    setPlayer(roomId: string, slot: 'p1' | 'p2', player: { name: string }) {
        const battle = this.getBattle(roomId);
        if (!battle) throw new Error(`Battle not found for roomId: ${roomId}`);
        battle.setPlayer(slot, player);
    }


}
