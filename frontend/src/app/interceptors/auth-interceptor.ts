/**
 * Interceptor HTTP para autenticação
 * Adiciona automaticamente o token JWT nas requisições
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Obter token do serviço de autenticação
  const token = authService.getToken();
  
  // Clonar a requisição e adicionar o header Authorization se o token existir
  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Processar a requisição e tratar erros de autenticação
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se receber erro 401 (Unauthorized), fazer logout automático
      if (error.status === 401) {
        console.log('❌ Token inválido ou expirado - fazendo logout automático');
        authService.logout().subscribe({
          error: (logoutError) => {
            console.error('Erro no logout automático:', logoutError);
          }
        });
      }
      
      return throwError(() => error);
    })
  );
};
