import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    username: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    password: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    photo?: string;
}
