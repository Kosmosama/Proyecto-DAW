  import { Component, inject, ViewChild } from '@angular/core';
  import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
  import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

  @Component({
    selector: 'auth-modal',
    standalone: true,
    imports: [],
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.scss'],
  })
  export class AuthModalComponent {
    title = ''; 
    body = '';

    activeModal = inject(NgbActiveModal);
    
    private modalService = inject(NgbModal);
    private router = inject(Router);
    
    private saved = false;


    @ViewChild('addForm', { static: false }) addForm!: NgForm;

    canDeactivate(): boolean | Promise<boolean> {
      if (this.saved || this.addForm?.pristine) {
        return true;
      }

      const modalRef = this.modalService.open(AuthModalComponent);
      modalRef.componentInstance.title = 'Login required';
      modalRef.componentInstance.body = 'Please login with your account';

      return modalRef.result.catch(() => false);
    }
      goToLogin() {
    this.activeModal.close();
    this.router.navigate(['/auth/login']);
  }
  }