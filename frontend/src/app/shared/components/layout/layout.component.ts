import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../../../layouts/navbar/navbar.component";
import { SidebarComponent } from "../../../layouts/sidebar/sidebar.component";

@Component({
  selector: 'layout',
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {

  ngOnInit(): void {
  }
}
