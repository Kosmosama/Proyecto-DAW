import { IsInt } from 'class-validator';

export class MatchmakingJoinDto {
    @IsInt()
    teamId: number;
}
