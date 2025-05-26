import { Component, inject, output, signal } from '@angular/core';
import { FriendRequest } from '../../../../core/interfaces/player.model';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-friend-requests-modal',
  templateUrl: './friend-requests-modal.component.html',
  styleUrls: ['./friend-requests-modal.component.scss']
})
export class FriendRequestsModalComponent {

  incomingRequests = signal<FriendRequest[]>([]);
  outgoingRequests = signal<FriendRequest[]>([]);

  refresh = output<void>();

  private playerService = inject(PlayerService);

  constructor() {
    this.playerService.fetchIncomingRequests().subscribe({
      next: (requests) => {
        this.incomingRequests.set(requests.data);
      }
    });
    this.playerService.fetchOutgoingRequests().subscribe({
      next: (requests) => {
        this.outgoingRequests.set(requests.data);
      }
    });
  }

  acceptRequest(id: number) {
    this.playerService.acceptFriendRequest(id).subscribe({
      next: () => {
        console.log('Request accepted successfully');
        this.refresh.emit();

      },
      error: (err) => {
        console.error('Error accepting request: ', err);
      }
    });
  }

  declineRequest(id: number) {
    this.playerService.declineFriendRequest(id).subscribe({
      next: () => {
        console.log('Request declined successfully');
        this.refresh.emit();
      },
      error: (err) => {
        console.error('Error declining request: ', err);
      }
    });
  }


  //TODO : Uncomment and implement the cancelRequest method if needed
  // cancelRequest(id: number) {
  //   this.playerService.removeFriendRequest(id).subscribe({
  //     next: () => {
  //       this.fetchIncomingRequests();
  //       this.fetchOutgoingRequests();
  //     },
  //     error: (err) => {
  //       console.error('Error removing request:', err);
  //     }
  //   });
  // }

}