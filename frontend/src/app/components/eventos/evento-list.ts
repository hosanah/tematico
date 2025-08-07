/**
 * Lista de Eventos
 * Exibe eventos com ações básicas
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { EventoService, Evento } from '../../services/eventos';

@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './evento-list.html',
  styleUrls: ['./evento-list.scss']
})
export class EventoListComponent implements OnInit {
  eventos: Evento[] = [];

  constructor(
    private service: EventoService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getEventos().subscribe({
      next: data => this.eventos = data,
      error: err => this.showError('Erro ao carregar eventos', err)
    });
  }

  novo(): void {
    this.router.navigate(['/eventos/novo']);
  }

  editar(id?: number): void {
    if (id) {
      this.router.navigate(['/eventos', id]);
    }
  }

  excluir(id?: number): void {
    if (!id) return;
    this.service.deleteEvento(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Evento removido' });
        this.load();
      },
      error: err => this.showError('Erro ao remover evento', err)
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
