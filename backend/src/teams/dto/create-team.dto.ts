import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { TeamDto } from './team.dto';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @ValidateNested()
    @Type(() => TeamDto)
    data: TeamDto;
}