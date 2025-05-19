import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function pokemonNameValidator(validNames: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const name = control.value?.trim().toLowerCase();
        const exists = validNames.some(species => species.toLowerCase() === name);
        return exists ? null : { invalidPokemon: true };
    };
}
