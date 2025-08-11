import * as amqp from 'amqplib';
import { RABBITMQ_URL } from '../config/rabbitenv';

// Use any for now to avoid type issues with amqplib
interface ConnectionState {
    connection: any | null;
    channel: any | null;
    isConnecting: boolean;
    isHealthy: boolean;
    reconnectAttempts: number;
    lastError: Error | null;
}

const state: ConnectionState = {
    connection: null,
    channel: null,
    isConnecting: false,
    isHealthy: false,
    reconnectAttempts: 0,
    lastError: null
};

const CONFIG = {
    maxReconnectAttempts: 10,
    reconnectDelay: 5000, // 5 seconds
    maxReconnectDelay: 30000, // 30 seconds
    healthCheckInterval: 30000, // 30 seconds
    channelMaxRetries: 3
};

// Event listeners for connection management
const connectionListeners = new Set<() => void>();
const disconnectionListeners = new Set<(error?: Error) => void>();

export function onConnection(callback: () => void): void {
    connectionListeners.add(callback);
}

export function onDisconnection(callback: (error?: Error) => void): void {
    disconnectionListeners.add(callback);
}

export function removeConnectionListener(callback: () => void): void {
    connectionListeners.delete(callback);
}

export function removeDisconnectionListener(callback: (error?: Error) => void): void {
    disconnectionListeners.delete(callback);
}

// Exponential backoff calculation
function calculateReconnectDelay(attempt: number): number {
    const delay = Math.min(
        CONFIG.reconnectDelay * Math.pow(2, attempt),
        CONFIG.maxReconnectDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
}

// Health check function
async function performHealthCheck(): Promise<boolean> {
    try {
        if (!state.connection || !state.channel) {
            return false;
        }
        
        // Try to assert a temporary queue to test connection
        const testQueue = `health_check_${Date.now()}`;
        await state.channel.assertQueue(testQueue, { durable: false, autoDelete: true });
        await state.channel.deleteQueue(testQueue);
        return true;
    } catch (error) {
        console.warn('Health check failed:', error);
        return false;
    }
}

// Start periodic health checks
function startHealthCheck(): void {
    setInterval(async () => {
        if (state.isHealthy) {
            const healthy = await performHealthCheck();
            if (!healthy && state.isHealthy) {
                console.warn('Health check failed, marking connection as unhealthy');
                state.isHealthy = false;
                // Trigger reconnection
                await reconnectWithBackoff();
            }
        }
    }, CONFIG.healthCheckInterval);
}

// Setup connection event handlers  
function setupConnectionHandlers(connection: any): void {
    connection.on('error', (error: Error) => {
        console.error('RabbitMQ connection error:', error);
        state.lastError = error;
        state.isHealthy = false;
        disconnectionListeners.forEach(listener => listener(error));
        reconnectWithBackoff();
    });

    connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
        state.isHealthy = false;
        disconnectionListeners.forEach(listener => listener());
        reconnectWithBackoff();
    });

    connection.on('blocked', (reason: any) => {
        console.warn('RabbitMQ connection blocked:', reason);
    });

    connection.on('unblocked', () => {
        console.info('RabbitMQ connection unblocked');
    });
}

// Setup channel event handlers
function setupChannelHandlers(channel: any): void {
    channel.on('error', (error: Error) => {
        console.error('RabbitMQ channel error:', error);
        state.lastError = error;
        // Try to recreate channel
        createChannel();
    });

    channel.on('close', () => {
        console.warn('RabbitMQ channel closed');
        // Try to recreate channel
        createChannel();
    });
}

// Create or recreate channel with retry logic
async function createChannel(retryCount = 0): Promise<any | null> {
    try {
        if (!state.connection) {
            throw new Error('No connection available');
        }

        const channel = await state.connection.createChannel();
        setupChannelHandlers(channel);
        state.channel = channel;
        console.log('RabbitMQ channel created successfully');
        return channel;
    } catch (error) {
        console.error(`Failed to create channel (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < CONFIG.channelMaxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return createChannel(retryCount + 1);
        }
        
        state.lastError = error as Error;
        return null;
    }
}

// Reconnection with exponential backoff
async function reconnectWithBackoff(): Promise<void> {
    if (state.isConnecting) {
        return; // Already attempting to reconnect
    }

    state.isConnecting = true;
    
    while (state.reconnectAttempts < CONFIG.maxReconnectAttempts && !state.isHealthy) {
        try {
            const delay = calculateReconnectDelay(state.reconnectAttempts);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${state.reconnectAttempts + 1}/${CONFIG.maxReconnectAttempts})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            await connectRabbitMQ();
            
            if (state.isHealthy) {
                console.log('Successfully reconnected to RabbitMQ');
                state.reconnectAttempts = 0;
                break;
            }
        } catch (error) {
            state.reconnectAttempts++;
            console.error(`Reconnection attempt ${state.reconnectAttempts} failed:`, error);
        }
    }
    
    state.isConnecting = false;
    
    if (state.reconnectAttempts >= CONFIG.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Service will continue trying...');
        // Reset attempts and continue trying
        state.reconnectAttempts = 0;
        setTimeout(() => reconnectWithBackoff(), CONFIG.maxReconnectDelay);
    }
}

export async function connectRabbitMQ(): Promise<{ connection: any; channel: any }> {
    if (state.connection && state.channel && state.isHealthy) {
        return { connection: state.connection, channel: state.channel };
    }

    try {
        // Clean up existing connections
        await closeRabbitMQ();
        
        console.log('Connecting to RabbitMQ...');
        const connection = await amqp.connect(RABBITMQ_URL);
        setupConnectionHandlers(connection);
        
        // Set the connection in state BEFORE creating the channel
        state.connection = connection;
        
        const channel = await createChannel();
        if (!channel) {
            throw new Error('Failed to create channel');
        }

        state.channel = channel;
        state.isHealthy = true;
        state.lastError = null;
        
        // Start health checks if this is the first connection
        if (connectionListeners.size === 0) {
            startHealthCheck();
        }
        
        connectionListeners.forEach(listener => listener());
        console.log('Connected to RabbitMQ successfully');
        
        return { connection, channel };
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        state.lastError = error as Error;
        state.isHealthy = false;
        throw error;
    }
}

export async function closeRabbitMQ(): Promise<void> {
    try {
        if (state.channel) {
            await state.channel.close();
        }
    } catch (error) {
        console.warn('Error closing channel:', error);
    }
    
    try {
        if (state.connection) {
            await state.connection.close();
        }
    } catch (error) {
        console.warn('Error closing connection:', error);
    }
    
    state.connection = null;
    state.channel = null;
    state.isHealthy = false;
    console.log('Disconnected from RabbitMQ');
}

export function getRabbitMQChannel(): any | null {
    return state.isHealthy ? state.channel : null;
}

export function getConnectionState(): Readonly<ConnectionState> {
    return { ...state };
}

export async function waitForConnection(timeout = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (!state.isHealthy && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!state.isHealthy) {
        throw new Error(`Failed to establish connection within ${timeout}ms`);
    }
}