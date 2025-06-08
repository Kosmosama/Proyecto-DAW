import { Component } from "@angular/core";

@Component({
    selector: 'app-battle',
    templateUrl: './battle.component.html',
    styleUrls: ['./battle.component.scss'],
    standalone: true,
    imports: [],
})
export class BattleComponent {

    constructor() { 
        console.log('BattleComponent initialized');
    }

}