import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../../../layouts/sidebar/sidebar.component";
import { BattleRequestComponent } from "../battle-request/battle-request.component";

@Component({
  selector: 'layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, BattleRequestComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {

  ngOnInit(): void {
  }
}
