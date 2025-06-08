import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { emitToPlayer } from 'src/common/utils/emit.util';
import { v4 as uuidv4 } from 'uuid';
import { Generation, Generations } from '@pkmn/data';
import { Dex, PokemonSet } from '@pkmn/dex';
import { calculate, Pokemon as SimPokemon, Move } from '@smogon/calc';
import { SocketEvents } from 'src/common/constants/events.constants';
import { TeamService } from 'src/teams/teams.service';

const MATCH_PREFIX = 'game:match:';
const PLAYER_MATCHES_PREFIX = 'game:playerMatches:';

interface BattlePokemon extends PokemonSet {
    currentHp: number;
    fainted: boolean;
}

interface PlayerAction {
    type: 'switch' | 'move' | 'forfeit';
    index?: number;
    pokeIndex?: number;
    moveIndex?: number;
}

interface BattlePlayerState {
    id: number;
    team: BattlePokemon[];
    activeIndex: number;
    actionsReceived: boolean;
    action?: PlayerAction;
    fainted: boolean;
}

interface BattleState {
    roomId: string;
    format: string;
    gen: Generation;
    playerA: BattlePlayerState;
    playerB: BattlePlayerState;
}

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    private readonly gens = new Generations(Dex);

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly teamService: TeamService,
    ) { }

    async createMatch(playerAId: number, teamAId: number, playerBId: number, teamBId: number, server: Server): Promise<void> {
        const roomId = uuidv4();
        const roomKey = `${MATCH_PREFIX}${roomId}`;

        const teamA = await this.teamService.findOne(playerAId, teamAId);
        const teamB = await this.teamService.findOne(playerBId, teamBId);

        const parsedA: BattlePokemon[] = teamA.data.map(p => ({ ...p, currentHp: 100, fainted: false }));
        const parsedB: BattlePokemon[] = teamB.data.map(p => ({ ...p, currentHp: 100, fainted: false }));

        const gen = this.gens.get(9);

        const matchState: BattleState = {
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

        await this.redis.set(`game:matchState:${roomId}`, JSON.stringify(matchState));

        await emitToPlayer(this.redis, server, playerAId, SocketEvents.Matchmaking.Emit.MatchFound, roomId);
        await emitToPlayer(this.redis, server, playerBId, SocketEvents.Matchmaking.Emit.MatchFound, roomId);

        await this.sendTeamStates(server, roomId, matchState);
    }

    private async sendTeamStates(server: Server, roomId: string, state: BattleState) {
        const pubTeam = (team: BattlePokemon[]) =>
            team.map(p => ({ species: p.species, fainted: p.fainted }));

        await emitToPlayer(this.redis, server, state.playerA.id, 'game:state:teamPrivate', state.playerA.team);
        await emitToPlayer(this.redis, server, state.playerB.id, 'game:state:teamPrivate', state.playerB.team);

        await emitToPlayer(this.redis, server, state.playerA.id, 'game:state:teamPublic', pubTeam(state.playerB.team));
        await emitToPlayer(this.redis, server, state.playerB.id, 'game:state:teamPublic', pubTeam(state.playerA.team));
    }

    async handlePlayerAction(playerId: number, roomId: string, action: PlayerAction, server: Server) {
        const key = `game:matchState:${roomId}`;
        const stateRaw = await this.redis.get(key);
        if (!stateRaw) return;

        const state: BattleState = JSON.parse(stateRaw);
        const player = state.playerA.id === playerId ? state.playerA : state.playerB;
        if (player.actionsReceived) return;

        if (action.type === 'switch') {
            const to = action.index!;
            if (player.team[to]?.fainted) {
                player.activeIndex = player.team.findIndex(p => !p.fainted);
            } else {
                player.activeIndex = to;
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

    private async processTurn(state: BattleState, server: Server) {
        const key = `game:matchState:${state.roomId}`;
        const gen = state.gen;

        const getSpeed = (player: BattlePlayerState) =>
            Dex.species.get(player.team[player.activeIndex].species).baseStats.spe;

        if (state.playerA.action?.type === 'forfeit') {
            await this.reportWinner(server, state.roomId, state.playerB.id);
            return;
        }
        if (state.playerB.action?.type === 'forfeit') {
            await this.reportWinner(server, state.roomId, state.playerA.id);
            return;
        }

        if (state.playerA.action?.type === 'switch' || state.playerB.action?.type === 'switch') {
            const aSpeed = getSpeed(state.playerA);
            const bSpeed = getSpeed(state.playerB);
            const [first, second] = (aSpeed >= bSpeed)
                ? [state.playerA, state.playerB]
                : [state.playerB, state.playerA];

            if (first.action?.type === 'switch') {
                first.activeIndex = first.action.index!;
                await emitToPlayer(this.redis, server, first.id, 'game:match:switch', first.activeIndex);
            }

            if (second.action?.type === 'switch') {
                second.activeIndex = second.action.index!;
                await emitToPlayer(this.redis, server, second.id, 'game:match:switch', second.activeIndex);
            }
        }

        const aMove = state.playerA.action?.type === 'move';
        const bMove = state.playerB.action?.type === 'move';

        const [firstMover, secondMover] = (getSpeed(state.playerA) >= getSpeed(state.playerB))
            ? [state.playerA, state.playerB]
            : [state.playerB, state.playerA];

        if (aMove || bMove) {
            await this.handleMove(firstMover, secondMover, gen, server, state);
        }

        state.playerA.actionsReceived = false;
        state.playerB.actionsReceived = false;
        state.playerA.action = undefined;
        state.playerB.action = undefined;

        await this.redis.set(key, JSON.stringify(state));
    }

    private async handleMove(
        attacker: BattlePlayerState,
        defender: BattlePlayerState,
        gen: Generation,
        server: Server,
        state: BattleState
    ) {
        const atkSet = attacker.team[attacker.activeIndex];
        const defSet = defender.team[defender.activeIndex];

        const atk = new SimPokemon(gen, attacker.team[attacker.activeIndex].species);
        const def = new SimPokemon(gen, defender.team[defender.activeIndex].species);

        const move = Dex.moves.get(atkSet.moves[attacker.action!.moveIndex!]);
        const result = calculate(gen, atk, def, move as unknown as Move);
        const dmg = Array.isArray(result.damage) ? result.damage[0] : result.damage;

        const defHp = defSet.currentHp;
        const newHp = Math.max(0, defHp - (typeof dmg === 'number' ? dmg : 0));
        defSet.currentHp = newHp;
        defSet.fainted = newHp <= 0;

        if (defSet.fainted) {
            await emitToPlayer(this.redis, server, attacker.id, 'game:match:move', { move: move, damage: dmg, target: defender.id });
            await emitToPlayer(this.redis, server, defender.id, 'game:match:damage', { hp: 0 });

            const hasRemaining = defender.team.some(p => p.currentHp > 0 && !p.fainted);
            if (!hasRemaining) {
                await this.reportWinner(server, state.roomId, attacker.id);
            } else {
                defender.fainted = true;
                await emitToPlayer(this.redis, server, defender.id, 'game:match:selectNew', {});
            }
        } else {
            await emitToPlayer(this.redis, server, attacker.id, 'game:match:move', { move: move, damage: dmg, target: defender.id });
            await emitToPlayer(this.redis, server, defender.id, 'game:match:damage', { hp: newHp });
        }
    }

    private async reportWinner(server: Server, roomId: string, winnerId: number): Promise<void> {
        const key = `${MATCH_PREFIX}${roomId}`;
        const raw = await this.redis.get(key);
        if (!raw) return;

        const match = JSON.parse(raw);
        const players = [match.playerA.id, match.playerB.id];

        await this.redis.del(key);
        await this.redis.del(`game:matchState:${roomId}`);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[0]}`, roomId);
        await this.redis.srem(`${PLAYER_MATCHES_PREFIX}${players[1]}`, roomId);

        server.to(roomId).emit(SocketEvents.Game.Emit.MatchEnd, {
            winner: winnerId,
            roomId,
        });

        this.logger.debug(`Match ${roomId} completed. Winner: ${winnerId}`);
    }
}
