# ShipStuff Monitor

A TUI (Terminal User Interface) for monitoring Prometheus metrics across ShipStuff applications.

## Setup

1. Install dependencies:
bun install
2. Configure Prometheus connection:
   - Copy `src/config.ts.template` to `src/config.ts`
   - Update the Prometheus URL in `src/config.ts`
   - Adjust metric queries if needed

3. Run the application:
bun run dev## Features

- Real-time metric monitoring from Prometheus
- Gauge and Counter metric visualization
- Keyboard navigation (arrow keys or vim keys)
- Auto-refresh with configurable interval

## Controls

- `↑/↓/←/→` or `k/j/h/l`: Navigate between metrics
- `q`: Quit

## Metrics

Currently monitoring:
- **Total Requests**: Rate of HTTP requests (counter)
- **Active Connections**: Current active connections (gauge)
