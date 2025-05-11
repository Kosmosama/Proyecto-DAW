import { Component, inject, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  title = ''; 
  body = '';

  activeModal = inject(NgbActiveModal);
  #modalService = inject(NgbModal);
  #saved = false;

  @ViewChild('addForm', { static: false }) addForm!: NgForm;

  canDeactivate(): boolean | Promise<boolean> {
    if (this.#saved || this.addForm?.pristine) {
      return true;
    }

    const modalRef = this.#modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Changes not saved';
    modalRef.componentInstance.body = 'Do you want to leave the page?';

    return modalRef.result.catch(() => false);
  }
}