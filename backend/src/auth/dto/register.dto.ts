import { IsNotEmpty, IsString, Length, IsOptional, IsEmail } from 'class-validator';
import { IsEmailUnique } from '../validators/is-email-unique.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    @ApiProperty({ description: 'Username of the player', example: 'player123' })
    username: string;

    @IsNotEmpty()
    @IsEmail()
    @Length(1, 255)
    @IsEmailUnique()
    @ApiProperty({ description: 'Email address of the player', example: 'player123@gmail.com' })
    email: string;
    
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    @ApiProperty({ description: 'Password for the player account', example: 'password123' })
    password: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    @ApiPropertyOptional({
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...',
        description: 'Base64-encoded avatar image (optional)',
    })
    photo?: string;
}