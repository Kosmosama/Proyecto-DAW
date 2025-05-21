import { IsInt } from 'class-validator';

export class JoinMatchDto {
    @IsInt()
    teamId: number;
}