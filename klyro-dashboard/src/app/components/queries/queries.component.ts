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
    <div class="page-header">
      <div>
        <h1>Query Log</h1>
        <p class="subtitle">Live DNS query stream</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="form-control" [(ngModel)]="searchTerm" (ngModelChange)="filterQueries()" placeholder="Search domain or IP...">
        </div>
        <button class="btn" (click)="loadQueries()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <div class="card">
      <table>
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-header h1 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--text3); font-size: 13px; margin-top: 4px; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .search-box {
      position: relative;
    }
    .search-box input {
      padding-left: 36px;
      width: 260px;
    }
    .search-box svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--text3);
    }
    .card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .text-muted { color: var(--text3) !important; }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class QueriesComponent implements OnInit {
  allQueries: QueryLog[] = [];
  filteredQueries: QueryLog[] = [];
  searchTerm = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadQueries(); }

  loadQueries() {
    this.api.getQueries().subscribe({
      next: (queries) => { this.allQueries = queries; this.filterQueries(); }
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
