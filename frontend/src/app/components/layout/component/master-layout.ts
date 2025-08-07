import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

import { AuthService, User } from '../../services/auth';

@Component({
  selector: 'app-master-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule],
  templateUrl: './master-layout.html',
  styleUrls: ['./master-layout.scss'],
})
export class MasterLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentUser = state.user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  logout(): void {
    this.authService.logout().subscribe();
  }
}
