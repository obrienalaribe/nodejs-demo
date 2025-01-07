const client = require("prom-client");

// Create a registry to manage metrics
const register = new client.Registry();

// Collect default metrics (CPU, memory, etc.)
// client.collectDefaultMetrics({ register });

// Custom Metrics
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});
register.registerMetric(httpRequestCounter);

const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation"],
});
register.registerMetric(dbQueryDuration);

// Middleware to count HTTP requests
const requestMetricsMiddleware = (req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.originalUrl,
      status: res.statusCode,
    });
  });
  next();
};

// Export metrics and utilities
module.exports = {
  register,
  requestMetricsMiddleware,
  dbQueryDuration,
};
