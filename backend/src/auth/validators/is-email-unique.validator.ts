import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { PlayerService } from 'src/player/player.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly playerService: PlayerService) { }

    async validate(email: string, args: ValidationArguments): Promise<boolean> {
        const exists = await this.playerService.userExistsBy({ username: email });
        return !exists;
    }

    defaultMessage(args: ValidationArguments): string {
        return 'Account with this email already exists.';
    }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsEmailUniqueConstraint,
        });
    };
}
