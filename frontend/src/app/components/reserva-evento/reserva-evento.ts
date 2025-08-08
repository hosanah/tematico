/**
 * Componente de vinculação de reservas a eventos
 * Lista eventos e reservas, permite filtrar e realizar a vinculação
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ReservaEventoService, Reserva, Evento } from '../../services/reserva-evento';
import { extractErrorMessage } from '../../utils';

@Component({
  selector: 'app-reserva-evento',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, SelectModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './reserva-evento.html',
  styleUrls: ['./reserva-evento.scss']
})
export class ReservaEventoComponent implements OnInit {
  reservas: Reserva[] = [];
  eventos: Evento[] = [];

  // seleção para vinculação
  reservaSelecionada?: Reserva;
  eventoSelecionado?: Evento;

  constructor(private reservaEventoService: ReservaEventoService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  carregarEventos(): void {
    this.reservaEventoService.getEventos().subscribe({
      next: data => (this.eventos = data)
    });
  }

  filtrarReserva(event: any): void {
    const coduh = event.filter;
    if (!coduh) {
      this.reservas = [];
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];
    this.reservaEventoService
      .buscarReserva(coduh, hoje, hoje)
      .subscribe({ next: res => (this.reservas = res ? [res] : []) });
  }

  mostrarDetalhes(): void {
    if (this.reservaSelecionada) {
      const r = this.reservaSelecionada;
      const detail = `Hóspede: ${r.nome_hospede} - Check-in: ${r.data_checkin} - Check-out: ${r.data_checkout}`;
      this.messageService.add({ severity: 'info', summary: 'Reserva selecionada', detail });
    }
  }

  vincular(): void {
    if (!this.reservaSelecionada || !this.eventoSelecionado) return;
    this.reservaEventoService
      .vincular(this.reservaSelecionada.id!, this.eventoSelecionado.id!)
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Reserva vinculada ao evento' });
          this.carregarEventos();
        },
        error: err => {
          let detail = 'Falha ao vincular reserva';
          const msg = extractErrorMessage(err);
          if (msg.toLowerCase().includes('capacidade')) {
            detail = 'Capacidade do evento excedida';
          } else if (msg.toLowerCase().includes('restaurante')) {
            detail = 'Não é permitido múltiplos restaurantes no mesmo dia';
          } else if (msg.toLowerCase().includes('duração')) {
            detail = 'Limite de eventos por duração excedido';
          }
          this.messageService.add({ severity: 'error', summary: 'Erro', detail });
        }
      });
  }
}

