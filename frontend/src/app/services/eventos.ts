/**
 * Serviço de Eventos
 * CRUD de eventos do sistema
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface Evento {
  id?: number;
  nome: string;
  data: string;
  hora: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.API_URL}/eventos`).pipe(
      catchError(error => {
        console.error('❌ Erro ao listar eventos:', error);
        return throwError(() => error);
      })
    );
  }

  getEvento(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.API_URL}/eventos/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao obter evento:', error);
        return throwError(() => error);
      })
    );
  }

  createEvento(data: Evento): Observable<any> {
    return this.http.post(`${this.API_URL}/eventos`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao criar evento:', error);
        return throwError(() => error);
      })
    );
  }

  updateEvento(id: number, data: Partial<Evento>): Observable<any> {
    return this.http.put(`${this.API_URL}/eventos/${id}`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao atualizar evento:', error);
        return throwError(() => error);
      })
    );
  }

  deleteEvento(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/eventos/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao deletar evento:', error);
        return throwError(() => error);
      })
    );
  }
}
