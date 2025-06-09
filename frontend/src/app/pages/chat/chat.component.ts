import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map, Observable, shareReplay } from 'rxjs';
import { Player } from '../../core/interfaces/player.model';
import { GeneralChatSocketService } from '../../core/services/chat.service';
import { PlayerService } from '../../core/services/player.service';
import { AvatarFallbackPipe } from '../../shared/pipes/avatar-fallback-pipe';

@Component({
  selector: 'app-general-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [FormsModule, CommonModule, AvatarFallbackPipe]
})
export class ChatComponent {
  private chatService = inject(GeneralChatSocketService);
  private playerService = inject(PlayerService);

  newMessage = '';
  messages = this.chatService.getMessages();

  constructor() {
    this.chatService.connect();
  }
  private userCache = new Map<number, Observable<Player>>();

  private getUser(id: number): Observable<Player> {
    if (!this.userCache.has(id)) {
      const user$ = this.playerService.getProfile(id).pipe(
        shareReplay(1)
      );
      this.userCache.set(id, user$);
    }
    return this.userCache.get(id)!;
  }

  getUserName(id: number): Observable<string> {
    return this.getUser(id).pipe(
      map(user => user?.username ?? 'missingNo')
    );
  }

  getUserAvatar(id: number): Observable<string> {
    return this.getUser(id).pipe(
      map(user => user?.photo ?? 'default-avatar.png')
    );
  }

  send() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.newMessage.trim());
    this.newMessage = '';
  }
}
