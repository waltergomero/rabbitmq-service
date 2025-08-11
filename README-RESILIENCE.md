# Resilient RabbitMQ Service

A production-ready RabbitMQ service built with TypeScript that implements multiple resilience patterns to ensure high availability and fault tolerance.

## 🚀 Features

### Core Resilience Patterns

1. **Automatic Reconnection with Exponential Backoff**
   - Automatically reconnects when connection is lost
   - Exponential backoff with jitter to prevent thundering herd
   - Configurable retry attempts and delays

2. **Circuit Breaker Pattern**
   - Prevents cascading failures by opening circuit after threshold failures
   - Automatically attempts recovery with half-open state
   - Protects downstream services from being overwhelmed

3. **Health Monitoring**
   - Continuous health checks of connections and channels
   - Periodic health status reporting
   - Connection state tracking and metrics

4. **Message Processing Resilience**
   - Manual acknowledgments for guaranteed processing
   - Negative acknowledgments with requeuing for failed messages
   - Retry logic with exponential backoff for publishers

5. **Graceful Shutdown**
   - Proper cleanup of connections and channels
   - Signal handling (SIGINT, SIGTERM)
   - Prevents message loss during shutdown

6. **Error Handling**
   - Comprehensive error logging without crashing
   - Uncaught exception and unhandled rejection handlers
   - Error metrics and tracking

## 📁 Project Structure

```
src/
├── config/
│   ├── rabbitenv.ts          # Original RabbitMQ configuration
│   └── resilience.ts         # Resilience configuration
├── rabbitmq/
│   ├── consumer.ts           # Enhanced consumer with reconnection
│   ├── publisher.ts          # Enhanced publisher with retry logic
│   └── check-queue.ts        # Queue checking utilities
├── utils/
│   ├── rabbitmq.ts          # Core resilient connection management
│   └── monitor.ts           # Service monitoring and metrics
└── index.ts                 # Main service with all resilience features
```

## 🔧 Configuration

### Environment Variables

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=task_queue
RABBITMQ_EXCHANGE=task_exchange
RABBITMQ_ROUTING_KEY=task_routing_key

# Resilience Settings
MAX_RECONNECT_ATTEMPTS=10
RECONNECT_DELAY=5000
MAX_RECONNECT_DELAY=30000
HEALTH_CHECK_INTERVAL=30000
CHANNEL_MAX_RETRIES=3

# Circuit Breaker
CB_FAILURE_THRESHOLD=5
CB_TIMEOUT=60000
CB_RESET_TIMEOUT=30000

# Retry Logic
MAX_RETRIES=3
BASE_DELAY=1000
MAX_DELAY=10000

# Monitoring
HEALTH_REPORT_INTERVAL=30000
METRICS_REPORT_INTERVAL=60000
```

## 🏃‍♂️ Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📊 Monitoring and Health Checks

The service provides comprehensive monitoring:

### Health Status Levels
- **Healthy**: All systems operational
- **Degraded**: Recent connection issues or high error rate
- **Unhealthy**: No RabbitMQ connection

### Metrics Tracked
- Service uptime
- Connection uptime
- Messages processed/published
- Error count
- Reconnection count and timestamps
- Connection state details

### Health Check Response Example
```json
{
  "status": "healthy",
  "connection": {
    "isHealthy": true,
    "isConnecting": false,
    "reconnectAttempts": 0,
    "lastError": null
  },
  "circuitBreaker": {
    "state": "closed",
    "failures": 0
  }
}
```

## 🔄 Failure Scenarios Handled

1. **RabbitMQ Server Down**
   - Service continues running
   - Automatic reconnection attempts
   - Exponential backoff prevents resource exhaustion

2. **Network Connectivity Issues**
   - Connection monitoring detects issues
   - Automatic recovery when network restored
   - Message queuing resumes seamlessly

3. **Channel Errors**
   - Automatic channel recreation
   - Independent retry logic for channels
   - Consumer/Publisher operations continue

4. **Message Processing Failures**
   - Circuit breaker prevents cascading failures
   - Failed messages are requeued
   - Error tracking and logging

5. **Resource Exhaustion**
   - Circuit breaker opens to prevent overload
   - Configurable thresholds and timeouts
   - Automatic recovery attempts

## 🛠️ Usage Examples

### Basic Consumer
```typescript
import { consumeMessage } from './rabbitmq/consumer';

await consumeMessage('my-queue', (msg) => {
    if (msg) {
        console.log('Received:', msg.content.toString());
        // Message will be automatically acknowledged if processing succeeds
        // or negatively acknowledged if an error is thrown
    }
});
```

### Basic Publisher with Retry
```typescript
import { publishMessage } from './rabbitmq/publisher';

try {
    await publishMessage('my-queue', 'Hello World!', 3); // 3 retry attempts
    console.log('Message sent successfully');
} catch (error) {
    console.error('Failed to send message after retries:', error);
}
```

### Monitoring Integration
```typescript
import { serviceMonitor } from './utils/monitor';

// Get current metrics
const metrics = serviceMonitor.getMetrics();

// Get health status
const health = serviceMonitor.getHealthStatus();

// Start periodic reporting
serviceMonitor.startPeriodicReporting(60000); // Every minute
```

## 🔧 Customization

### Modifying Resilience Settings
Edit `src/config/resilience.ts` to adjust:
- Reconnection attempts and delays
- Circuit breaker thresholds
- Health check intervals
- Retry policies

### Adding Custom Message Handlers
Implement custom processing logic in the message callback:

```typescript
async function customMessageProcessor(msg: any): Promise<void> {
    if (!msg) return;
    
    try {
        const data = JSON.parse(msg.content.toString());
        
        // Your custom processing logic here
        await processBusinessLogic(data);
        
        // Manual acknowledgment if using noAck: false
        const channel = getRabbitMQChannel();
        if (channel) {
            channel.ack(msg);
        }
    } catch (error) {
        console.error('Processing failed:', error);
        
        // Negative acknowledgment - requeue message
        const channel = getRabbitMQChannel();
        if (channel) {
            channel.nack(msg, false, true);
        }
    }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Service not connecting**
   - Check RABBITMQ_URL environment variable
   - Verify RabbitMQ server is running
   - Check network connectivity

2. **High reconnection attempts**
   - Increase MAX_RECONNECT_DELAY
   - Check RabbitMQ server stability
   - Monitor network connectivity

3. **Circuit breaker frequently opening**
   - Increase CB_FAILURE_THRESHOLD
   - Check message processing logic
   - Monitor downstream dependencies

### Debug Logging
The service provides detailed logging for:
- Connection state changes
- Reconnection attempts
- Circuit breaker state changes
- Message processing errors
- Health check results

## 📈 Performance Considerations

- **Connection Pooling**: Single connection with multiple channels
- **Message Persistence**: Configurable durability settings
- **Backpressure Handling**: Built-in flow control
- **Resource Management**: Automatic cleanup and monitoring
- **Scalability**: Designed for horizontal scaling

## 🔒 Production Deployment

For production environments:

1. Set appropriate environment variables
2. Configure monitoring and alerting
3. Set up log aggregation
4. Monitor resource usage
5. Configure backup and recovery procedures
6. Set up load balancing if needed

## 📝 License

This project is licensed under the ISC License.
