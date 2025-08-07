/**
 * Lista de Usuários
 * Exibe todos os usuários com ações de edição e ativação/desativação
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { UserService, AppUser } from '../../services/users';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToastModule, TagModule],
  providers: [MessageService],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {
  users: AppUser[] = [];
  isLoading = false;

  constructor(private userService: UserService, private router: Router, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: data => {
        this.users = data;
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar usuários' });
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/users/new']);
  }

  editUser(id?: number): void {
    if (id) this.router.navigate(['/users', id]);
  }

  toggleActive(user: AppUser): void {
    if (!user.id) return;
    const action = user.is_active ? 'desativar' : 'reativar';
    if (!confirm(`Deseja ${action} este usuário?`)) return;
    const request = user.is_active
      ? this.userService.deleteUser(user.id)
      : this.userService.updateUser(user.id, { is_active: true });

    request.subscribe({
      next: () => {
        const detail = user.is_active ? 'Usuário desativado' : 'Usuário reativado';
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail });
        this.loadUsers();
      },
      error: () => {
        const detail = user.is_active ? 'Falha ao desativar usuário' : 'Falha ao reativar usuário';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }
}
