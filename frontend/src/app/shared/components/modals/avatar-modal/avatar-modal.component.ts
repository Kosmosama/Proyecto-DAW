import { Component, inject, input, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AvatarSelectorComponent } from '../../avatar-selector/avatar-selector.component';

@Component({
  selector: 'avatar-edit-modal',
  standalone: true,
  imports: [AvatarSelectorComponent],
  templateUrl: './avatar-modal.component.html',
})
export class AvatarModalComponent {

  currentAvatar = input<string>('');

  private modal = inject(NgbActiveModal);

  selectedAvatar = signal<string>('');

  constructor() {
    this.selectedAvatar.set(this.currentAvatar());
  }

  onAvatarSelected(avatar: string) {
    this.selectedAvatar.set(avatar);
  }

  save() {
    if (this.selectedAvatar()) {
      this.modal.close(this.selectedAvatar());
    }
  }

  cancel() {
    this.modal.dismiss();
  }
}
