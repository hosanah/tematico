import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

import { ReservaEventoService, Reserva, Evento, Disponibilidade } from '../../services/reserva-evento.service';

@Component({
  selector: 'app-reserva-evento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    AutoCompleteModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    ChartModule,
    CardModule,
  ],
  providers: [MessageService],
  templateUrl: './reserva-evento.html',
  styleUrls: ['./reserva-evento.scss'],
})
export class ReservaEventoComponent {
  reservas: Reserva[] = [];
  reservaSelecionada?: Reserva;

  dataEvento?: Date | null;
  eventos: Evento[] = [];
  eventoSelecionado?: Evento;

  disponibilidade?: Disponibilidade;
  chartData?: any;

  informacoes = '';
  quantidade?: number;

  constructor(private service: ReservaEventoService, private message: MessageService) {}

  buscarReserva(event: any): void {
    const codigo = event.query;
    if (!codigo) {
      this.reservas = [];
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];
    this.service.buscarReservaValida(codigo, hoje).subscribe({
      next: r => (this.reservas = r ? [r] : []),
      error: () => (this.reservas = []),
    });
  }

  selecionarData(): void {
    if (!this.dataEvento) {
      this.eventos = [];
      this.eventoSelecionado = undefined;
      return;
    }
    const data = this.dataEvento.toISOString().split('T')[0];
    this.service.getEventosPorData(data).subscribe({
      next: evs => {
        this.eventos = evs;
        this.eventoSelecionado = undefined;
        this.disponibilidade = undefined;
        this.chartData = undefined;
      },
    });
  }

  onEventoChange(): void {
    if (!this.eventoSelecionado?.id) {
      this.disponibilidade = undefined;
      this.chartData = undefined;
      return;
    }
    this.service.getDisponibilidade(this.eventoSelecionado.id).subscribe({
      next: info => {
        this.disponibilidade = info;
        this.chartData = {
          labels: ['Reservas', 'Vagas'],
          datasets: [
            {
              data: [info.ocupacao, info.vagas_restantes],
              backgroundColor: ['#EF4444', '#10B981'],
            },
          ],
        };
      },
      error: () => {
        this.disponibilidade = undefined;
        this.chartData = undefined;
      },
    });
  }

  salvarMarcacao(): void {
    if (!this.reservaSelecionada || !this.eventoSelecionado || !this.quantidade) {
      this.message.add({ severity: 'error', summary: 'Erro', detail: 'Preencha todos os campos' });
      return;
    }
    if (this.disponibilidade && this.quantidade > this.disponibilidade.vagas_restantes) {
      this.message.add({ severity: 'error', summary: 'Erro', detail: 'Quantidade excede vagas disponíveis' });
      return;
    }
    const payload = {
      reservaId: this.reservaSelecionada.id!,
      informacoes: this.informacoes,
      quantidade: this.quantidade,
    };
    this.service.marcar(this.eventoSelecionado.id!, payload).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Sucesso', detail: 'Marcação salva' });
        this.informacoes = '';
        this.quantidade = undefined;
        this.onEventoChange();
      },
      error: err => {
        const detail = err.error?.error || 'Falha ao salvar marcação';
        this.message.add({ severity: 'error', summary: 'Erro', detail });
      },
    });
  }
}

