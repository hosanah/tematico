/**
 * Configuração de rotas do Angular
 * Define navegação entre login e dashboard
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  // Rota raiz - redireciona para dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Rota de login
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },

  // Reset de senha
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  
  // Rota do dashboard (protegida)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // CRUD de usuários
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-list').then(m => m.UserListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/new',
    loadComponent: () => import('./components/users/user-form').then(m => m.UserFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./components/users/user-form').then(m => m.UserFormComponent),
    canActivate: [authGuard]
  },
  
  // Rota 404 - redireciona para dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
