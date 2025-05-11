import { Directive, output } from '@angular/core';

@Directive({
  selector: 'input[type=file][encodeBase64]',
  standalone: true,
  host: {
    '(change)': 'encode($event)',
  },
})
export class EncodeBase64Directive {
  encoded = output<string>();

  encode(event: Event) {
    const imgInput = event.target as HTMLInputElement;
    if (!imgInput.files || imgInput.files.length === 0) {
      return;
    }
    const reader: FileReader = new FileReader();
    reader.readAsDataURL(imgInput.files[0]);
    reader.addEventListener('loadend', () => {
      this.encoded.emit(reader.result as string);
    });
  }
}