import { Component } from '@angular/core';
import { FriendListComponent } from "../../shared/components/friend-list/friend-list.component";
import { FriendSearchComponent } from "../../shared/components/friend-search/friend-search.component";
import { FriendRequestsComponent } from "../../shared/components/friend-requests/friend-requests.component";

@Component({
  selector: 'friends',
  imports: [FriendListComponent, FriendSearchComponent, FriendRequestsComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {

}
