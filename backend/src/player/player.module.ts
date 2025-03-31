import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { Friendship } from './entities/friendship.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        TypeOrmModule.forFeature([Player, Friendship]),
        JwtModule.register({}),
    ],
    controllers: [PlayerController],
    providers: [PlayerService],
    exports: [TypeOrmModule],
})
export class PlayerModule { }
