/**
 * Serviço de Usuários
 * CRUD de usuários do sistema
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, throwError, map } from 'rxjs';

export interface AppUser {
  id?: number;
  username: string;
  email: string;
  fullName?: string;
  password?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AppUser[]> {
    return this.http.get<any[]>(`${this.API_URL}/users`).pipe(
      map(users =>
        users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          is_active: user.is_active,
        }))
      ),
      catchError(error => {
        console.error('❌ Erro ao listar usuários:', error);
        return throwError(() => error);
      })
    );
  }

  getUser(id: number): Observable<AppUser> {
    return this.http.get<any>(`${this.API_URL}/users/${id}`).pipe(
      map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        is_active: user.is_active,
      })),
      catchError(error => {
        console.error('❌ Erro ao obter usuário:', error);
        return throwError(() => error);
      })
    );
  }

  createUser(data: AppUser): Observable<any> {
    return this.http.post(`${this.API_URL}/users`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao criar usuário:', error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: number, data: AppUser): Observable<any> {
    return this.http.put(`${this.API_URL}/users/${id}`, data).pipe(
      catchError(error => {
        console.error('❌ Erro ao atualizar usuário:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao deletar usuário:', error);
        return throwError(() => error);
      })
    );
  }
}

