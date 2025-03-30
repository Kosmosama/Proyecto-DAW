import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    username: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    password: string;
}
