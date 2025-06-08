import { Generation } from "@pkmn/data";
import { BattlePlayerState } from "./battle-player-state.interface";

export interface BattleState {
    roomId: string;
    format: string;
    gen: Generation;
    playerA: BattlePlayerState;
    playerB: BattlePlayerState;
}