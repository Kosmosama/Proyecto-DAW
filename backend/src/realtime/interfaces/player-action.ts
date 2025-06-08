export interface PlayerAction {
    type: 'switch' | 'move' | 'forfeit';
    index?: number;
    pokeIndex?: number;
    moveIndex?: number;
}