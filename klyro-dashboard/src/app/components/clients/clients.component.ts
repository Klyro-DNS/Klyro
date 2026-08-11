import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Client } from '../../models/dns.models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="topbar">
      <div>
        <h2>Clients</h2>
        <div class="subtitle">Connected DNS clients</div>
      </div>
      <button class="btn" (click)="loadClients()">Refresh</button>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">Active Clients</div>
          <div class="value">{{ clients.length }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">Total Queries</div>
          <div class="value">{{ formatNum(totalQueries) }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="label">QPS</div>
          <div class="value">{{ qps }}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <table class="table mb-0">
        <thead>
          <tr>
            <th>Client IP</th>
            <th>Total Queries</th>
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
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .topbar h2 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--text3); font-size: 13px; margin-top: 2px; }
    .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; }
    .stat-card .label { font-size: 13px; color: var(--text3); font-weight: 500; margin-bottom: 8px; }
    .stat-card .value { font-size: 32px; font-weight: 700; line-height: 1; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 20px; border-bottom: 1px solid var(--border); color: var(--text3); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; background: var(--bg3); }
    td { padding: 12px 20px; border-bottom: 1px solid rgba(30,45,61,.5); font-size: 13px; color: var(--text2); }
    tr:hover td { background: rgba(34,211,238,.02); }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--bg4); border-color: var(--border2); }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  totalQueries = 0;
  qps = '0';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadClients();
  }

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
