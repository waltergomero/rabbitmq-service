//consumer for RabbitMQ messages
import { connectRabbitMQ, getRabbitMQChannel } from '../utils/rabbitmq';
import { getRabbitMQConfig } from '../config/rabbitenv';
import * as amqp from 'amqplib';
const RabbitMQConfig = getRabbitMQConfig();

export async function consumeMessage(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue}`);
    } catch (error) {
        console.error('Failed to consume message:', error);
    }
}

export async function consumeFromExchange(exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue('', exchange, routingKey);
        channel.consume('', callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to consume message from exchange:', error);
    }
}

export async function closeConsumer(): Promise<void> {
    const { channel } = await connectRabbitMQ();
    if (channel) {
        await channel.close();
        console.log('Consumer channel closed');
    }
}
export function getConsumerChannel(): amqp.Channel | null {
    return getRabbitMQChannel();
}

export async function consumeFromQueue(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue}`);
    } catch (error) {
        console.error('Failed to consume message from queue:', error);
    }
}

export async function consumeFromExchangeWithRoutingKey(exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue('', exchange, routingKey);
        channel.consume('', callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to consume message from exchange with routing key:', error);
    }
}

export async function consumeFromQueueWithRoutingKey(queue: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue} with routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to consume message from queue with routing key:', error);
    }
}

export async function consumeFromExchangeWithRoutingKeyAndQueue(exchange: string, routingKey: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey} and queue ${queue}`);
    } catch (error) {
        console.error('Failed to consume message from exchange with routing key and queue:', error);
    }
}

export async function consumeFromQueueWithExchange(queue: string, exchange: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.bindQueue(queue, exchange, '');
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue} with exchange ${exchange}`);
    } catch (error) {
        console.error('Failed to consume message from queue with exchange:', error);
    }
}

export async function consumeFromExchangeWithQueue(exchange: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, '');
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with queue ${queue}`);
    } catch (error) {
        console.error('Failed to consume message from exchange with queue:', error);
    }
}

export async function consumeFromExchangeWithRoutingKeyAndQueueAndCallback(exchange: string, routingKey: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey} and queue ${queue}`);
    } catch (error) {
        console.error('Failed to consume message from exchange with routing key and queue:', error);
    }
}

export async function consumeFromQueueWithExchangeAndRoutingKey(queue: string, exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue} with exchange ${exchange} and routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to consume message from queue with exchange and routing key:', error);
    }
}

export async function consumeFromExchangeWithQueueAndRoutingKey(exchange: string, queue: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with queue ${queue} and routing key ${routingKey}`);
    } catch (error) {
        console.error('Failed to consume message from exchange with queue and routing key:', error);
    }
}



if (require.main === module) {
    const MESSAGE_QUEUE = RabbitMQConfig.queue;
    const MESSAGE_EXCHANGE = RabbitMQConfig.exchange;
    const MESSAGE_ROUTING_KEY = RabbitMQConfig.routingKey;

    async function runTest() {
        try {
            await consumeFromExchangeWithQueue(MESSAGE_EXCHANGE, MESSAGE_QUEUE, (msg) => {
                console.log('Received message from exchange with queue:', msg?.content.toString());
            });
        } catch (error) {
            console.error('Error consuming message:', error);
        }
    }

    runTest();
}