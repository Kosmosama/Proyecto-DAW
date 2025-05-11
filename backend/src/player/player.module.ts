import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { Player } from './entities/player.entity';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Player, Friendship]),
    ],
    controllers: [PlayerController],
    providers: [PlayerService],
    exports: [TypeOrmModule, PlayerService],
})
export class PlayerModule { }
