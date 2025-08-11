# RabbitMQ Service Operations Guide

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your RabbitMQ settings
   ```

3. **Start the service**
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm run start:prod
   ```

## 🔧 Configuration

### Basic RabbitMQ Setup
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Access management UI: http://localhost:15672 (guest/guest)
```

### Environment Variables
Copy `.env.example` to `.env` and adjust values:
- `RABBITMQ_URL`: Your RabbitMQ connection string
- `RABBITMQ_QUEUE`: Default queue name
- `MAX_RECONNECT_ATTEMPTS`: How many times to retry connection
- `HEALTH_CHECK_INTERVAL`: How often to check connection health

## 📊 Monitoring

### Real-time Monitoring
The service provides continuous monitoring with these indicators:

**Console Output Example:**
```
✅ RabbitMQ connection established
=== Service Monitor Report ===
Status: HEALTHY
Uptime: 180s
Connection Uptime: 180s
Messages Processed: 45
Messages Published: 12
Errors: 0
Reconnections: 0
============================
```

### Health Status Levels
- **🟢 HEALTHY**: All systems operational
- **🟡 DEGRADED**: Recent issues but still functional  
- **🔴 UNHEALTHY**: No connection to RabbitMQ

## 🔄 Failure Recovery

### What Happens When...

**RabbitMQ Server Goes Down:**
- Service detects connection loss
- Starts exponential backoff reconnection
- Continues trying until server returns
- Automatically resumes operation

**Network Issues:**
- Connection monitoring detects problems
- Graceful degradation of service
- Automatic recovery when network restored

**High Error Rate:**
- Circuit breaker activates
- Prevents cascading failures
- Automatic recovery attempts

## 🛠️ Operations

### Starting the Service
```bash
# Development with hot reload
npm run dev

# Production build and start
npm run start:prod

# Background process (Linux/macOS)
nohup npm start > app.log 2>&1 &
```

### Stopping the Service
```bash
# Graceful shutdown (Ctrl+C or)
kill -SIGTERM <PID>

# Force stop (if needed)
kill -SIGKILL <PID>
```

### Log Monitoring
```bash
# Follow logs in development
npm run dev

# Production logs
tail -f app.log

# Filter for errors
grep -i error app.log
```

## 🚨 Troubleshooting

### Common Issues

**"Failed to connect to RabbitMQ"**
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check connection string
echo $RABBITMQ_URL

# Test manual connection
telnet localhost 5672
```

**"Circuit breaker is open"**
- High error rate detected
- Check message processing logic
- Increase `CB_FAILURE_THRESHOLD` if needed
- Wait for automatic recovery

**"No RabbitMQ connection"**
- Service is attempting reconnection
- Check RabbitMQ server status
- Verify network connectivity
- Review connection logs

### Debugging Commands
```bash
# Check service health
npm run health

# View connection state
node -e "console.log(require('./dist/utils/rabbitmq').getConnectionState())"

# Test connection manually
node -e "require('./dist/utils/rabbitmq').connectRabbitMQ().then(console.log)"
```

## 📈 Performance Tuning

### Connection Settings
Adjust in `.env`:
```bash
# Faster reconnection (development)
RECONNECT_DELAY=1000
MAX_RECONNECT_DELAY=5000

# Slower reconnection (production)
RECONNECT_DELAY=5000
MAX_RECONNECT_DELAY=30000
```

### Circuit Breaker Tuning
```bash
# More tolerant (fewer breaks)
CB_FAILURE_THRESHOLD=10
CB_RESET_TIMEOUT=60000

# Less tolerant (faster breaks)
CB_FAILURE_THRESHOLD=3
CB_RESET_TIMEOUT=15000
```

## 🔒 Production Deployment

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["npm", "start"]
```

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start dist/index.js --name rabbitmq-service

# Using systemd (Linux)
# Create /etc/systemd/system/rabbitmq-service.service
[Unit]
Description=RabbitMQ Service
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/app
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### Monitoring in Production
- Set up log aggregation (ELK, Splunk)
- Configure alerting for health status
- Monitor resource usage (CPU, Memory)
- Set up RabbitMQ monitoring

## 📝 Maintenance

### Regular Tasks
- Monitor log files for errors
- Check RabbitMQ queue lengths
- Review connection metrics
- Update dependencies
- Test failure scenarios

### Backup Considerations
- RabbitMQ queue persistence
- Service configuration files
- Environment variables
- Application logs

## 🆘 Emergency Procedures

### Service Won't Start
1. Check RabbitMQ server status
2. Verify environment variables
3. Check port availability
4. Review recent changes
5. Check disk space and permissions

### High Error Rate
1. Check RabbitMQ server health
2. Review recent message patterns
3. Check downstream dependencies
4. Increase circuit breaker threshold temporarily
5. Scale RabbitMQ resources if needed

### Memory/CPU Issues
1. Monitor process resources
2. Check for connection leaks
3. Review message processing logic
4. Consider horizontal scaling
5. Optimize message batch sizes
