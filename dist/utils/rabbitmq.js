"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onConnection = onConnection;
exports.onDisconnection = onDisconnection;
exports.removeConnectionListener = removeConnectionListener;
exports.removeDisconnectionListener = removeDisconnectionListener;
exports.connectRabbitMQ = connectRabbitMQ;
exports.closeRabbitMQ = closeRabbitMQ;
exports.getRabbitMQChannel = getRabbitMQChannel;
exports.getConnectionState = getConnectionState;
exports.waitForConnection = waitForConnection;
const amqp = __importStar(require("amqplib"));
const rabbitenv_1 = require("../config/rabbitenv");
const state = {
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
const connectionListeners = new Set();
const disconnectionListeners = new Set();
function onConnection(callback) {
    connectionListeners.add(callback);
}
function onDisconnection(callback) {
    disconnectionListeners.add(callback);
}
function removeConnectionListener(callback) {
    connectionListeners.delete(callback);
}
function removeDisconnectionListener(callback) {
    disconnectionListeners.delete(callback);
}
// Exponential backoff calculation
function calculateReconnectDelay(attempt) {
    const delay = Math.min(CONFIG.reconnectDelay * Math.pow(2, attempt), CONFIG.maxReconnectDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
}
// Health check function
async function performHealthCheck() {
    try {
        if (!state.connection || !state.channel) {
            return false;
        }
        // Try to assert a temporary queue to test connection
        const testQueue = `health_check_${Date.now()}`;
        await state.channel.assertQueue(testQueue, { durable: false, autoDelete: true });
        await state.channel.deleteQueue(testQueue);
        return true;
    }
    catch (error) {
        console.warn('Health check failed:', error);
        return false;
    }
}
// Start periodic health checks
function startHealthCheck() {
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
function setupConnectionHandlers(connection) {
    connection.on('error', (error) => {
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
    connection.on('blocked', (reason) => {
        console.warn('RabbitMQ connection blocked:', reason);
    });
    connection.on('unblocked', () => {
        console.info('RabbitMQ connection unblocked');
    });
}
// Setup channel event handlers
function setupChannelHandlers(channel) {
    channel.on('error', (error) => {
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
async function createChannel(retryCount = 0) {
    try {
        if (!state.connection) {
            throw new Error('No connection available');
        }
        const channel = await state.connection.createChannel();
        setupChannelHandlers(channel);
        state.channel = channel;
        console.log('RabbitMQ channel created successfully');
        return channel;
    }
    catch (error) {
        console.error(`Failed to create channel (attempt ${retryCount + 1}):`, error);
        if (retryCount < CONFIG.channelMaxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return createChannel(retryCount + 1);
        }
        state.lastError = error;
        return null;
    }
}
// Reconnection with exponential backoff
async function reconnectWithBackoff() {
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
        }
        catch (error) {
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
async function connectRabbitMQ() {
    if (state.connection && state.channel && state.isHealthy) {
        return { connection: state.connection, channel: state.channel };
    }
    try {
        // Clean up existing connections
        await closeRabbitMQ();
        console.log('Connecting to RabbitMQ...');
        const connection = await amqp.connect(rabbitenv_1.RABBITMQ_URL);
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
    }
    catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        state.lastError = error;
        state.isHealthy = false;
        throw error;
    }
}
async function closeRabbitMQ() {
    try {
        if (state.channel) {
            await state.channel.close();
        }
    }
    catch (error) {
        console.warn('Error closing channel:', error);
    }
    try {
        if (state.connection) {
            await state.connection.close();
        }
    }
    catch (error) {
        console.warn('Error closing connection:', error);
    }
    state.connection = null;
    state.channel = null;
    state.isHealthy = false;
    console.log('Disconnected from RabbitMQ');
}
function getRabbitMQChannel() {
    return state.isHealthy ? state.channel : null;
}
function getConnectionState() {
    return { ...state };
}
async function waitForConnection(timeout = 30000) {
    const startTime = Date.now();
    while (!state.isHealthy && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!state.isHealthy) {
        throw new Error(`Failed to establish connection within ${timeout}ms`);
    }
}
//# sourceMappingURL=rabbitmq.js.map