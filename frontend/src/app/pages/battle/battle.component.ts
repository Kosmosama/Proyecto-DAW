import { Component, inject, signal } from '@angular/core';
import { BattleService } from '../../core/services/battle.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-battle',
    templateUrl: './battle.component.html',
    styleUrls: ['./battle.component.scss'],
    standalone: true,
    imports: [FormsModule],
})
export class BattleComponent {

    private battleService = inject(BattleService);
    chatInput = '';
    messages = this.battleService.messages;

    constructor() { }

    sendMessage() {
        const msg = this.chatInput.trim();
        if (!msg) return;
        this.battleService.sendChatMessage(msg);
        this.chatInput = '';
    }
}