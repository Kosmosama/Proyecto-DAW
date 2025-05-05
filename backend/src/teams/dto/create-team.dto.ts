import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    data: string; // Raw Showdown-style team string

    @IsOptional()
    @IsString()
    format?: string; // e.g., "gen9ou"
}
