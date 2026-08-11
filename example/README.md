# KlyroDNS Example

This folder contains a complete, ready-to-use KlyroDNS setup. You can run it directly with Docker Compose to try out the server without any manual configuration.

---

## How to Run

```bash
docker compose up -d
```

Then open `http://localhost:8080` in your browser.

- **Username:** `admin`
- **Password:** `admin`

---

## Folder Structure

```
example/
├── config.yaml                # Server configuration
├── docker-compose.yml         # Docker Compose deployment
└── config/
    └── zones/
        ├── example.com.yaml   # Example zone: example.com
        └── home.local.yaml    # Example zone: home.local
```

---

## config.yaml

The main server configuration file:

```yaml
listen_addr: ":5353"       # DNS server listen address (UDP + TCP)
http_addr: ":8080"         # Dashboard / REST API listen address
upstreams:
  - "8.8.8.8:53"           # Google DNS (forwarded to for unknown queries)
  - "1.1.1.1:53"           # Cloudflare DNS (fallback upstream)
log_level: "info"           # Log level: debug, info, warn, error
config_dir: "config/zones"  # Directory where zone YAML files are stored
username: "admin"           # Dashboard login username
password: "admin"           # Dashboard login password
```

You can change ports, upstreams, and credentials before starting.

---

## Zone Files

Zone files live inside `config/zones/`. Each zone is a separate YAML file.

### example.com.yaml

A zone with multiple record types:

```yaml
name: example.com
type: primary
enabled: true
records:
  - name: "@"           # Root domain (example.com)
    type: A
    ttl: 3600
    value: "192.168.1.10"

  - name: "www"         # www.example.com
    type: A
    ttl: 3600
    value: "192.168.1.10"

  - name: "api"         # api.example.com
    type: A
    ttl: 300
    value: "192.168.1.20"

  - name: "@"           # MX record for email
    type: MX
    ttl: 3600
    priority: 10
    value: "mail.example.com"

  - name: "blog"        # blog.example.com -> www.example.com
    type: CNAME
    ttl: 3600
    value: "www.example.com"
```

### home.local.yaml

A simple homelab zone with A records:

```yaml
name: home.local
type: primary
enabled: true
records:
  - name: "@"           # home.local -> router IP
    type: A
    ttl: 300
    value: "192.168.1.1"

  - name: "nas"         # nas.home.local
    type: A
    ttl: 300
    value: "192.168.1.100"

  - name: "printer"     # printer.home.local
    type: A
    ttl: 300
    value: "192.168.1.200"
```

---

## Supported Record Types

| Type | Description |
|---|---|
| `A` | Maps a domain name to an IPv4 address |
| `AAAA` | Maps a domain name to an IPv6 address |
| `CNAME` | Alias pointing to another domain name |
| `MX` | Mail exchange record (requires `priority` field) |
| `TXT` | Arbitrary text record |
| `SRV` | Service locator record |

---

## Adding Your Own Zones

1. Create a new `.yaml` file in `config/zones/` (e.g. `mydomain.yaml`)
2. Follow the zone file format above
3. Restart the container: `docker compose restart`

You can also manage zones through the web dashboard or REST API without restarting.
