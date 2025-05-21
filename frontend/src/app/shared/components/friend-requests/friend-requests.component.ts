import { Component, inject, input, output } from '@angular/core';
import { FriendRequest } from '../../../core/interfaces/player.model';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent {

  incomingRequests = input.required<FriendRequest[]>();
  outgoingRequests = input.required<FriendRequest[]>();

  refresh = output<void>();

  private playerService = inject(PlayerService);


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