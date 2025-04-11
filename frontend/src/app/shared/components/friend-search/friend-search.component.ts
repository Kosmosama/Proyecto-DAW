import { Component, OnInit } from '@angular/core';
import { signal } from '@angular/core'; // Asegúrate de importar signal
import { PlayerService } from '../../../core/services/player.service';

@Component({
  selector: 'app-friend-search',
  templateUrl: './friend-search.component.html',
  styleUrls: ['./friend-search.component.css']
})
export class FriendSearchComponent implements OnInit {
  allPlayers = signal<Player[]>([]);      // Todos los jugadores (signal)
  friends = signal<Player[]>([]);         // Amigos del usuario (signal)
  filteredPlayers = signal<Player[]>([]); // Jugadores filtrados que no son amigos (signal)
  searchTerm = signal<string>('');        // Término de búsqueda para filtrar jugadores (signal)

  constructor(
    private playerService: PlayerService,
  ) {}

  ngOnInit(): void {
    this.loadPlayers();
    this.loadFriends();
  }

  // Cargar todos los jugadores
  loadPlayers(): void {
    this.playerService.getPlayers().subscribe(
      (data) => {
        this.allPlayers.set(data);
        this.filterPlayers();
      },
      (error) => {
        console.error('Error al cargar los jugadores:', error);
      }
    );
  }

  loadFriends(): void {
    this.playerService.getFriends().subscribe(
      (data) => {
        this.friends.set(data);
        this.filterPlayers();
      },
      (error) => {
        console.error('Error al cargar los amigos:', error);
      }
    );
  }

  // Filtrar jugadores que no son amigos
  filterPlayers(): void {
    const filtered = this.allPlayers().filter(player => 
      !this.friends().some(friend => friend.id === player.id)
    );
    this.filteredPlayers.set(filtered);  // Actualiza los jugadores filtrados con signal.set()
    this.applySearchFilter();            // Aplica el filtro de búsqueda al filtrar jugadores
  }

  // Filtro por término de búsqueda
  applySearchFilter(): void {
    const term = this.searchTerm().toLowerCase();
    if (term.trim() !== '') {
      const filtered = this.filteredPlayers().filter(player =>
        player.username.toLowerCase().includes(term)
      );
      this.filteredPlayers.set(filtered);  // Aplica el filtro de búsqueda
    }
  }

  // Método que se invoca cuando cambia el término de búsqueda
  onSearchTermChange(): void {
    this.applySearchFilter();  // Aplica el filtro cuando el término de búsqueda cambie
  }
}
