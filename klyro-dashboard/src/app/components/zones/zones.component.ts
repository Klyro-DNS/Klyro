import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Zone } from '../../models/dns.models';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar">
      <div>
        <h2>Zones</h2>
        <div class="subtitle">Manage DNS zones</div>
      </div>
      <button class="btn btn-primary" (click)="showModal = true">+ Add Zone</button>
    </div>
    <div class="card">
      <table class="table mb-0">
        <thead>
          <tr>
            <th>Zone</th>
            <th>Type</th>
            <th>Records</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (zone of zones; track zone.name) {
            <tr>
              <td><strong>{{ zone.name }}</strong></td>
              <td><span class="badge badge-info">{{ zone.type }}</span></td>
              <td>{{ zone.records?.length || 0 }}</td>
              <td><span class="badge badge-success">Active</span></td>
              <td>
                <button class="btn btn-sm btn-danger" (click)="deleteZone(zone.name)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="empty">No zones configured</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (showModal) {
      <div class="modal-overlay show" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Add Zone</h3>
          <div class="mb-3">
            <label class="form-label">Zone Name</label>
            <input class="form-control" [(ngModel)]="newZone.name" placeholder="example.com">
          </div>
          <div class="mb-3">
            <label class="form-label">Type</label>
            <select class="form-select" [(ngModel)]="newZone.type">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn" (click)="showModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="addZone()">Create Zone</button>
          </div>
        </div>
      </div>
    }
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
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--bg4); border-color: var(--border2); }
    .btn-primary { background: var(--accent); border-color: var(--accent); color: #000; }
    .btn-primary:hover { background: var(--accent2); }
    .btn-sm { padding: 5px 12px; font-size: 12px; }
    .btn-danger { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); color: var(--red); }
    .btn-danger:hover { background: rgba(239,68,68,.2); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 100; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 500px; max-width: 90vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,.5); }
    .modal h3 { margin-bottom: 20px; font-size: 18px; font-weight: 600; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
    .form-label { color: var(--text3); font-size: 12px; font-weight: 500; }
    .form-control, .form-select { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
    .form-control:focus, .form-select:focus { border-color: var(--accent); box-shadow: 0 0 0 0.2rem rgba(34, 211, 238, 0.15); }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class ZonesComponent implements OnInit {
  zones: Zone[] = [];
  showModal = false;
  newZone = { name: '', type: 'primary' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadZones();
  }

  loadZones() {
    this.api.getZones().subscribe({
      next: (zones) => this.zones = zones
    });
  }

  addZone() {
    if (!this.newZone.name) return;
    this.api.addZone({
      name: this.newZone.name,
      type: this.newZone.type,
      records: []
    }).subscribe({
      next: () => {
        this.showModal = false;
        this.newZone = { name: '', type: 'primary' };
        this.loadZones();
      }
    });
  }

  deleteZone(name: string) {
    if (!confirm(`Delete zone ${name}?`)) return;
    this.api.deleteZone(name).subscribe({
      next: () => this.loadZones()
    });
  }
}
