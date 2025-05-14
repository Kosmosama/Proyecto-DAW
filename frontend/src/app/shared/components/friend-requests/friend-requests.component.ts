import { Component, inject, input, Signal } from '@angular/core';
import { FriendRequest, FriendRequestsResponse, Player } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent {
  incomingRequests = input.required<Signal<FriendRequest[]>>();
  outgoingRequests = input.required<Signal<FriendRequest[]>>();
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