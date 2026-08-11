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
    <div class="page-header">
      <div>
        <h1>Zones</h1>
        <p class="subtitle">Manage DNS zones</p>
      </div>
      <button class="btn btn-primary" (click)="openModal()">+ Add Zone</button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Zone</th><th>Type</th><th>Records</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (zone of zones; track zone.name) {
            <tr>
              <td><strong>{{ zone.name }}</strong></td>
              <td><span class="badge badge-info">{{ zone.type }}</span></td>
              <td>{{ zone.records }}</td>
              <td><span class="badge badge-success">Active</span></td>
              <td><button class="btn btn-sm btn-danger" (click)="deleteZone(zone.name)">Delete</button></td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="empty">No zones configured</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (showModal) {
      <div class="overlay" (click)="closeModal()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3>Add Zone</h3>
          <div class="field">
            <label>Zone Name</label>
            <input [(ngModel)]="newZone.name" placeholder="example.com" (keydown.enter)="addZone()">
          </div>
          <div class="field">
            <label>Type</label>
            <select [(ngModel)]="newZone.type">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
          <div class="actions">
            <button class="btn" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="addZone()">Create Zone</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-header h1 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--text3); font-size: 13px; margin-top: 4px; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class ZonesComponent implements OnInit {
  zones: Zone[] = [];
  showModal = false;
  newZone = { name: '', type: 'primary' };

  constructor(private api: ApiService) {}
  ngOnInit() { this.loadZones(); }

  loadZones() {
    this.api.getZones().subscribe({ next: (zones) => this.zones = zones });
  }

  openModal() {
    this.newZone = { name: '', type: 'primary' };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  addZone() {
    if (!this.newZone.name.trim()) return;
    this.api.addZone({ name: this.newZone.name.trim(), type: this.newZone.type, records: [] }).subscribe({
      next: () => { this.closeModal(); this.loadZones(); }
    });
  }

  deleteZone(name: string) {
    if (!confirm(`Delete zone ${name}?`)) return;
    this.api.deleteZone(name).subscribe({ next: () => this.loadZones() });
  }
}
