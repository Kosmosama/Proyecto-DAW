import { Component } from '@angular/core';
import { FriendListComponent } from "../../shared/components/friend-list/friend-list.component";
import { FriendSearchComponent } from "../../shared/components/friend-search/friend-search.component";

@Component({
  selector: 'friends',
  imports: [FriendListComponent, FriendSearchComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
})
export class FriendsComponent {

}
