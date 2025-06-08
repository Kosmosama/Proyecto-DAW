import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Generation, Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { calculate, Move as SimMove, Pokemon as SimPokemon } from '@smogon/calc';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { SocketEvents } from 'src/common/constants/events.constants';
import { MATCH_PREFIX, MATCH_STATE_PREFIX, PLAYER_MATCHES_PREFIX, PLAYER_SOCKETS_PREFIX } from 'src/common/constants/redis.constants';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { TeamService } from 'src/teams/teams.service';
import { v4 as uuidv4 } from 'uuid';
import { BattlePlayerState } from './interfaces/battle-player-state.interface';
import { BattlePokemon } from './interfaces/battle-pokemon.interface';
import { BattleState } from './interfaces/battle-state.interface';
import { PlayerAction } from './interfaces/player-action';

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private readonly gens = new Generations(Dex);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly teamService: TeamService,
    ) { }

    /**
     * Creates a new match between two players.
     * @param {number} playerAId - ID of the first player.
     * @param {number} teamAId - ID of the team for the first player.
     * @param {number} playerBId - ID of the second player.
     * @param {number} teamBId - ID of the team for the second player.
     * @param {Server} server - The Socket.IO server instance.
     * @return {Promise<void>} No return value.
     */
    async createMatch(playerAId: number, teamAId: number, playerBId: number, teamBId: number, server: Server): Promise<void> {
        const roomId = uuidv4();
        const stateKey = `${MATCH_STATE_PREFIX}:${roomId}`;

        const teamA = await this.teamService.findOne(playerAId, teamAId);
        const teamB = await this.teamService.findOne(playerBId, teamBId);
        const parsedA: BattlePokemon[] = teamA.data.map(p => ({
            ...p,
            currentHp: 100,
            fainted: false,
        }));
        const parsedB: BattlePokemon[] = teamB.data.map(p => ({
            ...p,
            currentHp: 100,
            fainted: false,
        }));
        const gen = this.gens.get(9);

        const state: BattleState = {
            roomId,
            format: teamA.format,
            gen,
            playerA: {
                id: playerAId,
                team: parsedA,
                activeIndex: 0,
                actionsReceived: false,
                fainted: false,
            },
            playerB: {
                id: playerBId,
                team: parsedB,
                activeIndex: 0,
                actionsReceived: false,
                fainted: false,
            },
        };

        await this.redis.set(stateKey, JSON.stringify(state));
        await this.redis.sadd(`${PLAYER_MATCHES_PREFIX}${playerAId}`, roomId);
        await this.redis.sadd(`${PLAYER_MATCHES_PREFIX}${playerBId}`, roomId);

        await Promise.all([
            this.joinPlayerToRoom(this.redis, server, playerAId, roomId),
            this.joinPlayerToRoom(this.redis, server, playerBId, roomId),
        ]);

        await emitToPlayer(this.redis, server, playerAId, SocketEvents.Matchmaking.Emit.MatchFound, roomId);
        await emitToPlayer(this.redis, server, playerBId, SocketEvents.Matchmaking.Emit.MatchFound, roomId);

        await this.sendTeamStates(server, roomId, state);
    }

    /**
     * Sends the initial team states to both players in the match.
     * @param {Server} server - The Socket.IO server instance.
     * @param {string} roomId - The ID of the room where the match is taking place.
     * @param {BattleState} state - The current state of the battle.
     * @return {Promise<void>} No return value.
     */
    async handlePlayerAction(playerId: number, roomId: string, action: PlayerAction, server: Server): Promise<void> {
        if (!(await this.isPlayerInRoom(playerId, roomId))) {
            this.logger.warn(`Unauthorized action attempt by player ${playerId} in room ${roomId}`);
            return;
        }
        const key = `${MATCH_STATE_PREFIX}:${roomId}`;
        const raw = await this.redis.get(key);
        if (!raw) return;
        const state: BattleState = JSON.parse(raw);
        const player = state.playerA.id === playerId ? state.playerA : state.playerB;
        if (player.actionsReceived) return;

        if (action.type === 'switch') {
            const idx = action.index!;
            if (player.team[idx]?.fainted) {
                // Fallback to first non-fainted pokemon if chosen Pokémon is fainted
                player.activeIndex = player.team.findIndex(p => !p.fainted);
            } else {
                player.activeIndex = idx;
            }
        }
        player.action = action;
        player.actionsReceived = true;

        if (state.playerA.actionsReceived && state.playerB.actionsReceived) {
            await this.processTurn(state, server);
        } else {
            await this.redis.set(key, JSON.stringify(state));
        }
    }

    /**
     * Handles a player's chat message in the game room.
     * @param {string} roomId - The ID of the room where the chat message was sent.
     * @param {number} playerId - The ID of the player who sent the message.
     * @param {string} message - The chat message sent by the player.
     * @param {Server} server - The Socket.IO server instance.
     * @return {Promise<void>} No return value.
     */
    async handlePlayerChat(roomId: string, playerId: number, message: string, server: Server): Promise<void> {
        if (!(await this.isPlayerInRoom(playerId, roomId))) {
            this.logger.warn(`Unauthorized chat attempt by player ${playerId} in room ${roomId}`);
            return;
        }

        server.to(roomId).emit(SocketEvents.Game.Emit.ChatMessage, {
            sender: playerId,
            message,
            roomId,
        });
    }

    /**
     * Handles a player's reconnection to the game room.
     * @param {number} playerId - The ID of the player reconnecting.
     * @param {string} socketId - The ID of the socket being used for reconnection.
     * @param {Server} server - The Socket.IO server instance.
     * @return {Promise<void>} No return value.
     */
    async handlePlayerReconnect(playerId: number, socketId: string, server: Server): Promise<void> {
        const matchIds = await this.redis.smembers(`${PLAYER_MATCHES_PREFIX}${playerId}`);
        for (const roomId of matchIds) {
            const raw = await this.redis.get(`${MATCH_STATE_PREFIX}:${roomId}`);
            if (!raw) continue;

            const state: BattleState = JSON.parse(raw);
            const isInMatch = state.playerA.id === playerId || state.playerB.id === playerId;
            if (!isInMatch) continue;

            const socket = await server.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(roomId);
                this.logger.debug(`Socket ${socketId} of player ${playerId} joined room ${roomId}`);
            }

            // Re-emit match found event so client can rehydrate UI state
            await emitToPlayer(this.redis, server, playerId, SocketEvents.Matchmaking.Emit.MatchFound, roomId);
        }
    }

    async handlePlayerDisconnected(playerId: number, server: Server): Promise<void> {
        const matchIds = await this.redis.smembers(`${PLAYER_MATCHES_PREFIX}${playerId}`);
        for (const roomId of matchIds) {
            const raw = await this.redis.get(`${MATCH_STATE_PREFIX}:${roomId}`);
            if (!raw) continue;

            const state: BattleState = JSON.parse(raw);
            const opponentId =
                state.playerA.id === playerId ? state.playerB.id :
                    state.playerB.id === playerId ? state.playerA.id : null;

            if (!opponentId) continue;

            await this.reportWinner(server, roomId, opponentId);
            this.logger.warn(`Player ${playerId} forfeited match ${roomId} due to disconnection.`);
        }
    }

    /**
     * Sends the initial team states to both players in the match.
     * @param {Server} server - The Socket.IO server instance.
     * @param {string} roomId - The ID of the room where the match is taking place.
     * @param {BattleState} state - The current state of the battle.
     * @return {Promise<void>} No return value.
     */
    private async sendTeamStates(server: Server, roomId: string, state: BattleState): Promise<void> {
        const pubTeam = (team: BattlePokemon[]) => team.map(p => ({ species: p.species, fainted: p.fainted }));
        await emitToPlayer(this.redis, server, state.playerA.id, SocketEvents.Game.Emit.TeamPrivate, state.playerA.team);
        await emitToPlayer(this.redis, server, state.playerB.id, SocketEvents.Game.Emit.TeamPrivate, state.playerB.team);
        await emitToPlayer(this.redis, server, state.playerA.id, SocketEvents.Game.Emit.TeamPublic, pubTeam(state.playerB.team));
        await emitToPlayer(this.redis, server, state.playerB.id, SocketEvents.Game.Emit.TeamPublic, pubTeam(state.playerA.team));
    }

    /**
     * Checks if a player is currently in a specific room.
     * @param {number} playerId - The ID of the player.
     * @param {string} roomId - The ID of the room to check.
     * @return {Promise<boolean>} True if the player is in the room, false otherwise.
     */
    private async isPlayerInRoom(playerId: number, roomId: string): Promise<boolean> {
        const stateRaw = await this.redis.get(`${MATCH_STATE_PREFIX}:${roomId}`);
        if (!stateRaw) return false;
        const state: BattleState = JSON.parse(stateRaw);
        return state.playerA.id === playerId || state.playerB.id === playerId;
    }

    /**
     * Processes a turn in the battle, handling player actions and determining outcomes.
     * @param {BattleState} state - The current state of the battle.
     * @param {Server} server - The Socket.IO server instance.
     * @return {Promise<void>} No return value.
     */
    private async processTurn(state: BattleState, server: Server): Promise<void> {
        const key = `${MATCH_STATE_PREFIX}:${state.roomId}`;
        const gen = state.gen;

        // Determine speed using base stat of the active Pokémon
        const getSpeed = (p: BattlePlayerState) =>
            Dex.species.get(p.team[p.activeIndex].species).baseStats.spe;

        // Fast forfeit check: if either player forfeited, declare the opponent the winner
        if (state.playerA.action?.type === 'forfeit') {
            await this.reportWinner(server, state.roomId, state.playerB.id);
            return;
        }
        if (state.playerB.action?.type === 'forfeit') {
            await this.reportWinner(server, state.roomId, state.playerA.id);
            return;
        }

        // Handle switch logic | faster player switches first
        if (state.playerA.action?.type === 'switch' || state.playerB.action?.type === 'switch') {
            const aSp = getSpeed(state.playerA);
            const bSp = getSpeed(state.playerB);
            const [first, second] = aSp >= bSp ? [state.playerA, state.playerB] : [state.playerB, state.playerA];

            // Only actually switch if requested
            if (first.action?.type === 'switch') {
                first.activeIndex = first.action.index!;
                await emitToPlayer(this.redis, server, first.id, SocketEvents.Game.Emit.Switch, first.activeIndex);
            }
            if (second.action?.type === 'switch') {
                second.activeIndex = second.action.index!;
                await emitToPlayer(this.redis, server, second.id, SocketEvents.Game.Emit.Switch, second.activeIndex);
            }
        }

        // Determine move order based on speed again | if at least one is using a move
        const aMove = state.playerA.action?.type === 'move';
        const bMove = state.playerB.action?.type === 'move';
        const [firstMover, secondMover] =
            getSpeed(state.playerA) >= getSpeed(state.playerB)
                ? [state.playerA, state.playerB]
                : [state.playerB, state.playerA];

        // Handle move execution
        if (aMove || bMove) {
            await this.handleMove(firstMover, secondMover, gen, server, state);
        }

        // Reset turn "flags" for next turn
        state.playerA.actionsReceived = false;
        state.playerB.actionsReceived = false;
        state.playerA.action = undefined;
        state.playerB.action = undefined;
        await this.redis.set(key, JSON.stringify(state));
    }

    /**
     * Handles a player's move action in the battle.
     * @param {BattlePlayerState} attacker - The player making the move.
     * @param {BattlePlayerState} defender - The player being attacked.
     * @param {Generation} gen - The generation of the game.
     * @param {Server} server - The Socket.IO server instance.
     * @param {BattleState} state - The current state of the battle.
     * @return {Promise<void>} No return value.
     */
    private async handleMove(attacker: BattlePlayerState, defender: BattlePlayerState, gen: Generation, server: Server, state: BattleState): Promise<void> {
        
        // Pokemon building
        const atkSet = attacker.team[attacker.activeIndex];
        const defSet = defender.team[defender.activeIndex];
        const atk = new SimPokemon(gen, atkSet.species, { moves: atkSet.moves });
        const def = new SimPokemon(gen, defSet.species);

        // Select the move from attacker's action and calculate the damage
        const moveName = atkSet.moves[attacker.action!.moveIndex!];
        const move = new SimMove(gen, moveName);
        const result = calculate(gen, atk, def, move);

        // Determine damage and apply to defender's HP
        const dmg = Array.isArray(result.damage) ? result.damage[0] : result.damage;
        const newHp = Math.max(0, defSet.currentHp - (typeof dmg === 'number' ? dmg : 0));
        defSet.currentHp = newHp;
        defSet.fainted = newHp <= 0;

        // Check if defender fainted and whether the game ends or prompts a new switch
        if (defSet.fainted) {
            await emitToPlayer(this.redis, server, attacker.id, SocketEvents.Game.Emit.Move, { move: moveName, damage: dmg, target: defender.id });
            await emitToPlayer(this.redis, server, defender.id, SocketEvents.Game.Emit.Damage, { hp: 0 });
            const hasAlive = defender.team.some(p => p.currentHp > 0 && !p.fainted);
            if (!hasAlive) {
                await this.reportWinner(server, state.roomId, attacker.id);
            } else {
                defender.fainted = true;
                await emitToPlayer(this.redis, server, defender.id, SocketEvents.Game.Emit.SelectNew, {});
            }
        } else {
            // If not fainted, just report the damage
            await emitToPlayer(this.redis, server, attacker.id, SocketEvents.Game.Emit.Move, { move: moveName, damage: dmg, target: defender.id });
            await emitToPlayer(this.redis, server, defender.id, SocketEvents.Game.Emit.Damage, { hp: newHp });
        }
    }

    /**
     * Reports the winner of a match and cleans up the match state.
     * @param {Server} server - The Socket.IO server instance.
     * @param {string} roomId - The ID of the room where the match took place.
     * @param {number} winnerId - The ID of the player who won the match.
     * @return {Promise<void>} No return value.
     */
    private async reportWinner(server: Server, roomId: string, winnerId: number): Promise<void> {
        const key = `${MATCH_PREFIX}${roomId}`;
        const raw = await this.redis.get(key);
        if (!raw) return;
        const match = JSON.parse(raw);
        const players = [match.playerA.id, match.playerB.id];

        await this.redis.del(key);
        await this.redis.del(`${MATCH_STATE_PREFIX}:${roomId}`);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[0]}`, roomId);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[1]}`, roomId);

        server.to(roomId).emit(SocketEvents.Game.Emit.MatchEnd, {
            winner: winnerId,
            roomId,
        });

        this.logger.debug(`Match ${roomId} completed. Winner: ${winnerId}`);
    }

    /**
     * Joins a player's socket to a specific room.
     * @param {Redis} redis - The Redis instance for caching.
     * @param {Server} server - The Socket.IO server instance.
     * @param {number} playerId - The ID of the player whose socket is being joined.
     * @param {string} roomId - The ID of the room to join.
     * @return {Promise<void>} No return value.
     */
    private async joinPlayerToRoom(redis: Redis, server: Server, playerId: number, roomId: string): Promise<void> {
        const socketIds = await redis.smembers(`${PLAYER_SOCKETS_PREFIX}${playerId}`);
        if (!socketIds.length) return;

        const sockets = await server.in(socketIds).fetchSockets();
        for (const socket of sockets) {
            socket.join(roomId);
            this.logger.debug(`Player ${playerId}'s socket ${socket.id} joined room ${roomId}`);
        }
    }
}
