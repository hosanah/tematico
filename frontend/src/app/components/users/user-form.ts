/**
 * Formulário de Usuário
 * Usado para criação e edição de usuários
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UserService, AppUser } from '../../services/users';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="p-4">
      <p-card class="max-w-xl mx-auto">
        <h2 class="text-xl font-bold mb-4">{{ isEdit ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
          <div>
            <label class="form-label" for="username">Usuário</label>
            <input pInputText id="username" name="username" [(ngModel)]="user.username" required class="w-full" />
          </div>
          <div>
            <label class="form-label" for="email">Email</label>
            <input pInputText id="email" name="email" [(ngModel)]="user.email" required class="w-full" />
          </div>
          <div>
            <label class="form-label" for="fullName">Nome Completo</label>
            <input pInputText id="fullName" name="fullName" [(ngModel)]="user.fullName" class="w-full" />
          </div>
          <div>
            <label class="form-label" for="password">Senha</label>
            <p-password id="password" name="password" [(ngModel)]="user.password" [feedback]="false" placeholder="Senha" styleClass="w-full" inputStyleClass="w-full" [required]="!isEdit"></p-password>
          </div>
          <p-button type="submit" label="Salvar" [disabled]="!f.valid || isLoading" [loading]="isLoading"></p-button>
          <p-button label="Cancelar" severity="secondary" (onClick)="cancel()" [text]="true"></p-button>
        </form>
      </p-card>
    </div>
  `
})
export class UserFormComponent implements OnInit {
  user: AppUser = { username: '', email: '', fullName: '', password: '' };
  isEdit = false;
  isLoading = false;
  private userId?: number;

  constructor(private userService: UserService, private route: ActivatedRoute, private router: Router, private messageService: MessageService) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.userId = Number(idParam);
      this.loadUser(this.userId);
    }
  }

  loadUser(id: number): void {
    this.userService.getUser(id).subscribe({
      next: data => {
        this.user = { id: data.id, username: data.username, email: data.email, fullName: (data.full_name || data.fullName) } as AppUser;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não encontrado' });
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    const request = this.isEdit && this.userId
      ? this.userService.updateUser(this.userId, this.user)
      : this.userService.createUser(this.user);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário salvo' });
        this.router.navigate(['/users']);
      },
      error: err => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar usuário' });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
