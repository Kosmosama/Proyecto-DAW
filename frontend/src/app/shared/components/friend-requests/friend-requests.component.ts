import { Component, inject, input, Signal, signal } from '@angular/core';
import { PlayerService } from '../../../core/services/player.service';
import { Player } from '../../../core/interfaces/player.interface';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent {
  incomingRequests = input.required<Player[]>();
  outgoingRequests = input.required<Player[]>();
  refreshIncomingRequests = input<() => void>();
  refreshOutgoingRequests = input<() => void>();
  private playerService = inject(PlayerService);


  acceptRequest(id: number) {
    this.playerService.acceptFriendRequest(id).subscribe({
      next: () => {
        this.refreshIncomingRequests();
        this.refreshOutgoingRequests();
      },
      error: (err) => {
        console.error('Error accepting request:', err);
      }
    });
  }

  declineRequest(id: number) {
    this.playerService.declineFriendRequest(id).subscribe({
      next: () => {
        this.refreshIncomingRequests();
        this.refreshOutgoingRequests();
      },
      error: (err) => {
        console.error('Error declining request:', err);
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