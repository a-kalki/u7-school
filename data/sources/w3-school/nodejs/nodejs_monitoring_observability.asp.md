# Node.js Monitoring & Observability

* * *

## Introduction to Observability

Observability in Node.js applications involves collecting and analyzing metrics and logs to understand system behavior.

**Key Pillars of Observability:** Metrics, Logs, and Traces (often called the "three pillars of observability") provide different but complementary views of your system's health and performance.

* * *

## Application Metrics Collection

### Using Prometheus Client

```javascript
const express = require('express');const client = require('prom-client');// Create a Registry to register the metricsconst register = new client.Registry();// Add a default label which is added to all metricsregister.setDefaultLabels({  app: 'nodejs-monitoring-demo'});// Enable collection of default metricsclient.collectDefaultMetrics({ register });// Create a custom metricconst httpRequestDurationMicroseconds = new client.Histogram({  name: 'http_request_duration_seconds',  help: 'Duration of HTTP requests in seconds',  labelNames: ['method', 'route', 'code'],  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // buckets for response time});const app = express();// Custom middleware to track request durationapp.use((req, res, next) => {  const end = httpRequestDurationMicroseconds.startTimer();  res.on('finish', () => {    end({ method: req.method, route: req.path, code: res.statusCode });  });  next();});// Expose metrics endpointapp.get('/metrics', async (req, res) => {  res.set('Content-Type', register.contentType);  res.end(await register.metrics());});// Example routeapp.get('/', (req, res) => {  res.send('Hello, Observability!');});const PORT = process.env.PORT || 3000;app.listen(PORT, () => {  console.log(`Server running on port ${PORT}`);});
```

### Key Metrics to Monitor

#### System Metrics

*   CPU Usage
*   Memory Usage (Heap & RSS)
*   Event Loop Lag
*   Garbage Collection
*   Active Handles/Requests

#### Application Metrics

*   Request Rate & Duration
*   Error Rates
*   Database Query Performance
*   Cache Hit/Miss Ratios
*   Queue Lengths

* * *

* * *

## Distributed Tracing

Distributed tracing helps track requests as they flow through multiple services in a microservices architecture.

```javascript
// Install required packages// npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-http// npm install @opentelemetry/exporter-trace-otlp-httpconst { NodeSDK } = require('@opentelemetry/sdk-node');const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');const { Resource } = require('@opentelemetry/resources');const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');const sdk = new NodeSDK({  resource: new Resource({    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service',    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',  }),  traceExporter: new OTLPTraceExporter({    url: 'http://collector:4318/v1/traces',  }),  instrumentations: [getNodeAutoInstrumentations()],});sdk.start()  .then(() => console.log('Tracing initialized'))  .catch((error) => console.log('Error initializing tracing', error));
```

* * *

## Logging Best Practices

```javascript
const pino = require('pino');const express = require('express');const pinoHttp = require('pino-http');const logger = pino({  level: process.env.LOG_LEVEL || 'info',  formatters: {    level: (label) => ({ level: label.toUpperCase() }),  },});const app = express();// HTTP request logging middlewareapp.use(pinoHttp({  logger,  customLogLevel: function (res, err) {    if (res.statusCode >= 400 && res.statusCode < 500) {      return 'warn';    } else if (res.statusCode >= 500 || err) {      return 'error';    }    return 'info';  },}));app.get('/', (req, res) => {  req.log.info('Processing request');  res.json({ status: 'ok' });});app.listen(3000, () => {  logger.info('Server started on port 3000');});
```

### Log Enrichment

```javascript
// Add context to logsapp.use((req, res, next) => {  const childLogger = logger.child({    requestId: req.id,    userId: req.user?.id || 'anonymous',    path: req.path,    method: req.method  });  req.log = childLogger;  next();});
```

* * *

## Alerting and Visualization

### Grafana Dashboard Example

Visualize your metrics with Grafana dashboards. Example queries for common metrics:

```javascript
# Node.js Memory Usage (RSS in MB)process_resident_memory_bytes{job="nodejs"} / 1024 / 1024# Request Duration (p99 in ms)histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000# Error Ratesum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

### Alerting Rules (Prometheus)

```javascript
groups:- name: nodejs  rules:  - alert: HighErrorRate    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05    for: 10m    labels:      severity: critical    annotations:      summary: "High error rate on {{ $labels.instance }}"
```

* * *

## Production Monitoring Tools

### Open Source

*   Prometheus + Grafana
*   Elasticsearch + Fluentd + Kibana (EFK)
*   Jaeger
*   Loki

### Commercial

*   Datadog
*   New Relic
*   Dynatrace
*   AppDynamics

### Cloud Native

*   AWS CloudWatch
*   Google Cloud Operations
*   Azure Monitor
*   OpenTelemetry Collector

* * *

## Best Practices

#### Do's

*   Use structured logging with consistent formats
*   Monitor both system and application metrics
*   Set up alerts based on SLOs (Service Level Objectives)
*   Use distributed tracing for microservices

#### Don'ts

*   Don't log sensitive information
*   Avoid high-cardinality labels in metrics
*   Don't rely solely on logs for debugging
*   Avoid alert fatigue - focus on actionable alerts

* * *

* * *