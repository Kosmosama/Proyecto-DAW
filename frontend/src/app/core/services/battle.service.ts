import { inject, Injectable, signal } from '@angular/core';
import { SocketEvents } from '../constants/socket-events';
import { PlayerAction } from '../interfaces/player-action';
import { StatusSocketService } from './statusSocket.service';

@Injectable({
    providedIn: 'root',
})
export class BattleService {

    private statusSocket = inject(StatusSocketService);

    error = signal<string | null>(null);
    public messages = signal<string[]>([]);
    roomId = signal<string | null>(null);

    constructor() {
        console.log('Socket conectado:', this.statusSocket['socket']);

        this.roomId.set(localStorage.getItem('activeRoomId') || null);
        const socket = this.statusSocket['socket'];

        socket?.on(SocketEvents.Game.Listen.ChatMessage, (data: any) => {
            this.messages.update(messages => [...messages, data?.message || 'New chat message received']);
        });

        socket?.on(SocketEvents.Game.Listen.BattleAction, (data: any) => {
        });

        socket?.on(SocketEvents.Game.Listen.MatchEnd, () => {
            this.roomId.set(null);
        });
    }

    sendChatMessage(message: string) {
        const roomId = this.roomId();
        console.log('Room ID al enviar mensaje:', this.roomId());

        if (!roomId) return;
        this.statusSocket['socket']?.emit(SocketEvents.Game.Emit.Chat, { roomId, message });
    }

    sendBattleAction(action: PlayerAction) {
        const roomId = this.roomId();
        if (!roomId) return;
        this.statusSocket['socket']?.emit(SocketEvents.Game.Emit.Action, { roomId, action });
    }
}
