import { IsNotEmpty, IsString, Length, IsOptional, IsEmail } from 'class-validator';
import { IsEmailUnique } from '../validators/is-email-unique.validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    username: string;

    @IsNotEmpty()
    @IsEmail()
    @Length(1, 255)
    @IsEmailUnique()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    password: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    photo?: string;
}