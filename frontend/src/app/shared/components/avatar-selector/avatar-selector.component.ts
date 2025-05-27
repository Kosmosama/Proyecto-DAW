import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'avatar-selector',
  standalone: true,
  imports: [],
  templateUrl: './avatar-selector.component.html',
  styleUrl: './avatar-selector.component.scss',
})
export class AvatarSelectorComponent {
  private playerService = inject(PlayerService);
  private destroyRef = inject(DestroyRef);

  avatars = signal<string[]>([]);
  selectedAvatar = input.required<string | null>();
  avatarSelected = output<string>();

  constructor() {
    this.playerService
      .fetchAvatarImages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((avatars: string[]) => {
        this.avatars.set(avatars.map(name => name.replace('.jpg', '.jpg')));
      });
  }

  selectAvatar(avatar: string) {
    this.avatarSelected.emit(avatar);
  }
}
