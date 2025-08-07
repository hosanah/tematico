/**
 * Configuração de rotas do Angular
 * Define navegação entre login e dashboard
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { MasterLayoutComponent } from './components/layout/component/master-layout';

export const routes: Routes = [
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

  // Rotas protegidas dentro do layout principal
  {
    path: '',
    component: MasterLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'users', loadComponent: () => import('./components/users/user-list').then(m => m.UserListComponent) },
      { path: 'users/new', loadComponent: () => import('./components/users/user-form').then(m => m.UserFormComponent) },
      { path: 'users/:id', loadComponent: () => import('./components/users/user-form').then(m => m.UserFormComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
