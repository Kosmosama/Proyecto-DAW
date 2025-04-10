import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsEmail()
    @Length(1, 255)
    @ApiProperty({ description: 'Email address of the player', example: 'player123@gmail.com' })
    email: string;

    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    @ApiProperty({ description: 'assword for the player account', example: 'password123' })
    password: string;
}
