/**
 * Componente de Login
 * Tela de autenticação com formulário responsivo
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService, LoginRequest } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <i class="pi pi-lock text-white text-2xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Bem-vindo</h1>
          <p class="text-gray-600">Faça login para acessar o dashboard</p>
        </div>

        <!-- Card de Login -->
        <p-card class="shadow-xl">
          <div class="p-6">
            <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
              <!-- Campo Username -->
              <div class="mb-6">
                <label for="username" class="form-label">
                  <i class="pi pi-user mr-2"></i>
                  Usuário ou Email
                </label>
                <input
                  pInputText
                  id="username"
                  name="username"
                  [(ngModel)]="credentials.username"
                  required
                  class="w-full"
                  placeholder="Digite seu usuário ou email"
                  [disabled]="isLoading"
                />
              </div>

              <!-- Campo Password -->
              <div class="mb-6">
                <label for="password" class="form-label">
                  <i class="pi pi-lock mr-2"></i>
                  Senha
                </label>
                <p-password
                  [(ngModel)]="credentials.password"
                  name="password"
                  required
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Digite sua senha"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  [disabled]="isLoading"
                ></p-password>
              </div>

              <!-- Mensagem de Erro -->
              <div *ngIf="errorMessage" class="mb-4">
                <p-message severity="error" [text]="errorMessage"></p-message>
              </div>

              <!-- Botão de Login -->
              <p-button
                type="submit"
                label="Entrar"
                icon="pi pi-sign-in"
                [loading]="isLoading"
                [disabled]="!loginForm.valid || isLoading"
                styleClass="w-full"
                size="large"
              ></p-button>
            </form>

            <!-- Informações de Teste -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="text-sm font-medium text-blue-800 mb-2">
                <i class="pi pi-info-circle mr-1"></i>
                Credenciais de Teste
              </h3>
              <div class="text-sm text-blue-700">
                <p><strong>Usuário:</strong> admin</p>
                <p><strong>Senha:</strong> admin123</p>
              </div>
            </div>
          </div>
        </p-card>

        <!-- Footer -->
        <div class="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 Fullstack App. Desenvolvido com Angular + Node.js</p>
        </div>
      </div>
    </div>

    <!-- Toast para notificações -->
    <p-toast></p-toast>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card {
        border-radius: 12px;
        border: none;
      }
      
      .p-card-body {
        padding: 0;
      }
      
      .p-inputtext {
        border-radius: 8px;
        border: 1px solid #d1d5db;
        padding: 12px;
        font-size: 14px;
      }
      
      .p-inputtext:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .p-password input {
        border-radius: 8px;
        border: 1px solid #d1d5db;
        padding: 12px;
        font-size: 14px;
      }
      
      .p-password input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .p-button {
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .p-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      
      .p-message {
        border-radius: 8px;
        border: none;
        padding: 12px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Obter URL de retorno dos query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Se já estiver autenticado, redirecionar
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Login realizado!',
          detail: `Bem-vindo, ${response.user.fullName || response.user.username}!`
        });

        // Redirecionar após pequeno delay para mostrar a mensagem
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        
        let errorMsg = 'Erro ao fazer login. Tente novamente.';
        
        if (error.error?.error) {
          errorMsg = error.error.error;
        } else if (error.status === 401) {
          errorMsg = 'Credenciais inválidas. Verifique seu usuário e senha.';
        } else if (error.status === 0) {
          errorMsg = 'Erro de conexão. Verifique se o servidor está rodando.';
        }
        
        this.showError(errorMsg);
      }
    });
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: message
    });
  }
}
