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
    <div class="topbar">
      <div>
        <h2>Records</h2>
        <div class="subtitle">Manage DNS records per zone</div>
      </div>
      <button class="btn btn-primary" (click)="showModal = true">+ Add Record</button>
    </div>
    <div class="mb-3">
      <select class="form-select" [(ngModel)]="selectedZone" (ngModelChange)="loadRecords()" style="min-width:250px">
        @for (zone of zones; track zone.name) {
          <option [value]="zone.name">{{ zone.name }}</option>
        }
      </select>
    </div>
    <div class="card">
      <table class="table mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>TTL</th>
            <th>Value</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (rec of records; track rec.name + rec.type) {
            <tr>
              <td>{{ rec.name }}</td>
              <td><span class="badge badge-info">{{ rec.type }}</span></td>
              <td>{{ rec.ttl }}</td>
              <td><code class="value-code">{{ rec.value }}</code></td>
              <td>{{ rec.priority || '-' }}</td>
              <td>
                <button class="btn btn-sm btn-danger" (click)="deleteRecord(rec)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="empty">No records in this zone</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (showModal) {
      <div class="modal-overlay show" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Add Record</h3>
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input class="form-control" [(ngModel)]="newRecord.name" placeholder="www or @ for root">
          </div>
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Type</label>
              <select class="form-select" [(ngModel)]="newRecord.type">
                <option>A</option><option>AAAA</option><option>CNAME</option>
                <option>MX</option><option>TXT</option><option>NS</option><option>SRV</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">TTL</label>
              <input class="form-control" type="number" [(ngModel)]="newRecord.ttl">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Value</label>
            <input class="form-control" [(ngModel)]="newRecord.value" placeholder="192.168.1.1">
          </div>
          @if (newRecord.type === 'MX') {
            <div class="mb-3">
              <label class="form-label">Priority</label>
              <input class="form-control" type="number" [(ngModel)]="newRecord.priority">
            </div>
          }
          <div class="modal-actions">
            <button class="btn" (click)="showModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="addRecord()">Add Record</button>
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
    .badge-info { background: rgba(34,211,238,.1); color: var(--accent); }
    .value-code { font-size: 12px; background: var(--bg3); padding: 2px 6px; border-radius: 4px; }
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
        if (zones.length) {
          this.selectedZone = zones[0].name;
          this.loadRecords();
        }
      }
    });
  }

  loadRecords() {
    if (!this.selectedZone) return;
    this.api.getRecords(this.selectedZone).subscribe({
      next: (records) => this.records = records
    });
  }

  addRecord() {
    if (!this.newRecord.value) return;
    this.api.addRecord(this.selectedZone, this.newRecord).subscribe({
      next: () => {
        this.showModal = false;
        this.newRecord = { name: '', type: 'A', ttl: 3600, value: '' };
        this.loadRecords();
      }
    });
  }

  deleteRecord(rec: DnsRecord) {
    const id = `${rec.name}:${rec.type}`;
    this.api.deleteRecord(this.selectedZone, id).subscribe({
      next: () => this.loadRecords()
    });
  }
}
