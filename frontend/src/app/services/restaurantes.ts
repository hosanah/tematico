/**
 * Serviço de Restaurantes
 * CRUD de restaurantes do sistema
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface Restaurante {
  id?: number;
  nome: string;
  localizacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class RestauranteService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRestaurantes(): Observable<Restaurante[]> {
    return this.http.get<Restaurante[]>(`${this.API_URL}/restaurantes`).pipe(
      catchError(error => {
        console.error('❌ Erro ao listar restaurantes:', error);
        return throwError(() => error);
      })
    );
  }

  getRestaurante(id: number): Observable<Restaurante> {
    return this.http.get<Restaurante>(`${this.API_URL}/restaurantes/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao obter restaurante:', error);
        return throwError(() => error);
      })
    );
  }

  createRestaurante(data: Restaurante): Observable<any> {
    return this.http.post(`${this.API_URL}/restaurantes`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao criar restaurante:', error);
        return throwError(() => error);
      })
    );
  }

  updateRestaurante(id: number, data: Partial<Restaurante>): Observable<any> {
    return this.http.put(`${this.API_URL}/restaurantes/${id}`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao atualizar restaurante:', error);
        return throwError(() => error);
      })
    );
  }

  deleteRestaurante(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/restaurantes/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao deletar restaurante:', error);
        return throwError(() => error);
      })
    );
  }
}
