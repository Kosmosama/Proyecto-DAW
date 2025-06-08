import { BattlePokemon } from "./battle-pokemon.interface";
import { PlayerAction } from "./player-action";

export interface BattlePlayerState {
    id: number;
    team: BattlePokemon[];
    activeIndex: number;
    actionsReceived: boolean;
    action?: PlayerAction;
    fainted: boolean;
}