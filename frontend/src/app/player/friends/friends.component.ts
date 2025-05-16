import { Component, computed, inject, signal } from '@angular/core';
import { FriendRequestsResponse } from '../../core/interfaces/player.model';
import { PlayerService } from '../../core/services/player.service';
import { FriendListComponent } from "../../shared/components/friend-list/friend-list.component";
import { FriendRequestsComponent } from "../../shared/components/friend-requests/friend-requests.component";
import { FriendSearchComponent } from "../../shared/components/friend-search/friend-search.component";
import { Player } from "../../core/interfaces/player.model";

@Component({
  selector: 'friends',
  imports: [FriendListComponent, FriendSearchComponent, FriendRequestsComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {
  incomingRequests = signal<FriendRequestsResponse>({ data: [] });
  outgoingRequests = signal<FriendRequestsResponse>({ data: [] });

  incomingRequestsData = computed(() => this.incomingRequests().data);
  outgoingRequestsData = computed(() => this.outgoingRequests().data);
  private playerService = inject(PlayerService);
  test = signal<Player | null>(null);
  constructor() {
    this.playerService.getProfile().subscribe({
      next: (response) => {
        this.test.set(response);
      },
      error: (error) => {
        console.error('Error fetching player profile:');
      },
    });
    this.fetchIncomingRequests();
    this.fetchOutgoingRequests();
  }

  fetchIncomingRequests() {
    this.playerService.fetchIncomingRequests().subscribe({
      next: (requests) => {
        this.incomingRequests.set(requests);
      },
      error: (err) => {
        console.error('Error fetching incoming requests:');
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
        console.error('Error fetching outgoing requests:');
      }
    });
  }
}
