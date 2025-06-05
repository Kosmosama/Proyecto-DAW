import { IsInt, IsNotEmpty } from 'class-validator';

export class MatchmakingJoinDto {
    @IsNotEmpty()
    @IsInt()
    teamId: number;
}
