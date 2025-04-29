import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamController } from './teams.controller';
import { TeamService } from './teams.service';
import { PlayerModule } from '../player/player.module'; // <<<<< import it

@Module({
    imports: [
        TypeOrmModule.forFeature([Team]),
        PlayerModule,
    ],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TypeOrmModule, TeamService],
})
export class TeamsModule {}
