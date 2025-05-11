import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'sidebar',
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: `./sidebar.component.scss`
})
export class SidebarComponent implements OnInit {

  isSidebarVisible = signal<boolean>(true);

  sidebarItems: { label: string, link: string, icon: string }[] = [
    { label: 'Home', link: 'pages/home', icon: 'bi bi-house-door' },
    { label: 'Friends', link: 'player/friends', icon: 'bi bi-controller' },
  ];

  constructor() { }

  ngOnInit(): void { }

  toggleSidebar(): void {
    this.isSidebarVisible.set(!this.isSidebarVisible);
  }

}