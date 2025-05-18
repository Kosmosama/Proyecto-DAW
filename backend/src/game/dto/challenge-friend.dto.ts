import { IsInt } from 'class-validator';

export class ChallengeFriendDto {
    @IsInt()
    targetId: number;
}