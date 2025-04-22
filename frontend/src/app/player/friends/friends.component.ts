import { Component, inject, signal } from '@angular/core';
import { FriendListComponent } from "../../shared/components/friend-list/friend-list.component";
import { FriendSearchComponent } from "../../shared/components/friend-search/friend-search.component";
import { FriendRequestsComponent } from "../../shared/components/friend-requests/friend-requests.component";
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'friends',
  imports: [FriendListComponent, FriendSearchComponent, FriendRequestsComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {
  incomingRequests = signal<any>([]);
  outgoingRequests = signal<any>([]);
  private playerService = inject(PlayerService);

  constructor() {
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
        console.log('Outgoing Requests:', requests);
      },
      error: (err) => {
        console.error('Error fetching outgoing requests:', err);
      }
    });
  }
}
