import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <img src="logo-horizontal.png" alt="Klyro" class="logo-img">
            <span class="logo-text">Klyro DNS</span>
          </div>
        </div>
        <nav class="nav">
          <div class="nav-group">
            <div class="nav-label">Overview</div>
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              <span>Dashboard</span>
            </a>
          </div>
          <div class="nav-group">
            <div class="nav-label">DNS Management</div>
            <a class="nav-item" routerLink="/zones" routerLinkActive="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>Zones</span>
            </a>
            <a class="nav-item" routerLink="/records" routerLinkActive="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Records</span>
            </a>
          </div>
          <div class="nav-group">
            <div class="nav-label">Monitoring</div>
            <a class="nav-item" routerLink="/clients" routerLinkActive="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Clients</span>
            </a>
            <a class="nav-item" routerLink="/queries" routerLinkActive="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span>Query Log</span>
            </a>
          </div>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="avatar">{{ (auth.currentUser() || 'A')[0] | uppercase }}</div>
            <div class="user-details">
              <div class="user-name">{{ auth.currentUser() || 'admin' }}</div>
            </div>
          </div>
          <button class="btn-logout" (click)="doLogout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
    <!-- Toast notifications -->
    @for (toast of api.toasts(); track toast.id) {
      <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
        {{ toast.message }}
      </div>
    }
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 240px;
      background: var(--bg2);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 50;
    }
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-img {
      height: 28px;
      width: auto;
    }
    .logo-text {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
    }
    .nav {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
    }
    .nav-group {
      margin-bottom: 8px;
    }
    .nav-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text3);
      text-transform: uppercase;
      letter-spacing: .5px;
      padding: 8px 12px 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text2);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all .15s;
      text-decoration: none;
      margin-bottom: 2px;
    }
    .nav-item:hover {
      background: var(--bg3);
      color: var(--text);
    }
    .nav-item.active {
      background: rgba(99, 102, 241, .1);
      color: var(--accent2);
    }
    .nav-item svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      opacity: .7;
    }
    .nav-item.active svg {
      opacity: 1;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      width: 32px;
      height: 32px;
      background: var(--bg4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent2);
    }
    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }
    .btn-logout {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text3);
      cursor: pointer;
      transition: all .2s;
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, .1);
      border-color: rgba(239, 68, 68, .2);
      color: #fca5a5;
    }
    .btn-logout svg {
      width: 16px;
      height: 16px;
    }
    .main {
      margin-left: 240px;
      padding: 28px 32px;
      flex: 1;
      min-height: 100vh;
    }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService, public api: ApiService) {}

  doLogout() {
    this.auth.logout().subscribe();
  }
}
