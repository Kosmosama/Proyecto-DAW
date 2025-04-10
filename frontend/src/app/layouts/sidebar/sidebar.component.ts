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
    { label: 'Home', link: '#', icon: 'bi bi-house-door' },
    { label: 'Battle', link: '#battle', icon: 'bi bi-controller' },
    { label: 'Ranking', link: '#ranking', icon: 'bi bi-trophy' },
    { label: 'About', link: '#about', icon: 'bi bi-info-circle' },
  ];

  constructor() { }

  ngOnInit(): void { }

  toggleSidebar(): void {
    this.isSidebarVisible.set(!this.isSidebarVisible);
  }

}