# viewui

A terminal-native dashboard renderer compatible with Grafana dashboards and Prometheus queries.

## Overview

viewui allows you to:
- Reuse existing Grafana dashboard JSON files
- Query the same Prometheus datasource
- View metrics directly in a terminal

**Grafana remains the dashboard authoring tool.** viewui is a read-only renderer.

## Features

- **Grafana Compatible**: Load dashboard JSON files directly
- **Prometheus Native**: Execute PromQL queries against Prometheus HTTP API
- **Terminal UI**: ASCII/Unicode sparklines, gauges, and stat panels
- **Keyboard Navigation**: Full keyboard control, no mouse needed
- **Auto-refresh**: Configurable refresh interval

## Supported Grafana Features

| Feature | Status |
|---------|--------|
| Datasource: Prometheus | ✅ Supported |
| Panel: timeseries | ✅ Supported |
| Panel: stat | ✅ Supported |
| Raw PromQL queries | ✅ Supported |
| Time range (now-X) | ✅ Supported |
| Transformations | ❌ Ignored |
| Variables/Templating | ❌ Ignored |
| Annotations | ❌ Ignored |
| Panel plugins | ❌ Ignored |

Unsupported features are logged and skipped - they never crash the app.

## Requirements

- [Bun](https://bun.sh) runtime
- [Zig](https://ziglang.org) (required by OpenTUI)
- Prometheus server
- Grafana dashboard JSON file

## Installation

```bash
git clone <repo-url>
cd viewui
bun install
```

## Configuration

Create `config.yaml` in the project root:

```yaml
prometheus:
  url: http://localhost:9090
  # username: optional
  # password: optional
  timeout: 10000

dashboard:
  path: ./dashboards/example.json

refreshInterval: 5000
timeRange: 5m
```

## Usage

```bash
# Start the dashboard
bun start

# Development mode with watch
bun dev
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Force refresh |
| `←` `↑` `↓` `→` | Navigate panels |

## Creating Dashboards

Export your Grafana dashboard as JSON and place it in the `dashboards/` directory.
viewui will parse the JSON and render supported panels.

### Example Dashboard JSON

```json
{
  "title": "My Dashboard",
  "panels": [
    {
      "id": 1,
      "title": "CPU Usage",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
          "refId": "A",
          "legendFormat": "CPU %"
        }
      ]
    }
  ]
}
```

## Architecture

```
viewui/
├── src/
│   ├── grafana/       # Dashboard JSON parser
│   ├── prometheus/    # PromQL query executor
│   ├── store/         # Dashboard state management
│   ├── ui/            # OpenTUI React components
│   │   ├── charts/    # Sparkline, Gauge, Bar
│   │   └── renderers/ # Panel type renderers
│   └── config/        # Configuration loading
└── dashboards/        # Grafana JSON files
```

## License

MIT
