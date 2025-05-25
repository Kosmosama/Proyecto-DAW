import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class TeamDto {
    @IsString()
    @IsNotEmpty()
    team: string;

    @IsString()
    @IsOptional()
    format?: string;

    @IsBoolean()
    @IsOptional()
    strict?: boolean;
}