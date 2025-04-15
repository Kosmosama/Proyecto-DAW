import { Socket } from 'socket.io';
import { PlayerPublic } from 'src/player/interfaces/player-public.interface';

export interface SocketWithUser extends Socket {
  user: PlayerPublic;
}
