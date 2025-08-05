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
  
  // Rota do dashboard (protegida)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  
  // Rota 404 - redireciona para dashboard
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
