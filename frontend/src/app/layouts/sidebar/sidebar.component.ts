import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: `./sidebar.component.scss`
})
export class SidebarComponent implements OnInit {

  isSidebarVisible = signal<boolean>(true);

  sidebarItems: { label: string, link: string, icon: string }[] = [
    { label: 'Home', link: 'pages/home', icon: 'bi bi-house-door' },
    { label: 'Friends', link: 'player/friends', icon: 'bi bi-controller' },
    { label: 'Team Builder', link: 'pages/team-builder', icon: 'bi bi-person-plus' },
  ];

  constructor() { }

  ngOnInit(): void { }

  toggleSidebar(): void {
    this.isSidebarVisible.set(!this.isSidebarVisible);
  }

}