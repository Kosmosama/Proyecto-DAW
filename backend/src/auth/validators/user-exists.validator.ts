import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PlayerService } from 'src/player/player.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUserUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly playerService: PlayerService) { }

    async validate(username: string, args: ValidationArguments): Promise<boolean> {
        const exists = await this.playerService.playerExists(username);
        return !exists;
    }

    defaultMessage(args: ValidationArguments): string {
        return 'User with this username already exists.';
    }
}

export function IsUserUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUserUniqueConstraint,
        });
    };
}