# KlyroDNS

A lightweight, self-hosted DNS server with a built-in web dashboard — written in Go.

KlyroDNS lets you manage your own DNS zones and records through a clean REST API and an embedded dashboard UI. It supports both UDP and TCP, forwards unknown queries to configurable upstream resolvers, and tracks all client queries in real time.

---

## Features

- **DNS Server**: Serves DNS queries over both UDP and TCP
- **Smart Forwarding**: Unresolved queries are forwarded to upstream resolvers (e.g. `8.8.8.8`, `1.1.1.1`)
- **Zone Management**: Create, list, and delete DNS zones via REST API; zones are persisted as YAML files
- **Record Management**: Add and remove DNS records (A, CNAME, MX, TXT, etc.) per zone
- **Query Tracker**: Tracks recent client queries with per-IP stats and a global query log
- **Embedded Dashboard**: Built-in web UI served directly from the binary (no separate frontend server needed)
- **Auth-Protected API**: Cookie-based session authentication for all management endpoints
- **Docker Support**: Includes a `Dockerfile` and `docker-compose.yml` for one-command deployment
- **JSON Schema Validation**: Config and zone files are validated against JSON schemas

---

## Quick Start with Docker

The fastest way to get KlyroDNS running:

### Option 1: Run without config files

Start the server with zero config, then create your zones and records from the dashboard:

```bash
docker run -d \
  --name klyrodns \
  --restart unless-stopped \
  -p 5353:5353/udp \
  -p 5353:5353/tcp \
  -p 8080:8080 \
  -e KLYRO_USER=admin \
  -e KLYRO_PASS=admin \
  ghcr.io/klyro-dns/klyro:latest
```

Open `http://localhost:8080`, login with `admin` / `admin`, and start adding zones and records from the UI.

### Option 2: Run with your own config files

If you already have a `config.yaml` and zone files, mount them as volumes:

```bash
docker run -d \
  --name klyrodns \
  --restart unless-stopped \
  -p 5353:5353/udp \
  -p 5353:5353/tcp \
  -p 8080:8080 \
  -v ~/klyro/config.yaml:/app/config.yaml:ro \
  -v ~/klyro/config/zones:/app/config/zones \
  -e KLYRO_USER=admin \
  -e KLYRO_PASS=admin \
  ghcr.io/klyro-dns/klyro:latest


```
This starts KlyroDNS with:
- DNS server on port `5353` (UDP + TCP)
- Web dashboard on port `8080`

Default credentials: `admin` / `admin`
> **Don't have config files yet?** Use Option 1 and manage everything from the dashboard.

Open `http://localhost:8080` in your browser to access the dashboard.

---

## Try with Docker Compose

The `example/` folder contains a ready-to-use setup. Check it out and run it directly:

```bash
cd example/
docker compose up -d
```

This will start KlyroDNS with the example zones (`example.com`, `home.local`) already configured.

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

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `KLYRO_CONFIG` | Path to the config.yaml file | `config.yaml` |
| `KLYRO_USER` | Override dashboard username | `admin` |
| `KLYRO_PASS` | Override dashboard password | `admin` |

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

> **Note:** KlyroDNS is designed to be lightweight and simple. It runs as a single binary with zero external dependencies — no database, no Node.js runtime, no config generators. Just a Go binary, a YAML config, and you're up. Perfect for homelabs, small offices, or anyone who wants full control over their DNS without the complexity of enterprise solutions.
