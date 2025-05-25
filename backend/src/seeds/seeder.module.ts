import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Friendship } from "src/player/entities/friendship.entity";
import { Player } from "src/player/entities/player.entity";
import { PlayerService } from "src/player/player.service";
import { Team } from "src/teams/entities/team.entity";
import { TeamService } from "src/teams/teams.service";
import { PlayerSeeder } from "./player.seeder";
import { typeOrmAsyncConfig } from "src/config/typeorm.config";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), 
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
        TypeOrmModule.forFeature([Player, Friendship, Team]),
    ],
    providers: [PlayerSeeder, TeamService, PlayerService],
})
export class SeederModule { }