import { Component, signal } from '@angular/core';
import { Player } from '../../core/interfaces/player.model';
import { StatusSocketService } from '../../core/services/statusSocket.service';

@Component({
  selector: 'home',
  imports: [],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  player = signal<Player | null>(null);

  constructor(private statusSocket: StatusSocketService) {

  }


  ngOnInit(): void {

  }
}
