// Publisher for RabbitMQ messages
import { connectRabbitMQ, getRabbitMQChannel } from '../utils/rabbitmq';
import { getRabbitMQConfig } from '../config/rabbitenv';
import * as amqp from 'amqplib';

const RabbitMQConfig = getRabbitMQConfig();

export async function publishMessage(queue: string, message: string): Promise<void> {
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
export async function publishToExchange(exchange: string, routingKey: string, message: string): Promise<void> {
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