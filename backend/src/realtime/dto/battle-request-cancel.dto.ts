import { IsInt, IsNotEmpty } from 'class-validator';

export class BattleRequestCancelDto {
    @IsNotEmpty()
    @IsInt()
    from: number;
}
