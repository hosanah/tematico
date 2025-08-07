/**
 * Serviço de Reservas
 * CRUD de reservas do sistema
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface Reserva {
  id?: number;
  nome: string;
  data: string;
  hora: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.API_URL}/reservas`).pipe(
      catchError(error => {
        console.error('❌ Erro ao listar reservas:', error);
        return throwError(() => error);
      })
    );
  }

  getReserva(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.API_URL}/reservas/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao obter reserva:', error);
        return throwError(() => error);
      })
    );
  }

  createReserva(data: Reserva): Observable<any> {
    return this.http.post(`${this.API_URL}/reservas`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao criar reserva:', error);
        return throwError(() => error);
      })
    );
  }

  updateReserva(id: number, data: Partial<Reserva>): Observable<any> {
    return this.http.put(`${this.API_URL}/reservas/${id}`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao atualizar reserva:', error);
        return throwError(() => error);
      })
    );
  }

  deleteReserva(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/reservas/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao deletar reserva:', error);
        return throwError(() => error);
      })
    );
  }
}
