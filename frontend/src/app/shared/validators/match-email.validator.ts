import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchEmail(email1Key: string, email2Key: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const email1 = control.get(email1Key);
        const email2 = control.get(email2Key);

        if (!email1 || !email2) {
            return null;
        }

        const error = email1.value === email2.value ? null : { emailsNotMatching: true };

        if (error) {
            email2.setErrors({ ...(email2.errors || {}), emailsNotMatching: true });
        } else {
            if (email2.hasError('emailsNotMatching')) {
                const errors = { ...(email2.errors || {}) };
                delete errors['emailsNotMatching'];
                if (Object.keys(errors).length === 0) {
                    email2.setErrors(null);
                } else {
                    email2.setErrors(errors);
                }
            }
        }

        return error;
    };
}
