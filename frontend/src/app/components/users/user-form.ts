/**
 * Formulário de Usuário
 * Usado para criação e edição de usuários
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card/card';
import { InputTextModule } from 'primeng/inputtext/inputtext';
import { PasswordModule } from 'primeng/password/password';
import { ButtonModule } from 'primeng/button/button';
import { ToastModule } from 'primeng/toast/toast';
import { MessageService } from 'primeng/api';

import { UserService, AppUser } from '../../services/users';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './user-form.html'
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
        this.user = { id: data.id, username: data.username, email: data.email, fullName: data.fullName } as AppUser;
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
