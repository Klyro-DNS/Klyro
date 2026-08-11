import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, Zone } from '../../models/dns.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="topbar">
      <div>
        <h2>Dashboard</h2>
        <div class="subtitle">Live metrics and insights</div>
      </div>
      <div class="time-tabs">
        <button class="time-tab" [class.active]="selectedRange === '1h'" (click)="setRange('1h')">1h</button>
        <button class="time-tab" [class.active]="selectedRange === '24h'" (click)="setRange('24h')">24h</button>
        <button class="time-tab" [class.active]="selectedRange === '7d'" (click)="setRange('7d')">7d</button>
      </div>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="label">Total Queries</div>
          <div class="value">{{ formatNum(stats?.total_queries || 0) }}</div>
          <div class="change up">&#8593; +12% vs yesterday</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="label">Cache Hit Rate</div>
          <div class="value">{{ (stats?.cache_hit_rate || 0).toFixed(1) }}%</div>
          <div class="change up">&#8593; +3% vs yesterday</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="label">Blocked Queries</div>
          <div class="value">{{ formatNum(stats?.total_blocked || 0) }}</div>
          <div class="change down">&#8595; -5% vs yesterday</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="label">Avg Latency</div>
          <div class="value">{{ (stats?.avg_latency || 0).toFixed(0) }}ms</div>
          <div class="change up">&#8593; +1ms vs yesterday</div>
        </div>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-header">
        <div class="chart-title">Query Volume ({{ selectedRange }})</div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Queries</span>
          <span class="legend-item"><span class="legend-dot" style="background:var(--red)"></span>Blocked</span>
        </div>
      </div>
      <div class="chart-wrap">
        <canvas #queryChart></canvas>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Active Zones</div>
            <button class="btn btn-sm" (click)="loadData()">Refresh</button>
          </div>
          <div>
            @for (zone of zones; track zone.name) {
              <div class="zone-item">
                <div>
                  <div class="zone-name">{{ zone.name }}</div>
                  <div class="zone-type">{{ zone.type }}</div>
                </div>
                <div class="zone-right">
                  <div class="zone-queries">{{ zone.records?.length || 0 }} records</div>
                  <div class="zone-status">Active</div>
                </div>
              </div>
            } @empty {
              <div class="empty">No zones configured</div>
            }
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Top Domains</div>
          </div>
          <div style="padding: 16px 20px">
            @for (domain of stats?.top_domains?.slice(0, 8); track domain.domain) {
              <div class="top-item">
                <div class="domain">{{ domain.domain }}</div>
                <div class="count">{{ formatNum(domain.count) }}</div>
              </div>
            } @empty {
              <div class="empty">No data yet</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .topbar h2 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--text3); font-size: 13px; margin-top: 2px; }
    .time-tabs { display: flex; gap: 4px; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 3px; }
    .time-tab { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--text3); cursor: pointer; border: none; background: none; transition: all .15s; }
    .time-tab:hover { color: var(--text); }
    .time-tab.active { background: var(--accent); color: #000; }
    .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; transition: all .2s; }
    .stat-card:hover { border-color: var(--border2); transform: translateY(-1px); }
    .stat-card .label { font-size: 13px; color: var(--text3); font-weight: 500; margin-bottom: 8px; }
    .stat-card .value { font-size: 32px; font-weight: 700; line-height: 1; }
    .stat-card .change { font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
    .stat-card .change.up { color: var(--green); }
    .stat-card .change.down { color: var(--red); }
    .chart-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-title { font-size: 16px; font-weight: 600; }
    .chart-wrap { position: relative; height: 280px; }
    .chart-legend { display: flex; gap: 16px; font-size: 12px; color: var(--text3); }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 15px; font-weight: 600; }
    .zone-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid rgba(30,45,61,.5); transition: background .15s; }
    .zone-item:last-child { border-bottom: none; }
    .zone-item:hover { background: rgba(34,211,238,.02); }
    .zone-name { font-weight: 600; font-size: 14px; }
    .zone-type { font-size: 12px; color: var(--text3); margin-top: 2px; }
    .zone-right { text-align: right; }
    .zone-queries { font-size: 13px; color: var(--text2); }
    .zone-status { font-size: 11px; color: var(--green); font-weight: 600; }
    .top-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(30,45,61,.3); }
    .top-item:last-child { border-bottom: none; }
    .domain { font-size: 13px; font-family: 'JetBrains Mono', monospace; color: var(--text); }
    .count { font-size: 13px; color: var(--text3); }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('queryChart') chartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  zones: Zone[] = [];
  selectedRange = '24h';
  timeRanges = ['1h', '24h', '7d'];
  private chart: Chart | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.chart?.destroy();
  }

  setRange(range: string) {
    this.selectedRange = range;
    this.loadData();
  }

  loadData() {
    this.api.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.renderChart();
      },
      error: () => {}
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
          { label: 'Queries', data: queries, backgroundColor: 'rgba(34,211,238,.6)', borderRadius: 4, barPercentage: .7 },
          { label: 'Blocked', data: blocked, backgroundColor: 'rgba(239,68,68,.5)', borderRadius: 4, barPercentage: .7 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(30,45,61,.5)' }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { grid: { color: 'rgba(30,45,61,.5)' }, ticks: { color: '#64748b', font: { size: 11 } } }
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
