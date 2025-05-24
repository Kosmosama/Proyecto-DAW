import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { SidebarComponent } from "../../../layouts/sidebar/sidebar.component";
import { NavbarComponent } from "../../../layouts/navbar/navbar.component";
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthFeedbackService } from '../../../core/services/auth-feedback.service';
import { ConfirmModalComponent } from "../modals/confirm-modal/confirm-modal.component";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'layout',
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  private feedbackService = inject(AuthFeedbackService);
  private modalService = inject(NgbModal);

  ngOnInit(): void {
    this.sub = this.feedbackService.loginRequired$.subscribe(() => {
      const modalRef = this.modalService.open(ConfirmModalComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });

      modalRef.componentInstance.title = 'Acceso denegado';
      modalRef.componentInstance.body = 'Debes iniciar sesión para acceder a esta sección.';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
