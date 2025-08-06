/**
 * Componente de Dashboard
 * Tela principal protegida com dados do usuário
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';

import { AuthService, User } from '../../services/auth';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    ToastModule,
    AvatarModule,
    MenuModule,
    SkeletonModule
  ],
  providers: [MessageService],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo/Title -->
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-xl font-bold text-gray-900">
                  <i class="pi pi-chart-line mr-2 text-blue-600"></i>
                  Dashboard
                </h1>
              </div>
            </div>

            <!-- User Menu -->
            <div class="flex items-center space-x-4">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900">{{ currentUser?.fullName || currentUser?.username }}</p>
                <p class="text-xs text-gray-500">{{ currentUser?.email }}</p>
              </div>
              
              <p-avatar
                [label]="getUserInitials()"
                styleClass="bg-blue-600 text-white"
                size="normal"
                shape="circle"
              ></p-avatar>

              <p-button
                label="Usuários"
                icon="pi pi-users"
                [text]="true"
                (onClick)="goUsers()"
              ></p-button>

              <p-button
                icon="pi pi-sign-out"
                [text]="true"
                severity="secondary"
                (onClick)="logout()"
                pTooltip="Sair"
                tooltipPosition="bottom"
              ></p-button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Welcome Section -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo, {{ currentUser?.fullName || currentUser?.username }}! 👋
          </h2>
          <p class="text-gray-600">Aqui está um resumo das suas atividades e estatísticas do sistema.</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div *ngFor="let stat of statsCards" class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">{{ stat.title }}</p>
                <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ stat.subtitle }}</p>
              </div>
              <div class="p-3 rounded-full" [ngClass]="stat.iconBg">
                <i [class]="stat.icon + ' text-xl'"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Data Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- System Performance -->
          <p-card header="Performance do Sistema" styleClass="h-full">
            <div class="space-y-4">
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">CPU</span>
                  <span class="text-sm text-gray-500">{{ dashboardData?.charts?.systemPerformance?.cpu || 0 }}%</span>
                </div>
                <p-progressBar 
                  [value]="dashboardData?.charts?.systemPerformance?.cpu || 0"
                  [style]="{'height': '8px'}"
                ></p-progressBar>
              </div>
              
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">Memória</span>
                  <span class="text-sm text-gray-500">{{ dashboardData?.charts?.systemPerformance?.memory || 0 }}%</span>
                </div>
                <p-progressBar 
                  [value]="dashboardData?.charts?.systemPerformance?.memory || 0"
                  [style]="{'height': '8px'}"
                  severity="warning"
                ></p-progressBar>
              </div>
              
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">Disco</span>
                  <span class="text-sm text-gray-500">{{ dashboardData?.charts?.systemPerformance?.disk || 0 }}%</span>
                </div>
                <p-progressBar 
                  [value]="dashboardData?.charts?.systemPerformance?.disk || 0"
                  [style]="{'height': '8px'}"
                  severity="success"
                ></p-progressBar>
              </div>
            </div>
          </p-card>

          <!-- Notifications -->
          <p-card header="Notificações" styleClass="h-full">
            <div class="space-y-3">
              <div *ngFor="let notification of dashboardData?.notifications" 
                   class="flex items-start space-x-3 p-3 rounded-lg border"
                   [ngClass]="{
                     'bg-blue-50 border-blue-200': notification.type === 'info',
                     'bg-green-50 border-green-200': notification.type === 'success',
                     'bg-yellow-50 border-yellow-200': notification.type === 'warning',
                     'bg-red-50 border-red-200': notification.type === 'error'
                   }">
                <i [class]="getNotificationIcon(notification.type)" 
                   [ngClass]="{
                     'text-blue-600': notification.type === 'info',
                     'text-green-600': notification.type === 'success',
                     'text-yellow-600': notification.type === 'warning',
                     'text-red-600': notification.type === 'error'
                   }"></i>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-xs text-gray-600">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDate(notification.timestamp) }}</p>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Recent Activity Table -->
        <p-card header="Atividade Recente">
          <p-table [value]="dashboardData?.recentActivity || []" [loading]="isLoading">
            <ng-template pTemplate="header">
              <tr>
                <th>ID</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Data/Hora</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-activity>
              <tr>
                <td>{{ activity.id }}</td>
                <td>
                  <i class="pi pi-check-circle text-green-600 mr-2"></i>
                  {{ activity.action }}
                </td>
                <td>{{ activity.user }}</td>
                <td>{{ formatDate(activity.timestamp) }}</td>
                <td>
                  <p-tag value="Sucesso" severity="success"></p-tag>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                  <i class="pi pi-info-circle mr-2"></i>
                  Nenhuma atividade encontrada
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </main>
    </div>

    <!-- Toast para notificações -->
    <p-toast></p-toast>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card {
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }
      
      .p-card-header {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        padding: 1rem 1.5rem;
        font-weight: 600;
        color: #374151;
      }
      
      .p-card-body {
        padding: 1.5rem;
      }
      
      .p-table .p-datatable-thead > tr > th {
        background: #f9fafb;
        border-color: #e5e7eb;
        color: #374151;
        font-weight: 600;
        padding: 1rem;
      }
      
      .p-table .p-datatable-tbody > tr > td {
        border-color: #e5e7eb;
        padding: 1rem;
      }
      
      .p-progressbar {
        border-radius: 6px;
        background: #e5e7eb;
      }
      
      .p-progressbar .p-progressbar-value {
        border-radius: 6px;
      }
      
      .p-tag {
        border-radius: 6px;
        font-weight: 500;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dashboardData: any = null;
  isLoading = true;
  statsCards: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Obter usuário atual
    this.currentUser = this.authService.getCurrentUser();
    
    // Carregar dados do dashboard
    this.loadDashboardData();
    
    // Escutar mudanças no estado de autenticação
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentUser = state.user;
        if (!state.isAuthenticated) {
          this.router.navigate(['/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    this.apiService.getDashboardData().subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.setupStatsCards();
        this.isLoading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Dashboard carregado',
          detail: 'Dados atualizados com sucesso'
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao carregar dashboard:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do dashboard'
        });
      }
    });
  }

  setupStatsCards(): void {
    if (!this.dashboardData?.stats) return;
    
    this.statsCards = [
      {
        title: 'Usuários Totais',
        value: this.dashboardData.stats.totalUsers,
        subtitle: 'Usuários cadastrados',
        icon: 'pi pi-users',
        iconBg: 'bg-blue-100 text-blue-600'
      },
      {
        title: 'Usuários Ativos',
        value: this.dashboardData.stats.activeUsers,
        subtitle: 'Online agora',
        icon: 'pi pi-user-plus',
        iconBg: 'bg-green-100 text-green-600'
      },
      {
        title: 'Sessões',
        value: this.dashboardData.stats.totalSessions,
        subtitle: 'Sessões ativas',
        icon: 'pi pi-desktop',
        iconBg: 'bg-yellow-100 text-yellow-600'
      },
      {
        title: 'Uptime',
        value: this.formatUptime(this.dashboardData.stats.serverUptime),
        subtitle: 'Tempo online',
        icon: 'pi pi-clock',
        iconBg: 'bg-purple-100 text-purple-600'
      }
    ];
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const name = this.currentUser.fullName || this.currentUser.username;
    const parts = name.split(' ');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'pi pi-info-circle';
      case 'success': return 'pi pi-check-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'error': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Logout realizado',
          detail: 'Até logo!'
        });
      },
      error: (error) => {
        console.error('Erro no logout:', error);
      }
    });
  }

  goUsers(): void {
    this.router.navigate(['/users']);
  }
}
