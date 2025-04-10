import { Component } from '@angular/core';
import { SidebarComponent } from "../../../layouts/sidebar/sidebar.component";
import { NavbarComponent } from "../../../layouts/navbar/navbar.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout',
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: `./layout.component.scss`,
  standalone: true,
})
export class LayoutComponent {

}
