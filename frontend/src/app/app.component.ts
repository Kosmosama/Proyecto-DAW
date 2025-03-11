import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { calculate, Generations, Move, Pokemon } from '@smogon/calc';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styles: [],
})
export class AppComponent {
    title = 'frontend';

    test() {
        const gen = Generations.get(5);
        const move = new Move(gen, 'Close Combat');

        const result = calculate(
            gen,
            new Pokemon(gen, 'Machamp', {
                item: 'Choice Specs',
                nature: 'Timid',
                evs: { spa: 252 },
                boosts: { spa: 1 },
            }),
            new Pokemon(gen, 'Eevee', {
                item: 'Eviolite',
                nature: 'Calm',
                evs: { hp: 252, spd: 252 },
            }),
            move
        );

        console.log(result);
    }
}
