import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Zone, DnsRecord } from '../../models/dns.models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Records</h1>
        <p class="subtitle">Manage DNS records per zone</p>
      </div>
      <button class="btn btn-primary" (click)="openModal()" [disabled]="!selectedZone">+ Add Record</button>
    </div>

    <div class="zone-selector">
      <label>Select Zone</label>
      <select [(ngModel)]="selectedZone" (ngModelChange)="loadRecords()">
        @for (zone of zones; track zone.name) {
          <option [value]="zone.name">{{ zone.name }}</option>
        }
      </select>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th><th>Priority</th><th>Actions</th></tr>
        </thead>
        <tbody>
          @for (rec of records; track rec.name + rec.type) {
            <tr>
              <td><strong>{{ rec.name }}</strong></td>
              <td><span class="badge badge-info">{{ rec.type }}</span></td>
              <td>{{ rec.ttl }}</td>
              <td><code>{{ rec.value }}</code></td>
              <td>{{ rec.priority || '-' }}</td>
              <td><button class="btn btn-sm btn-danger" (click)="deleteRecord(rec)">Delete</button></td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">{{ selectedZone ? 'No records in this zone' : 'Select a zone first' }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (showModal) {
      <div class="overlay" (click)="closeModal()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h3>Add Record to {{ selectedZone }}</h3>
          <div class="field">
            <label>Name</label>
            <input [(ngModel)]="newRecord.name" placeholder="@ for root, or subdomain like www">
          </div>
          <div class="field-row">
            <div class="field">
              <label>Type</label>
              <select [(ngModel)]="newRecord.type">
                <option>A</option><option>AAAA</option><option>CNAME</option>
                <option>MX</option><option>TXT</option><option>NS</option><option>SRV</option>
              </select>
            </div>
            <div class="field">
              <label>TTL</label>
              <input type="number" [(ngModel)]="newRecord.ttl">
            </div>
          </div>
          <div class="field">
            <label>Value</label>
            <input [(ngModel)]="newRecord.value" placeholder="192.168.1.1">
          </div>
          @if (newRecord.type === 'MX') {
            <div class="field">
              <label>Priority</label>
              <input type="number" [(ngModel)]="newRecord.priority">
            </div>
          }
          <div class="actions">
            <button class="btn" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="addRecord()">Add Record</button>
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
    .zone-selector { margin-bottom: 20px; }
    .zone-selector label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: var(--text2); }
    .zone-selector select { max-width: 300px; }
    .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .empty { text-align: center; padding: 48px 20px; color: var(--text3); font-size: 14px; }
  `]
})
export class RecordsComponent implements OnInit {
  zones: Zone[] = [];
  records: DnsRecord[] = [];
  selectedZone = '';
  showModal = false;
  newRecord: DnsRecord = { name: '', type: 'A', ttl: 3600, value: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        if (zones.length) { this.selectedZone = zones[0].name; this.loadRecords(); }
      }
    });
  }

  loadRecords() {
    if (!this.selectedZone) return;
    this.api.getRecords(this.selectedZone).subscribe({ next: (records) => this.records = records });
  }

  openModal() {
    this.newRecord = { name: '', type: 'A', ttl: 3600, value: '' };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  addRecord() {
    if (!this.newRecord.value.trim()) return;
    this.api.addRecord(this.selectedZone, this.newRecord).subscribe({
      next: () => { this.closeModal(); this.loadRecords(); }
    });
  }

  deleteRecord(rec: DnsRecord) {
    this.api.deleteRecord(this.selectedZone, `${rec.name}:${rec.type}`).subscribe({
      next: () => this.loadRecords()
    });
  }
}
