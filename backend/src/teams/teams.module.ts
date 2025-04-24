import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { PlayerService } from 'src/player/player.service';
import { TeamController } from './teams.controller';
import { TeamService } from './teams.service';

@Module({
    imports: [TypeOrmModule.forFeature([Team])],
    controllers: [TeamController],
    providers: [TeamService, PlayerService],
})
export class TeamsModule { }
