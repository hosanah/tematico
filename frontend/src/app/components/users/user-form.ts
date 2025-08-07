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
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnInit {
  user: AppUser = { username: '', email: '', fullName: '', password: '', is_active : true };
  isEdit = false;
  isLoading = false;
  private userId?: number;
  private readonly strongPassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

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
        const fullName = data.fullName || (data as any).full_name;
        this.user = {
          id: data.id,
          username: data.username,
          email: data.email,
          fullName,
          is_active: data.is_active
        } as AppUser;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Usuário não encontrado' });
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit(): void {
    this.isLoading = true;

    // Verifica força da senha quando criando usuário ou alterando senha
    const needsValidation = !this.isEdit || !!this.user.password;
    if (needsValidation && !this.strongPassword.test(this.user.password || '')) {
      this.isLoading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha fraca',
        detail: 'Senha deve ter pelo menos 8 caracteres, incluir letra maiúscula e caractere especial'
      });
      return;
    }

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
