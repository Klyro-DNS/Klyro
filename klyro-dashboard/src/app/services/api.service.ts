import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Zone, ZoneDetail, DnsRecord, DashboardStats, Client, QueryLog } from '../models/dns.models';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  toasts = signal<Toast[]>([]);
  private toastId = 0;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    const msg = error.error || error.statusText || 'Request failed';
    return throwError(() => msg);
  }

  private toast(message: string, type: 'success' | 'error') {
    const id = ++this.toastId;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 4000);
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/stats');
  }

  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>('/api/zones');
  }

  addZone(zone: Partial<ZoneDetail>): Observable<any> {
    return this.http.post('/api/zones', zone).pipe(
      catchError(e => { this.toast(e, 'error'); return this.handleError(e); })
    );
  }

  deleteZone(name: string): Observable<any> {
    return this.http.delete(`/api/zones/${name}`).pipe(
      catchError(e => { this.toast(e, 'error'); return this.handleError(e); })
    );
  }

  getRecords(zoneName: string): Observable<DnsRecord[]> {
    return this.http.get<DnsRecord[]>(`/api/zones/${zoneName}/records`);
  }

  addRecord(zoneName: string, record: DnsRecord): Observable<any> {
    return this.http.post(`/api/zones/${zoneName}/records`, record).pipe(
      catchError(e => { this.toast(e, 'error'); return this.handleError(e); })
    );
  }

  deleteRecord(zoneName: string, recordId: string): Observable<any> {
    return this.http.delete(`/api/zones/${zoneName}/records/${recordId}`).pipe(
      catchError(e => { this.toast(e, 'error'); return this.handleError(e); })
    );
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients');
  }

  getQueries(limit: number = 500): Observable<QueryLog[]> {
    return this.http.get<QueryLog[]>(`/api/queries?limit=${limit}`);
  }
}
