import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    @Length(1, 255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    password: string;
}
