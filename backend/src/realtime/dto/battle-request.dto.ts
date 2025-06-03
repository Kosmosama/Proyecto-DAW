import { IsInt } from 'class-validator';

export class BattleRequestDto {
    @IsInt()
    to: number;

    @IsInt()
    teamId: number;
}
