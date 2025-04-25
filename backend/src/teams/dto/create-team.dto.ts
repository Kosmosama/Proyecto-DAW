import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsObject()
    data: any;
}
