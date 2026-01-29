# Health Check API

This document covers the health check endpoint for monitoring server and database status.

## Overview

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/health` | GET | No | Check server and database health |

---

## GET /api/health

Check if the server is running and the database is connected.

### Use Case

- Monitor server health in production
- Verify database connectivity
- Load balancer health checks
- Kubernetes/Docker health probes

### Request

```bash
curl http://localhost:3000/api/health
```

### Success Response - All Systems Operational (200)

```json
{
  "status": "ok",
  "message": "Server is running",
  "database": "connected"
}
```

### Partial Success - Database Disconnected (503)

```json
{
  "status": "error",
  "message": "Server is running but database is not connected",
  "database": "disconnected"
}
```

---

## Usage Examples

### Basic Health Check

```bash
curl http://localhost:3000/api/health
```

### Health Check with Status Code

```bash
curl -w "\nHTTP Status: %{http_code}\n" http://localhost:3000/api/health
```

### Continuous Monitoring Script

```bash
#!/bin/bash

URL="http://localhost:3000/api/health"
INTERVAL=30  # seconds

echo "Starting health monitor (checking every ${INTERVAL}s)..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  RESPONSE=$(curl -s -w "\n%{http_code}" $URL)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n1)
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo "[$TIMESTAMP] ✅ OK - Server healthy"
  else
    echo "[$TIMESTAMP] ❌ ERROR (HTTP $HTTP_CODE) - $BODY"
  fi
  
  sleep $INTERVAL
done
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

---

## Integration with Monitoring Tools

### Prometheus

Add to your scrape config:

```yaml
scrape_configs:
  - job_name: 'vyaapar-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/health'
```

### Uptime Robot / Pingdom

- URL: `https://your-domain.com/api/health`
- Method: GET
- Expected Status: 200
- Check Interval: 5 minutes

---

## Test Script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Health Check API Tests ==="

echo -e "\n1. Basic health check..."
curl -s "$BASE_URL/api/health" | jq .

echo -e "\n2. Health check with HTTP status..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Server is healthy"
else
  echo "❌ Server has issues"
fi

echo -e "\n=== Tests Complete ==="
```

---

**Related Documentation:**
- [Main Documentation](./README.md)
