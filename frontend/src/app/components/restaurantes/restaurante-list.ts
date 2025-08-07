/**
 * Lista de Restaurantes
 * Exibe restaurantes com ações básicas
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { RestauranteService, Restaurante } from '../../services/restaurantes';

@Component({
  selector: 'app-restaurante-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './restaurante-list.html',
  styleUrls: ['./restaurante-list.scss']
})
export class RestauranteListComponent implements OnInit {
  restaurantes: Restaurante[] = [];

  constructor(
    private service: RestauranteService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getRestaurantes().subscribe({
      next: data => this.restaurantes = data,
      error: err => this.showError('Erro ao carregar restaurantes', err)
    });
  }

  novo(): void {
    this.router.navigate(['/restaurantes/novo']);
  }

  editar(id?: number): void {
    if (id) {
      this.router.navigate(['/restaurantes', id]);
    }
  }

  excluir(id?: number): void {
    if (!id) return;
    this.service.deleteRestaurante(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Restaurante removido' });
        this.load();
      },
      error: err => this.showError('Erro ao remover restaurante', err)
    });
  }

  private showError(summary: string, err: any): void {
    let detail = 'Falha na operação';
    if (err.status >= 400 && err.status < 500) {
      detail = err.error?.message || 'Requisição inválida';
    }
    this.messageService.add({ severity: 'error', summary, detail });
  }
}
