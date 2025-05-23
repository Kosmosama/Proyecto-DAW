// match-password.validator.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchPassword(password1Key: string, password2Key: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const password1 = group.get(password1Key);
        const password2 = group.get(password2Key);

        if (!password1 || !password2) {
            return null;
        }

        if (password1.value !== password2.value) {
            password2.setErrors({ ...(password2.errors || {}), passwordsNotMatching: true });
            return { matchPassword: true };
        } else {
            if (password2.hasError('passwordsNotMatching')) {
                const errors = { ...(password2.errors || {}) };
                delete errors['passwordsNotMatching'];
                password2.setErrors(Object.keys(errors).length ? errors : null);
            }
            return null;
        }
    };
}