import { Component, signal } from '@angular/core';
import { Player } from '../../core/interfaces/player.model';

@Component({
  selector: 'home',
  imports: [],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  player = signal<Player | null>(null);

  ngOnInit(): void {

  }
}
