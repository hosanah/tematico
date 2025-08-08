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
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';

import { ReservaEventoService, Reserva, Evento } from '../../services/reserva-evento';
import { extractErrorMessage } from '../../utils';

@Component({
  selector: 'app-reserva-evento',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, SelectModule, DatePickerModule, ButtonModule, ToastModule, ChartModule],
  providers: [MessageService],
  templateUrl: './reserva-evento.html',
  styleUrls: ['./reserva-evento.scss']
})
export class ReservaEventoComponent implements OnInit {
  reservas: Reserva[] = [];
  eventos: Evento[] = [];

  // filtros
  filtroRestaurante?: number;
  filtroEvento?: number;
  filtroData?: Date | null;

  // seleção para vinculação
  reservaSelecionada?: Reserva;
  eventoSelecionado?: Evento;

  // formulário direita
  dataReserva?: Date | null;
  informacoes = '';
  quantidade?: number;
  chartData: any;

  constructor(private reservaEventoService: ReservaEventoService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    const filtros: any = {
      restaurante: this.filtroRestaurante,
      evento: this.filtroEvento,
      data: this.filtroData ? this.filtroData.toISOString().split('T')[0] : undefined
    };

    this.reservaEventoService.getReservas(filtros).subscribe({
      next: data => (this.reservas = data)
    });

    this.reservaEventoService.getEventos(filtros).subscribe({
      next: data => (this.eventos = data)
    });
  }

  aplicarFiltros(): void {
    this.carregarDados();
  }

  vincular(): void {
    if (!this.reservaSelecionada || !this.eventoSelecionado) return;
    this.reservaEventoService
      .vincular(this.reservaSelecionada.id!, this.eventoSelecionado.id!)
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Reserva vinculada ao evento' });
          this.carregarDados();
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

  consultarDisponibilidade(): void {
    if (!this.eventoSelecionado?.id || !this.dataReserva) return;
    const data = this.dataReserva.toISOString().split('T')[0];
    this.reservaEventoService.getDisponibilidadeEvento(this.eventoSelecionado.id, data).subscribe({
      next: info => {
        const vagas = info.capacidade - info.ocupacao;
        this.chartData = {
          labels: ['Vagas', 'Ocupado'],
          datasets: [
            {
              data: [vagas, info.ocupacao],
              backgroundColor: ['#4CAF50', '#FF5252']
            }
          ]
        };
      }
    });
  }

  salvar(): void {
    if (!this.eventoSelecionado?.id) return;
    const payload = {
      informacoes: this.informacoes,
      quantidade: this.quantidade ?? 0
    };
    this.reservaEventoService.salvarReservaEvento(this.eventoSelecionado.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Reserva salva' });
        this.informacoes = '';
        this.quantidade = undefined;
        this.chartData = undefined;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar reserva' })
    });
  }
}

