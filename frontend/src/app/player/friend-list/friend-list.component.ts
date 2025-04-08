import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/interfaces/player.interface';

@Component({
  selector: 'app-friends-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css']
})
export class FriendListComponent implements OnInit {
  loading: boolean = true;
  errorMessage: string | null = null;
  friends: Player[] = [];

  constructor(private playerService: PlayerService) { }

  ngOnInit(): void {
    this.getFriends();
  }

  getFriends(): void {
    this.playerService.getFriends().subscribe(
      (friends) => {
        this.friends = friends;
        this.loading = false;
      }
    );
  }
}
