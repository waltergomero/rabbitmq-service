// Publisher for RabbitMQ messages
import { connectRabbitMQ, getRabbitMQChannel, waitForConnection } from '../utils/rabbitmq';
import { getRabbitMQConfig } from '../config/rabbitenv';
import * as amqp from 'amqplib';

const RabbitMQConfig = getRabbitMQConfig();

// Enhanced publish with retry logic
export async function publishMessage(queue: string, message: string, retries = 3): Promise<void> {
    let attempt = 0;
    
    while (attempt < retries) {
        try {
            await waitForConnection();
            const { channel } = await connectRabbitMQ();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            
            // Create queue if it doesn't exist 
            await channel.assertQueue(queue, { durable: true });
            
            const sent = channel.sendToQueue(queue, Buffer.from(message), { 
                persistent: true,
                deliveryMode: 2 // Make message persistent
            });
            
            if (!sent) {
                throw new Error('Message was not sent - queue might be full');
            }
            
            console.log(`Message sent to queue ${queue}: ${message}`);
            return;
            
        } catch (error) {
            attempt++;
            console.error(`Failed to publish message (attempt ${attempt}/${retries}):`, error);
            
            if (attempt >= retries) {
                throw new Error(`Failed to publish message after ${retries} attempts: ${error}`);
            }
            
            // Wait before retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function publishToExchange(exchange: string, routingKey: string, message: string, retries = 3): Promise<void> {
    let attempt = 0;
    
    while (attempt < retries) {
        try {
            await waitForConnection();
            const { channel } = await connectRabbitMQ();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            
            // Create exchange if it doesn't exist
            await channel.assertExchange(exchange, 'direct', { durable: true });
            
            const sent = channel.publish(exchange, routingKey, Buffer.from(message), { 
                persistent: true,
                deliveryMode: 2
            });
            
            if (!sent) {
                throw new Error('Message was not sent - channel might be blocked');
            }
            
            console.log(`Message sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
            return;
            
        } catch (error) {
            attempt++;
            console.error(`Failed to publish message to exchange (attempt ${attempt}/${retries}):`, error);
            
            if (attempt >= retries) {
                throw new Error(`Failed to publish message to exchange after ${retries} attempts: ${error}`);
            }
            
            // Wait before retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
export async function closePublisher(): Promise<void> {
    const { channel } = await connectRabbitMQ();
    if (channel) {
        await channel.close();
        console.log('Publisher channel closed');
    }
}
export function getPublisherChannel(): amqp.Channel | null {
    return getRabbitMQChannel();
}

export async function publishToQueue(queue: string, message: string): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        console.log(`Message sent to queue ${queue}: ${message}`);
    } catch (error) {
        console.error('Failed to publish message:', error);
    }
}

export async function publishToExchangeWithRoutingKey(exchange: string, routingKey: string, message: string): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
         // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        channel.publish(exchange, routingKey, Buffer.from(message), { persistent: true });
        console.log(`Message sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
    } catch (error) {
        console.error('Failed to publish message to exchange:', error);
    }
}

export async function closePublisherChannel(): Promise<void> {
    const { channel } = await connectRabbitMQ();
    if (channel) {
        await channel.close();
        console.log('Publisher channel closed');
    }
}

// New function to create exchange and bind queue
export async function publishToExchangeWithQueue(exchange: string, queue: string, routingKey: string, message: string): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }

        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        
        // Bind queue to exchange with routing key
        await channel.bindQueue(queue, exchange, routingKey);
        
        channel.publish(exchange, routingKey, Buffer.from(message), { persistent: true });
        console.log(`Message sent to exchange ${exchange} -> queue ${queue} with routing key ${routingKey}: ${message}`);
    } catch (error) {
        console.error('Failed to publish message to exchange with queue:', error);
    }
}

if (require.main === module) {
    const MESSAGE_QUEUE = RabbitMQConfig.queue;
    const MESSAGE_EXCHANGE = RabbitMQConfig.exchange;
    const MESSAGE_ROUTING_KEY = RabbitMQConfig.routingKey;
    
    const message = {
        to:  "luisaqgomero@hotmail.com",
        from: "walter.gomero@gmail.com",
        subject: "Test Message",
        body: "This is a test message. Please ignore it."
    };

    async function runTest() {
        try {
            await publishToExchangeWithQueue(MESSAGE_EXCHANGE, MESSAGE_QUEUE, MESSAGE_ROUTING_KEY, JSON.stringify(message));
            console.log('Test message published successfully');
        } catch (error) {
            console.error('Error publishing test message:', error);
        } finally {
            await closePublisher();
        }
    }

    runTest();
}