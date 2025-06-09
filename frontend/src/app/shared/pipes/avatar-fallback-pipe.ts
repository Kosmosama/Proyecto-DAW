import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'avatarFallback' })
export class AvatarFallbackPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || value === 'default-avatar.png') {
      return '/images/icons/default-avatar.jpg';
    }
    return '/images/avatars/' + value;
  }
}