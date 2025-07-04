import { IsInt, IsNotEmpty } from 'class-validator';

export class BattleRequestDto {
    @IsNotEmpty()
    @IsInt()
    to: number;

    @IsNotEmpty()
    @IsInt()
    teamId: number;
}
