import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { AuthModule } from 'src/auth/auth.module';
import { PlayerModule } from 'src/player/player.module';

@Module({
    imports: [AuthModule, PlayerModule],
    providers: [GameGateway, GameService],
})
export class GameModule { }
