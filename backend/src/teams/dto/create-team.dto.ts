import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    data: string;

    @IsString()
    @IsOptional()
    format?: string;

    @IsBoolean()
    @IsOptional()
    strict?: boolean;
}