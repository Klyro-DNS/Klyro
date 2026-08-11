import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="icon">K</div>
        <div>
          <h1>Klyro DNS</h1>
          <span>DNS Server v1.0</span>
        </div>
      </div>
      <nav class="nav">
        <div class="nav-section">Overview</div>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Dashboard
        </a>
        <div class="nav-section">DNS Management</div>
        <a class="nav-item" routerLink="/zones" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Zones
        </a>
        <a class="nav-item" routerLink="/records" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Records
        </a>
        <div class="nav-section">Monitoring</div>
        <a class="nav-item" routerLink="/clients" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Clients
        </a>
        <a class="nav-item" routerLink="/queries" routerLinkActive="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Query Log
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="user">
          <div class="avatar">{{ (auth.currentUser() || 'A')[0] | uppercase }}</div>
          <div style="flex:1">
            <div style="font-weight:500;color:var(--text)">{{ auth.currentUser() || 'admin' }}</div>
          </div>
          <button class="btn btn-sm btn-danger" (click)="doLogout()" style="padding:4px 8px">Logout</button>
        </div>
      </div>
    </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 260px;
      background: var(--bg2);
      border-right: 1px solid var(--border);
      padding: 20px 0;
      z-index: 50;
      display: flex;
      flex-direction: column;
    }
    .sidebar-logo {
      padding: 0 24px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-logo .icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--accent), var(--green));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }
    .sidebar-logo h1 {
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .sidebar-logo span {
      font-size: 11px;
      color: var(--text3);
      display: block;
      margin-top: 2px;
    }
    .nav {
      flex: 1;
      padding: 0 12px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      color: var(--text2);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all .15s;
      margin-bottom: 2px;
      text-decoration: none;
    }
    .nav-item:hover {
      background: var(--bg3);
      color: var(--text);
    }
    .nav-item.active {
      background: rgba(34, 211, 238, .1);
      color: var(--accent);
    }
    .nav-item svg {
      width: 18px;
      height: 18px;
      opacity: .7;
    }
    .nav-item.active svg {
      opacity: 1;
    }
    .nav-section {
      font-size: 11px;
      font-weight: 600;
      color: var(--text3);
      text-transform: uppercase;
      letter-spacing: .5px;
      padding: 16px 16px 8px;
    }
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }
    .sidebar-footer .user {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text2);
    }
    .sidebar-footer .avatar {
      width: 32px;
      height: 32px;
      background: var(--bg4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent);
    }
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .main {
      margin-left: 260px;
      padding: 24px 32px;
      flex: 1;
    }
  `]
})
export class SidebarComponent {
  constructor(public auth: AuthService) {}

  doLogout() {
    this.auth.logout().subscribe();
  }
}
