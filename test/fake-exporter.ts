/**
 * Fake Prometheus metrics exporter for testing viewui
 * 
 * Serves Prometheus-format metrics at http://localhost:9091/metrics
 */

// Metric state (simulated values)
let httpRequestsTotal = 0;
let lastCpuUsage = 50;
let lastMemoryUsage = 60;

// Helper to generate smooth random walk values
function randomWalk(current: number, min: number, max: number, maxStep: number = 5): number {
  const step = (Math.random() - 0.5) * 2 * maxStep;
  const next = current + step;
  return Math.max(min, Math.min(max, next));
}

// Generate Prometheus-format metrics
function generateMetrics(): string {
  const now = Date.now();
  
  // Update simulated values
  lastCpuUsage = randomWalk(lastCpuUsage, 10, 90);
  lastMemoryUsage = randomWalk(lastMemoryUsage, 40, 80);
  httpRequestsTotal += Math.floor(Math.random() * 10) + 1;
  
  const lines: string[] = [];
  
  // CPU usage gauge (0-100%)
  lines.push('# HELP node_cpu_usage_percent Current CPU usage percentage');
  lines.push('# TYPE node_cpu_usage_percent gauge');
  lines.push(`node_cpu_usage_percent{instance="fake-server",job="node"} ${lastCpuUsage.toFixed(2)}`);
  
  // Memory usage gauge (0-100%)
  lines.push('# HELP node_memory_usage_percent Current memory usage percentage');
  lines.push('# TYPE node_memory_usage_percent gauge');
  lines.push(`node_memory_usage_percent{instance="fake-server",job="node"} ${lastMemoryUsage.toFixed(2)}`);
  
  // Memory bytes (simulated 16GB total)
  const totalMemory = 16 * 1024 * 1024 * 1024;
  const usedMemory = Math.floor(totalMemory * (lastMemoryUsage / 100));
  lines.push('# HELP node_memory_MemTotal_bytes Total memory in bytes');
  lines.push('# TYPE node_memory_MemTotal_bytes gauge');
  lines.push(`node_memory_MemTotal_bytes{instance="fake-server",job="node"} ${totalMemory}`);
  lines.push('# HELP node_memory_MemAvailable_bytes Available memory in bytes');
  lines.push('# TYPE node_memory_MemAvailable_bytes gauge');
  lines.push(`node_memory_MemAvailable_bytes{instance="fake-server",job="node"} ${totalMemory - usedMemory}`);
  
  // HTTP requests counter
  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total{instance="fake-server",job="app",method="GET",status="200"} ${httpRequestsTotal}`);
  lines.push(`http_requests_total{instance="fake-server",job="app",method="POST",status="200"} ${Math.floor(httpRequestsTotal * 0.3)}`);
  lines.push(`http_requests_total{instance="fake-server",job="app",method="GET",status="500"} ${Math.floor(httpRequestsTotal * 0.02)}`);
  
  // Response time histogram (simulated)
  const avgResponseTime = 50 + Math.random() * 100;
  lines.push('# HELP http_request_duration_seconds HTTP request duration');
  lines.push('# TYPE http_request_duration_seconds histogram');
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="0.01"} ${Math.floor(httpRequestsTotal * 0.1)}`);
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="0.05"} ${Math.floor(httpRequestsTotal * 0.4)}`);
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="0.1"} ${Math.floor(httpRequestsTotal * 0.7)}`);
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="0.5"} ${Math.floor(httpRequestsTotal * 0.95)}`);
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="1"} ${Math.floor(httpRequestsTotal * 0.99)}`);
  lines.push(`http_request_duration_seconds_bucket{instance="fake-server",job="app",le="+Inf"} ${httpRequestsTotal}`);
  lines.push(`http_request_duration_seconds_sum{instance="fake-server",job="app"} ${(httpRequestsTotal * avgResponseTime / 1000).toFixed(3)}`);
  lines.push(`http_request_duration_seconds_count{instance="fake-server",job="app"} ${httpRequestsTotal}`);
  
  // Load average
  const load1 = randomWalk(1.5, 0.1, 4, 0.3);
  const load5 = randomWalk(1.2, 0.1, 3, 0.2);
  const load15 = randomWalk(1.0, 0.1, 2.5, 0.1);
  lines.push('# HELP node_load1 1 minute load average');
  lines.push('# TYPE node_load1 gauge');
  lines.push(`node_load1{instance="fake-server",job="node"} ${load1.toFixed(2)}`);
  lines.push('# HELP node_load5 5 minute load average');
  lines.push('# TYPE node_load5 gauge');
  lines.push(`node_load5{instance="fake-server",job="node"} ${load5.toFixed(2)}`);
  lines.push('# HELP node_load15 15 minute load average');
  lines.push('# TYPE node_load15 gauge');
  lines.push(`node_load15{instance="fake-server",job="node"} ${load15.toFixed(2)}`);
  
  // Uptime
  const uptime = Math.floor((now - startTime) / 1000);
  lines.push('# HELP node_boot_time_seconds Node boot time in seconds since epoch');
  lines.push('# TYPE node_boot_time_seconds gauge');
  lines.push(`node_boot_time_seconds{instance="fake-server",job="node"} ${Math.floor(startTime / 1000)}`);
  
  // Disk usage
  const diskTotal = 500 * 1024 * 1024 * 1024; // 500GB
  const diskUsed = Math.floor(diskTotal * 0.65);
  lines.push('# HELP node_filesystem_size_bytes Filesystem size in bytes');
  lines.push('# TYPE node_filesystem_size_bytes gauge');
  lines.push(`node_filesystem_size_bytes{instance="fake-server",job="node",mountpoint="/",fstype="ext4"} ${diskTotal}`);
  lines.push('# HELP node_filesystem_avail_bytes Filesystem available bytes');
  lines.push('# TYPE node_filesystem_avail_bytes gauge');
  lines.push(`node_filesystem_avail_bytes{instance="fake-server",job="node",mountpoint="/",fstype="ext4"} ${diskTotal - diskUsed}`);
  
  return lines.join('\n') + '\n';
}

const startTime = Date.now();
const PORT = 9091;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === '/metrics') {
      return new Response(generateMetrics(), {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }
    
    if (url.pathname === '/') {
      return new Response('Fake Prometheus Exporter\n\nMetrics available at /metrics\n', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🎯 Fake metrics exporter running at http://localhost:${PORT}`);
console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
console.log('\nPress Ctrl+C to stop\n');
