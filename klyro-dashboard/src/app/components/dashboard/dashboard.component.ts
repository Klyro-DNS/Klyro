import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DashboardStats, Zone } from '../../models/dns.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Live metrics and insights</p>
      </div>
      <div class="time-tabs">
        <button [class.active]="selectedRange === '1h'" (click)="setRange('1h')">1h</button>
        <button [class.active]="selectedRange === '24h'" (click)="setRange('24h')">24h</button>
        <button [class.active]="selectedRange === '7d'" (click)="setRange('7d')">7d</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon queries">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Total Queries</div>
          <div class="stat-value">{{ formatNum(stats?.total_queries || 0) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cache">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Cache Hit Rate</div>
          <div class="stat-value">{{ (stats?.cache_hit_rate || 0).toFixed(1) }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blocked">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Blocked Queries</div>
          <div class="stat-value">{{ formatNum(stats?.total_blocked || 0) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon latency">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Avg Latency</div>
          <div class="stat-value">{{ (stats?.avg_latency || 0).toFixed(0) }}<span class="unit">ms</span></div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="section-header">
        <h3>Query Volume</h3>
        <div class="legend">
          <span class="legend-item"><span class="dot queries"></span>Queries</span>
          <span class="legend-item"><span class="dot blocked"></span>Blocked</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas #queryChart></canvas>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>Active Zones</h3>
          <button class="btn btn-sm" (click)="loadData()">Refresh</button>
        </div>
        <div class="card-body">
          @for (zone of zones; track zone.name) {
            <div class="zone-row">
              <div class="zone-info">
                <div class="zone-name">{{ zone.name }}</div>
                <div class="zone-type">{{ zone.type }}</div>
              </div>
              <div class="zone-meta">
                <span class="record-count">{{ zone.records }} records</span>
                <span class="status-dot"></span>
              </div>
            </div>
          } @empty {
            <div class="empty">No zones configured</div>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Top Domains</h3>
        </div>
        <div class="card-body">
          @for (domain of stats?.top_domains?.slice(0, 8); track domain.domain) {
            <div class="domain-row">
              <span class="domain-name">{{ domain.domain }}</span>
              <span class="domain-count">{{ formatNum(domain.count) }}</span>
            </div>
          } @empty {
            <div class="empty">No data yet</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
    }
    .subtitle {
      color: var(--text3);
      font-size: 13px;
      margin-top: 4px;
    }
    .time-tabs {
      display: flex;
      gap: 4px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 3px;
    }
    .time-tabs button {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text3);
      cursor: pointer;
      border: none;
      background: none;
      transition: all .15s;
    }
    .time-tabs button:hover { color: var(--text); }
    .time-tabs button.active { background: var(--accent); color: #fff; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
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
      transition: all .2s;
    }
    .stat-card:hover {
      border-color: var(--border2);
      transform: translateY(-2px);
      box-shadow: var(--card-shadow);
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
    .stat-icon.queries { background: rgba(99, 102, 241, .1); color: var(--accent2); }
    .stat-icon.cache { background: rgba(34, 197, 94, .1); color: var(--green); }
    .stat-icon.blocked { background: rgba(239, 68, 68, .1); color: #fca5a5; }
    .stat-icon.latency { background: rgba(245, 158, 11, .1); color: var(--orange); }
    .stat-label { font-size: 12px; color: var(--text3); font-weight: 500; margin-bottom: 4px; }
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-value .unit { font-size: 14px; font-weight: 500; color: var(--text3); margin-left: 2px; }

    .chart-section {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .section-header h3 { font-size: 15px; font-weight: 600; }
    .legend { display: flex; gap: 16px; font-size: 12px; color: var(--text3); }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
    .dot.queries { background: var(--accent); }
    .dot.blocked { background: var(--red); }
    .chart-container { position: relative; height: 260px; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .card-header h3 { font-size: 14px; font-weight: 600; }
    .card-body { padding: 0; }
    .zone-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(30, 45, 65, .3);
      transition: background .15s;
    }
    .zone-row:last-child { border-bottom: none; }
    .zone-row:hover { background: rgba(99, 102, 241, .03); }
    .zone-name { font-weight: 600; font-size: 14px; color: var(--text); }
    .zone-type { font-size: 12px; color: var(--text3); margin-top: 2px; }
    .zone-meta { display: flex; align-items: center; gap: 8px; }
    .record-count { font-size: 12px; color: var(--text3); }
    .status-dot { width: 8px; height: 8px; background: var(--green); border-radius: 50%; }
    .domain-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      border-bottom: 1px solid rgba(30, 45, 65, .3);
    }
    .domain-row:last-child { border-bottom: none; }
    .domain-name { font-size: 13px; font-family: 'JetBrains Mono', monospace; color: var(--text); }
    .domain-count { font-size: 13px; color: var(--text3); }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('queryChart') chartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  zones: Zone[] = [];
  selectedRange = '24h';
  private chart: Chart | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadData(); }
  ngAfterViewInit() {}
  ngOnDestroy() { this.chart?.destroy(); }

  setRange(range: string) {
    this.selectedRange = range;
    this.loadData();
  }

  loadData() {
    this.api.getStats().subscribe({
      next: (stats) => { this.stats = stats; this.renderChart(); }
    });
    this.api.getZones().subscribe({
      next: (zones) => this.zones = zones
    });
  }

  private renderChart() {
    if (!this.stats?.hourly || !this.chartRef) return;
    const labels = this.stats.hourly.map(h => h.hour);
    const queries = this.stats.hourly.map(h => h.queries);
    const blocked = this.stats.hourly.map(h => h.blocked);
    if (this.chart) this.chart.destroy();
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Queries', data: queries, backgroundColor: 'rgba(99,102,241,.6)', borderRadius: 4, barPercentage: .7 },
          { label: 'Blocked', data: blocked, backgroundColor: 'rgba(239,68,68,.4)', borderRadius: 4, barPercentage: .7 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(30,45,65,.4)' }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { grid: { color: 'rgba(30,45,65,.4)' }, ticks: { color: '#64748b', font: { size: 11 } } }
        }
      }
    });
  }

  formatNum(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }
}
