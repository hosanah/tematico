/**
 * Lista de Usuários
 * Exibe todos os usuários com ações de edição e exclusão
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UserService, AppUser } from '../../services/users';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Usuários</h2>
        <p-button label="Novo" icon="pi pi-plus" (onClick)="createUser()"></p-button>
      </div>
      <p-table [value]="users" [loading]="isLoading">
        <ng-template pTemplate="header">
          <tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.full_name || user.fullName }}</td>
            <td>
              <p-button icon="pi pi-pencil" rounded text (onClick)="editUser(user.id)"></p-button>
              <p-button icon="pi pi-trash" rounded text severity="danger" (onClick)="deleteUser(user.id)"></p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
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

  deleteUser(id?: number): void {
    if (!id) return;
    if (!confirm('Deseja excluir este usuário?')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário removido' });
        this.loadUsers();
      },
      error: err => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao remover usuário' });
      }
    });
  }
}
