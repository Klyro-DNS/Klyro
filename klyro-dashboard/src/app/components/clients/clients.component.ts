import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/dns.models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Clients</h1>
        <p class="subtitle">Connected DNS clients</p>
      </div>
      <button class="btn" (click)="loadClients()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Refresh
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon clients">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Active Clients</div>
          <div class="stat-value">{{ clients.length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon queries">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Queries</div>
          <div class="stat-value">{{ formatNum(totalQueries) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon qps">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">QPS</div>
          <div class="stat-value">{{ qps }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Client IP</th>
            <th>Total</th>
            <th>A</th>
            <th>AAAA</th>
            <th>CNAME</th>
            <th>MX</th>
            <th>TXT</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          @for (client of clients; track client.ip) {
            <tr>
              <td><code>{{ client.ip }}</code></td>
              <td><strong>{{ client.total_queries }}</strong></td>
              <td>{{ client.queries['A'] || 0 }}</td>
              <td>{{ client.queries['AAAA'] || 0 }}</td>
              <td>{{ client.queries['CNAME'] || 0 }}</td>
              <td>{{ client.queries['MX'] || 0 }}</td>
              <td>{{ client.queries['TXT'] || 0 }}</td>
              <td>{{ timeAgo(client.last_seen) }}</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="8" class="empty">No clients yet</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-header h1 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--text3); font-size: 13px; margin-top: 4px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon svg { width: 22px; height: 22px; }
    .stat-icon.clients { background: rgba(99, 102, 241, .1); color: var(--accent2); }
    .stat-icon.queries { background: rgba(34, 197, 94, .1); color: var(--green); }
    .stat-icon.qps { background: rgba(245, 158, 11, .1); color: var(--orange); }
    .stat-label { font-size: 12px; color: var(--text3); font-weight: 500; margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  totalQueries = 0;
  qps = '0';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadClients(); }

  loadClients() {
    this.api.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.totalQueries = clients.reduce((a, c) => a + c.total_queries, 0);
        this.qps = (this.totalQueries / 3600).toFixed(1);
      }
    });
  }

  formatNum(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }

  timeAgo(dateStr: string): string {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }
}
