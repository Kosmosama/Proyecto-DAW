import { Component, computed, signal, viewChild } from '@angular/core';
import { FriendRequestsResponse } from '../../core/interfaces/player.model';
import { FriendListComponent } from "../../shared/components/friend-list/friend-list.component";
import { FriendSearchComponent } from "../../shared/components/friend-search/friend-search.component";

@Component({
  selector: 'friends',
  imports: [FriendListComponent, FriendSearchComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {


  incomingRequests = signal<FriendRequestsResponse>({ data: [] });
  outgoingRequests = signal<FriendRequestsResponse>({ data: [] });

  friendList = viewChild(FriendListComponent);

  incomingRequestsData = computed(() => this.incomingRequests().data);
  outgoingRequestsData = computed(() => this.outgoingRequests().data);


  constructor() {
    this.onRequestUpdate();

  }

  onRequestUpdate() {
    this.friendList()?.loadFriends();
  }

}
