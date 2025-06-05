import { IsInt, IsNotEmpty } from 'class-validator';

export class BattleRequestAcceptDto {
    @IsNotEmpty()
    @IsInt()
    from: number;

    @IsNotEmpty()
    @IsInt()
    teamId: number;
}
