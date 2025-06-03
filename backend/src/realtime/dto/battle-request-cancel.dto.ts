import { IsInt } from 'class-validator';

export class BattleRequestCancelDto {
    @IsInt()
    from: number;
}
