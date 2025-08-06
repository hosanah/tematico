/**
 * Componente de Reset de Senha
 * Permite redefinir a senha através do email
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <p-card class="w-full max-w-md">
        <h2 class="text-2xl font-bold mb-4">Redefinir Senha</h2>
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
          <div>
            <label for="email" class="form-label">Email</label>
            <input pInputText id="email" name="email" [(ngModel)]="email" required class="w-full" />
          </div>
          <div>
            <label for="password" class="form-label">Nova Senha</label>
            <p-password [(ngModel)]="password" name="password" required [feedback]="false" placeholder="Nova senha" styleClass="w-full" inputStyleClass="w-full"></p-password>
          </div>
          <p-button type="submit" label="Redefinir" [disabled]="!f.valid || isLoading" [loading]="isLoading" styleClass="w-full"></p-button>
        </form>
      </p-card>
    </div>
  `
})
export class ResetPasswordComponent {
  email = '';
  password = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}

  onSubmit(): void {
    if (!this.email || !this.password) { return; }
    this.isLoading = true;
    this.authService.resetPassword(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Senha redefinida com sucesso' });
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'Erro ao redefinir senha';
        if (err.error?.error) { msg = err.error.error; }
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
      }
    });
  }
}
