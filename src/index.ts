import { connectRabbitMQ, closeRabbitMQ, onConnection, onDisconnection, getConnectionState } from './utils/rabbitmq';
import { consumeMessage } from './rabbitmq/consumer';
import { publishMessage } from './rabbitmq/publisher';

// Circuit breaker for preventing cascading failures
class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    
    constructor(
        private failureThreshold = 5,
        private timeout = 60000, // 1 minute
        private resetTimeout = 30000 // 30 seconds
    ) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'half-open';
                console.log('Circuit breaker moving to half-open state');
            } else {
                throw new Error('Circuit breaker is open');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
            console.log(`Circuit breaker opened after ${this.failures} failures`);
        }
    }

    getState(): { state: string; failures: number } {
        return { state: this.state, failures: this.failures };
    }
}

// Create circuit breaker instance
const circuitBreaker = new CircuitBreaker();

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process - log and continue
});

// Health check endpoint simulation
async function healthCheck(): Promise<{ status: string; connection: any; circuitBreaker: any }> {
    const connectionState = getConnectionState();
    const cbState = circuitBreaker.getState();
    
    return {
        status: connectionState.isHealthy ? 'healthy' : 'unhealthy',
        connection: {
            isHealthy: connectionState.isHealthy,
            isConnecting: connectionState.isConnecting,
            reconnectAttempts: connectionState.reconnectAttempts,
            lastError: connectionState.lastError?.message
        },
        circuitBreaker: cbState
    };
}

// Message processing with circuit breaker
async function processMessage(msg: any): Promise<void> {
    if (!msg) return;
    
    try {
        await circuitBreaker.execute(async () => {
            const messageContent = msg.content.toString();
            console.log('Processing message:', messageContent);
            
            // Simulate message processing
            if (messageContent.includes('error')) {
                throw new Error('Simulated processing error');
            }
            
            // Acknowledge successful processing
            const channel = await import('./utils/rabbitmq').then(m => m.getRabbitMQChannel());
            if (channel) {
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Failed to process message:', error);
        
        // Negative acknowledgment - requeue message
        const channel = await import('./utils/rabbitmq').then(m => m.getRabbitMQChannel());
        if (channel) {
            channel.nack(msg, false, true);
        }
    }
}

// Periodic health reporting
function startHealthReporting(): void {
    setInterval(async () => {
        try {
            const health = await healthCheck();
            console.log('Health Status:', JSON.stringify(health, null, 2));
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }, 30000); // Every 30 seconds
}

// Main service startup
async function startRabbitMQService(): Promise<void> {
    console.log('Starting resilient RabbitMQ service...');
    
    // Setup connection event listeners
    onConnection(() => {
        console.log('✅ RabbitMQ connection established');
    });
    
    onDisconnection((error) => {
        console.log('❌ RabbitMQ connection lost:', error?.message || 'Unknown reason');
    });

    try {
        // Initial connection attempt
        await connectRabbitMQ();
        
        // Start consuming messages with automatic reconnection
        const queue = process.env.RABBITMQ_QUEUE || 'task_queue';
        await consumeMessage(queue, processMessage);
        
        // Start health reporting
        startHealthReporting();
        
        // Example: Send a test message every minute
        const sendTestMessages = async () => {
            try {
                await circuitBreaker.execute(async () => {
                    const testMessage = `Test message at ${new Date().toISOString()}`;
                    await publishMessage(queue, testMessage);
                });
            } catch (error) {
                console.error('Failed to send test message:', error);
            }
        };
        
        // Send test message initially and then every minute
        setTimeout(sendTestMessages, 5000); // First message after 5 seconds
        setInterval(sendTestMessages, 60000); // Then every minute
        
        console.log('✅ RabbitMQ service started successfully');
        console.log(`   Queue: ${queue}`);
        console.log('   Features: Auto-reconnect, Circuit breaker, Health monitoring');
        
    } catch (error) {
        console.error('Failed to start RabbitMQ service initially:', error);
        console.log('Service will continue trying to connect...');
    }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
        await closeRabbitMQ();
        console.log('✅ RabbitMQ connections closed');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the service
startRabbitMQService().catch((error) => {
    console.error('Fatal error starting service:', error);
    // Don't exit - let the reconnection logic handle it
});

// Keep the process alive
process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});

console.log('🚀 RabbitMQ Service Process Started (PID:', process.pid, ')');
console.log('   Press Ctrl+C to gracefully shutdown');