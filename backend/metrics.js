const client = require("prom-client");

const register = new client.Registry();

// Default metrics: CPU, memory, event loop lag, etc.
client.collectDefaultMetrics({ register });

// How long each HTTP request takes
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Total request count (useful for error-rate calculations in Grafana)
const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

module.exports = { register, httpRequestDuration, httpRequestTotal };
