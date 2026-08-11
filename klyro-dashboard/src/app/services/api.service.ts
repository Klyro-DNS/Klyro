import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Zone, DnsRecord, DashboardStats, Client, QueryLog } from '../models/dns.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/stats');
  }

  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>('/api/zones');
  }

  addZone(zone: Partial<Zone>): Observable<any> {
    return this.http.post('/api/zones', zone);
  }

  deleteZone(name: string): Observable<any> {
    return this.http.delete(`/api/zones/${name}`);
  }

  getRecords(zoneName: string): Observable<DnsRecord[]> {
    return this.http.get<DnsRecord[]>(`/api/zones/${zoneName}/records`);
  }

  addRecord(zoneName: string, record: DnsRecord): Observable<any> {
    return this.http.post(`/api/zones/${zoneName}/records`, record);
  }

  deleteRecord(zoneName: string, recordId: string): Observable<any> {
    return this.http.delete(`/api/zones/${zoneName}/records/${recordId}`);
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>('/api/clients');
  }

  getQueries(limit: number = 500): Observable<QueryLog[]> {
    return this.http.get<QueryLog[]>(`/api/queries?limit=${limit}`);
  }
}
