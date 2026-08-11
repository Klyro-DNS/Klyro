export interface Zone {
  name: string;
  type: string;
  enabled: boolean;
  records: number;
}

export interface ZoneDetail {
  name: string;
  type: string;
  enabled: boolean;
  records: DnsRecord[];
}

export interface DnsRecord {
  name: string;
  type: string;
  ttl: number;
  value: string;
  priority?: number;
}

export interface DashboardStats {
  total_queries: number;
  cache_hit_rate: number;
  total_blocked: number;
  avg_latency: number;
  hourly: HourlyStats[];
  top_domains: TopDomain[];
}

export interface HourlyStats {
  hour: string;
  queries: number;
  blocked: number;
}

export interface TopDomain {
  domain: string;
  count: number;
}

export interface Client {
  ip: string;
  total_queries: number;
  queries: Record<string, number>;
  last_seen: string;
}

export interface QueryLog {
  timestamp: string;
  client_ip: string;
  domain: string;
  type: string;
  response: string;
  latency_ms: number;
}
