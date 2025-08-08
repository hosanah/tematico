/**
 * Serviço para listar eventos e reservas e vincular ambos
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Reserva {
  id?: number;
  idreservacm?: number;
  numeroreservacm?: string;
  coduh?: string;
  nome_hospede?: string;
  data_checkin?: string;
  data_checkout?: string;
  qtd_hospedes?: number;
}

export interface Evento {
  id?: number;
  nome?: string;
  restaurante?: string;
  data?: string;
}

export interface Disponibilidade {
  capacidade_total: number;
  ocupacao: number;
  vagas_restantes: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaEventoService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReservas(params?: any): Observable<Reserva[]> {
    return this.http.get<any>(`${this.API_URL}/reservas`, { params }).pipe(
      map(res => res.data as Reserva[]),
      catchError(error => {
        console.error('❌ Erro ao listar reservas:', error);
        return throwError(() => error);
      })
    );
  }

  getEventos(params?: any): Observable<Evento[]> {
    return this.http.get<any>(`${this.API_URL}/eventos`, { params }).pipe(
      map(res => res.data as Evento[]),
      catchError(error => {
        console.error('❌ Erro ao listar eventos:', error);
        return throwError(() => error);
      })
    );
  }

  getDisponibilidade(eventoId: number, data: string): Observable<Disponibilidade> {
    return this.http
      .get<Disponibilidade>(`${this.API_URL}/eventos/${eventoId}/disponibilidade`, { params: { data } })
      .pipe(
        catchError(error => {
          console.error('❌ Erro ao obter disponibilidade do evento:', error);
          return throwError(() => error);
        })
      );
  }

  vincular(reservaId: number, eventoId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/eventos/${eventoId}/reservas`, { reservaId }).pipe(
      catchError(error => {
        console.error('❌ Erro ao vincular reserva ao evento:', error);
        return throwError(() => error);
      })
    );
  }
}

