// Service monitoring and metrics collection
import { getConnectionState } from './rabbitmq';

interface ServiceMetrics {
    uptime: number;
    messagesProcessed: number;
    messagesPublished: number;
    errors: number;
    connectionUptime: number;
    lastReconnection: Date | null;
    reconnectionCount: number;
}

class ServiceMonitor {
    private startTime = Date.now();
    private metrics: ServiceMetrics = {
        uptime: 0,
        messagesProcessed: 0,
        messagesPublished: 0,
        errors: 0,
        connectionUptime: 0,
        lastReconnection: null,
        reconnectionCount: 0
    };
    private connectionStartTime = Date.now();

    updateConnectionMetrics(): void {
        const state = getConnectionState();
        if (state.isHealthy) {
            this.metrics.connectionUptime = Date.now() - this.connectionStartTime;
        } else {
            this.connectionStartTime = Date.now();
        }
    }

    incrementMessagesProcessed(): void {
        this.metrics.messagesProcessed++;
    }

    incrementMessagesPublished(): void {
        this.metrics.messagesPublished++;
    }

    incrementErrors(): void {
        this.metrics.errors++;
    }

    recordReconnection(): void {
        this.metrics.reconnectionCount++;
        this.metrics.lastReconnection = new Date();
        this.connectionStartTime = Date.now();
    }

    getMetrics(): ServiceMetrics & { connectionState: any } {
        this.metrics.uptime = Date.now() - this.startTime;
        this.updateConnectionMetrics();
        
        return {
            ...this.metrics,
            connectionState: getConnectionState()
        };
    }

    getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
        const state = getConnectionState();
        const metrics = this.getMetrics();
        
        if (!state.isHealthy) {
            return {
                status: 'unhealthy',
                details: {
                    reason: 'No RabbitMQ connection',
                    lastError: state.lastError?.message,
                    reconnectAttempts: state.reconnectAttempts
                }
            };
        }
        
        if (state.reconnectAttempts > 0 || metrics.errors > 10) {
            return {
                status: 'degraded',
                details: {
                    reason: 'Recent connection issues or high error rate',
                    reconnectAttempts: state.reconnectAttempts,
                    errorCount: metrics.errors
                }
            };
        }
        
        return {
            status: 'healthy',
            details: metrics
        };
    }

    startPeriodicReporting(intervalMs = 60000): void {
        setInterval(() => {
            const health = this.getHealthStatus();
            const metrics = this.getMetrics();
            
            console.log('=== Service Monitor Report ===');
            console.log(`Status: ${health.status.toUpperCase()}`);
            console.log(`Uptime: ${Math.floor(metrics.uptime / 1000)}s`);
            console.log(`Connection Uptime: ${Math.floor(metrics.connectionUptime / 1000)}s`);
            console.log(`Messages Processed: ${metrics.messagesProcessed}`);
            console.log(`Messages Published: ${metrics.messagesPublished}`);
            console.log(`Errors: ${metrics.errors}`);
            console.log(`Reconnections: ${metrics.reconnectionCount}`);
            if (metrics.lastReconnection) {
                console.log(`Last Reconnection: ${metrics.lastReconnection.toISOString()}`);
            }
            console.log('============================\n');
        }, intervalMs);
    }
}

export const serviceMonitor = new ServiceMonitor();
export default serviceMonitor;
