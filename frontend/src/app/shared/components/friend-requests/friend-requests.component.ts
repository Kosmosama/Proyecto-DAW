import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.scss']
})
export class FriendRequestsComponent {
  incomingRequests = signal<any>([]);
  outgoingRequests = signal<any>([]);
  private playerService = inject(PlayerService);

  constructor(){
    this.fetchIncomingRequests();
    this.fetchOutgoingRequests();
  }

  fetchIncomingRequests() {
    this.playerService.fetchIncomingRequests().subscribe({
      next: (requests) => {
        this.incomingRequests.set(requests);
      },
      error: (err) => {
        console.error('Error fetching incoming requests:', err);
      }
    });
  }

  fetchOutgoingRequests() {
    this.playerService.fetchOutgoingRequests().subscribe({
      next: (requests) => {
        this.outgoingRequests.set(requests);
      },
      error: (err) => {
        console.error('Error fetching outgoing requests:', err);
      }
    });
  }

  acceptRequest(id: number) {
    this.playerService.acceptFriendRequest(id).subscribe({
      next: () => {
        this.fetchIncomingRequests();
        this.fetchOutgoingRequests();
      },
      error: (err) => {
        console.error('Error accepting request:', err);
      }
    });
  }

  declineRequest(id: number) {
    this.playerService.declineFriendRequest(id).subscribe({
      next: () => {
        this.fetchIncomingRequests();
        this.fetchOutgoingRequests();
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