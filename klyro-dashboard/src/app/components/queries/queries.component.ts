import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { QueryLog } from '../../models/dns.models';

@Component({
  selector: 'app-queries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar">
      <div>
        <h2>Query Log</h2>
        <div class="subtitle">Live DNS query stream</div>
      </div>
      <div class="d-flex gap-2">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="form-control" [(ngModel)]="searchTerm" (ngModelChange)="filterQueries()" placeholder="Search domain or IP...">
        </div>
        <button class="btn" (click)="loadQueries()">Refresh</button>
      </div>
    </div>
    <div class="card">
      <table class="table mb-0">
        <thead>
          <tr>
            <th>Time</th>
            <th>Client</th>
            <th>Domain</th>
            <th>Type</th>
            <th>Response</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          @for (q of filteredQueries; track $index) {
            <tr>
              <td class="text-muted">{{ formatTime(q.timestamp) }}</td>
              <td><code>{{ q.client_ip }}</code></td>
              <td>{{ q.domain }}</td>
              <td><span class="badge badge-purple">{{ q.type }}</span></td>
              <td><span class="badge" [ngClass]="getResponseClass(q.response)">{{ q.response }}</span></td>
              <td class="text-muted">{{ q.latency_ms }}ms</td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="empty">No queries recorded yet</td>
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
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 20px; border-bottom: 1px solid var(--border); color: var(--text3); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; background: var(--bg3); }
    td { padding: 12px 20px; border-bottom: 1px solid rgba(30,45,61,.5); font-size: 13px; color: var(--text2); }
    tr:hover td { background: rgba(34,211,238,.02); }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success { background: rgba(16,185,129,.1); color: var(--green); }
    .badge-info { background: rgba(34,211,238,.1); color: var(--accent); }
    .badge-danger { background: rgba(239,68,68,.1); color: var(--red); }
    .badge-purple { background: rgba(167,139,250,.1); color: var(--purple); }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--bg4); border-color: var(--border2); }
    .search-box { position: relative; }
    .search-box input { padding-left: 36px; }
    .search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text3); }
    .form-control { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
    .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 0.2rem rgba(34, 211, 238, 0.15); }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class QueriesComponent implements OnInit {
  allQueries: QueryLog[] = [];
  filteredQueries: QueryLog[] = [];
  searchTerm = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadQueries();
  }

  loadQueries() {
    this.api.getQueries().subscribe({
      next: (queries) => {
        this.allQueries = queries;
        this.filterQueries();
      }
    });
  }

  filterQueries() {
    const q = this.searchTerm.toLowerCase();
    this.filteredQueries = q
      ? this.allQueries.filter(e => e.domain.includes(q) || e.client_ip.includes(q))
      : [...this.allQueries];
    this.filteredQueries.reverse();
    this.filteredQueries = this.filteredQueries.slice(0, 200);
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString();
  }

  getResponseClass(response: string): string {
    if (response === 'success') return 'badge-success';
    if (response === 'nxdomain') return 'badge-danger';
    return 'badge-info';
  }
}
