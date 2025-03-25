import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreatePlayerDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    name: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    passwordHash: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    photo?: string;
}
