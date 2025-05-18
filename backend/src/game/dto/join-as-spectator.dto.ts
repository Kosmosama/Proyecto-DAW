import { IsString } from 'class-validator';

export class JoinAsSpectatorDto {
    @IsString()
    room: string;
}