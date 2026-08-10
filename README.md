# KlyroDNS

A lightweight, self-hosted DNS server with a built-in web dashboard — written in Go.

KlyroDNS lets you manage your own DNS zones and records through a clean REST API and an embedded dashboard UI. It supports both UDP and TCP, forwards unknown queries to configurable upstream resolvers, and tracks all client queries in real time.

---

## Features

- **DNS Server** — Serves DNS queries over both UDP and TCP
- **Smart Forwarding** — Unresolved queries are forwarded to upstream resolvers (e.g. `8.8.8.8`, `1.1.1.1`)
- **Zone Management** — Create, list, and delete DNS zones via REST API; zones are persisted as YAML files
- **Record Management** — Add and remove DNS records (A, CNAME, MX, TXT, etc.) per zone
- **Query Tracker** — Tracks recent client queries with per-IP stats and a global query log
- **Embedded Dashboard** — Built-in web UI served directly from the binary (no separate frontend server needed)
- **Auth-Protected API** — Cookie-based session authentication for all management endpoints
- **Docker Support** — Includes a `Dockerfile` and `docker-compose.yml` for one-command deployment
- **JSON Schema Validation** — Config and zone files are validated against JSON schemas

---

## Project Structure

```
.
├── cmd/
│   └── klyrodns/       # Application entrypoint
├── internal/
│   ├── api/            # HTTP router, handlers, auth, embedded dashboard
│   ├── config/         # Config loading, zone persistence, schema validation
│   ├── dns/            # DNS server (UDP+TCP) and query handler
│   └── models/         # Zone, Record, Store, QueryTracker types
├── config/
│   └── zones/          # Zone YAML files (loaded at startup)
├── example/            # Example config and zone files
├── config.yaml         # Main server configuration
├── Dockerfile
└── docker-compose.yml
```

---

## Quick Start

### Run with Docker (recommended)

```bash
docker compose up -d
```

This starts KlyroDNS with:
- DNS server on port `5353` (UDP + TCP)
- Web dashboard on port `8080`

### Run locally

```bash
go build -o klyrodns ./cmd/klyrodns
./klyrodns
```

---

## Configuration

Edit `config.yaml`:

```yaml
listen_addr: ":5353"       # DNS server address
http_addr: ":8080"         # Dashboard/API address
upstreams:
  - "8.8.8.8:53"           # Upstream DNS resolvers
  - "1.1.1.1:53"
log_level: "info"
config_dir: "config/zones" # Directory where zone files are stored
username: "admin"
password: "admin"
```

You can also set the config file path via the `KLYRO_CONFIG` environment variable.

---

## REST API

All management endpoints require authentication. Login via `POST /api/login`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Login |
| `POST` | `/api/logout` | Logout |
| `GET` | `/api/zones` | List all zones |
| `POST` | `/api/zones` | Create a zone |
| `DELETE` | `/api/zones/{name}` | Delete a zone |
| `GET` | `/api/zones/{name}/records` | List records in a zone |
| `POST` | `/api/zones/{name}/records` | Add a record |
| `DELETE` | `/api/zones/{name}/records/{record}` | Delete a record |
| `GET` | `/api/clients` | List tracked clients |
| `GET` | `/api/clients/{ip}` | Get client details |
| `GET` | `/api/queries` | Get recent queries |
| `GET` | `/api/stats` | Get query stats |

---

## Zone File Format

Zones are stored as YAML files in the `config/zones/` directory:

```yaml
name: "home.lab"
type: "primary"
enabled: true
records:
  - name: "router.home.lab."
    type: "A"
    value: "192.168.1.1"
    ttl: 300
```

---



