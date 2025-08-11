//consumer for RabbitMQ messages
import { connectRabbitMQ, getRabbitMQChannel, onDisconnection, waitForConnection } from '../utils/rabbitmq';
import { getRabbitMQConfig } from '../config/rabbitenv';
import * as amqp from 'amqplib';

const RabbitMQConfig = getRabbitMQConfig();
const activeConsumers = new Map<string, string>(); // Track active consumers

// Enhanced consume with automatic reconnection
export async function consumeMessage(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    const consumeWrapper = async () => {
        try {
            await waitForConnection();
            const { channel } = await connectRabbitMQ();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            
            // Create queue if it doesn't exist
            await channel.assertQueue(queue, { durable: true });
            
            const consumer = await channel.consume(queue, (msg: any) => {
                try {
                    if (msg) {
                        console.log(`[CONSUMED] Message received from queue "${queue}":`, {
                            content: msg.content.toString(),
                            properties: msg.properties,
                            fields: msg.fields,
                            timestamp: new Date().toISOString()
                        });
                    }
                    callback(msg);
                } catch (error) {
                    console.error('Error in message callback:', error);
                    // Negative acknowledgment - message will be requeued
                    if (msg) {
                        channel.nack(msg, false, true);
                    }
                }
            }, { noAck: false }); // Changed to manual ack for better reliability
            
            if (consumer) {
                activeConsumers.set(queue, consumer.consumerTag);
                console.log(`Consumer started for queue ${queue} with tag: ${consumer.consumerTag}`);
            }
            
        } catch (error) {
            console.error('Failed to consume message:', error);
            // Retry after delay
            setTimeout(() => consumeWrapper(), 5000);
        }
    };

    // Setup reconnection listener
    onDisconnection(() => {
        console.log(`Reconnecting consumer for queue: ${queue}`);
        setTimeout(() => consumeWrapper(), 1000);
    });

    await consumeWrapper();
}

export async function consumeFromExchange(exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void> {
    const consumeWrapper = async () => {
        try {
            await waitForConnection();
            const { channel } = await connectRabbitMQ();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            
            // Create exchange if it doesn't exist
            await channel.assertExchange(exchange, 'direct', { durable: true });
            
            // Create exclusive queue for this consumer
            const queueResult = await channel.assertQueue('', { exclusive: true });
            await channel.bindQueue(queueResult.queue, exchange, routingKey);
            
            const consumer = await channel.consume(queueResult.queue, (msg: any) => {
                try {
                    if (msg) {
                        console.log(`[CONSUMED] Message received from exchange "${exchange}" with routing key "${routingKey}":`, {
                            content: msg.content.toString(),
                            properties: msg.properties,
                            fields: msg.fields,
                            timestamp: new Date().toISOString()
                        });
                    }
                    callback(msg);
                } catch (error) {
                    console.error('Error in message callback:', error);
                    if (msg) {
                        channel.nack(msg, false, true);
                    }
                }
            }, { noAck: false });
            
            if (consumer) {
                activeConsumers.set(`${exchange}:${routingKey}`, consumer.consumerTag);
                console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey}, tag: ${consumer.consumerTag}`);
            }
            
        } catch (error) {
            console.error('Failed to consume message from exchange:', error);
            // Retry after delay
            setTimeout(() => consumeWrapper(), 5000);
        }
    };

    // Setup reconnection listener
    onDisconnection(() => {
        console.log(`Reconnecting consumer for exchange ${exchange}:${routingKey}`);
        setTimeout(() => consumeWrapper(), 1000);
    });

    await consumeWrapper();
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from queue "${queue}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume('', (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from exchange "${exchange}" with routing key "${routingKey}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from queue "${queue}" with routing key "${routingKey}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from exchange "${exchange}" with routing key "${routingKey}" and queue "${queue}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from queue "${queue}" with exchange "${exchange}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from exchange "${exchange}" with queue "${queue}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from exchange "${exchange}" with routing key "${routingKey}" and queue "${queue}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from queue "${queue}" with exchange "${exchange}" and routing key "${routingKey}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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
        channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
            if (msg) {
                console.log(`[CONSUMED] Message received from exchange "${exchange}" with queue "${queue}" and routing key "${routingKey}":`, {
                    content: msg.content.toString(),
                    properties: msg.properties,
                    fields: msg.fields,
                    timestamp: new Date().toISOString()
                });
            }
            callback(msg);
        }, { noAck: true });
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