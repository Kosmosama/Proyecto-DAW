import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-cat-modal',
  templateUrl: './cat-modal.component.html',
  styleUrls: ['./cat-modal.component.scss']
})
export class CatModalComponent {
  @Input() message: string = '';
  @Input() catImageUrl: string = '';

  constructor(public activeModal: NgbActiveModal) {}
}
