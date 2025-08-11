"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeMessage = consumeMessage;
exports.consumeFromExchange = consumeFromExchange;
exports.closeConsumer = closeConsumer;
exports.getConsumerChannel = getConsumerChannel;
exports.consumeFromQueue = consumeFromQueue;
exports.consumeFromExchangeWithRoutingKey = consumeFromExchangeWithRoutingKey;
exports.consumeFromQueueWithRoutingKey = consumeFromQueueWithRoutingKey;
exports.consumeFromExchangeWithRoutingKeyAndQueue = consumeFromExchangeWithRoutingKeyAndQueue;
exports.consumeFromQueueWithExchange = consumeFromQueueWithExchange;
exports.consumeFromExchangeWithQueue = consumeFromExchangeWithQueue;
exports.consumeFromExchangeWithRoutingKeyAndQueueAndCallback = consumeFromExchangeWithRoutingKeyAndQueueAndCallback;
exports.consumeFromQueueWithExchangeAndRoutingKey = consumeFromQueueWithExchangeAndRoutingKey;
exports.consumeFromExchangeWithQueueAndRoutingKey = consumeFromExchangeWithQueueAndRoutingKey;
//consumer for RabbitMQ messages
const rabbitmq_1 = require("../utils/rabbitmq");
const rabbitenv_1 = require("../config/rabbitenv");
const RabbitMQConfig = (0, rabbitenv_1.getRabbitMQConfig)();
const activeConsumers = new Map(); // Track active consumers
// Enhanced consume with automatic reconnection
async function consumeMessage(queue, callback) {
    const consumeWrapper = async () => {
        try {
            await (0, rabbitmq_1.waitForConnection)();
            const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            // Create queue if it doesn't exist
            await channel.assertQueue(queue, { durable: true });
            const consumer = await channel.consume(queue, (msg) => {
                try {
                    callback(msg);
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Failed to consume message:', error);
            // Retry after delay
            setTimeout(() => consumeWrapper(), 5000);
        }
    };
    // Setup reconnection listener
    (0, rabbitmq_1.onDisconnection)(() => {
        console.log(`Reconnecting consumer for queue: ${queue}`);
        setTimeout(() => consumeWrapper(), 1000);
    });
    await consumeWrapper();
}
async function consumeFromExchange(exchange, routingKey, callback) {
    const consumeWrapper = async () => {
        try {
            await (0, rabbitmq_1.waitForConnection)();
            const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
            if (!channel) {
                throw new Error('Channel is not available');
            }
            // Create exchange if it doesn't exist
            await channel.assertExchange(exchange, 'direct', { durable: true });
            // Create exclusive queue for this consumer
            const queueResult = await channel.assertQueue('', { exclusive: true });
            await channel.bindQueue(queueResult.queue, exchange, routingKey);
            const consumer = await channel.consume(queueResult.queue, (msg) => {
                try {
                    callback(msg);
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Failed to consume message from exchange:', error);
            // Retry after delay
            setTimeout(() => consumeWrapper(), 5000);
        }
    };
    // Setup reconnection listener
    (0, rabbitmq_1.onDisconnection)(() => {
        console.log(`Reconnecting consumer for exchange ${exchange}:${routingKey}`);
        setTimeout(() => consumeWrapper(), 1000);
    });
    await consumeWrapper();
}
async function closeConsumer() {
    const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
    if (channel) {
        await channel.close();
        console.log('Consumer channel closed');
    }
}
function getConsumerChannel() {
    return (0, rabbitmq_1.getRabbitMQChannel)();
}
async function consumeFromQueue(queue, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue}`);
    }
    catch (error) {
        console.error('Failed to consume message from queue:', error);
    }
}
async function consumeFromExchangeWithRoutingKey(exchange, routingKey, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue('', exchange, routingKey);
        channel.consume('', callback, { noAck: true });
        console.log(`Consumer started for exchange ${exchange} with routing key ${routingKey}`);
    }
    catch (error) {
        console.error('Failed to consume message from exchange with routing key:', error);
    }
}
async function consumeFromQueueWithRoutingKey(queue, routingKey, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, callback, { noAck: true });
        console.log(`Consumer started for queue ${queue} with routing key ${routingKey}`);
    }
    catch (error) {
        console.error('Failed to consume message from queue with routing key:', error);
    }
}
async function consumeFromExchangeWithRoutingKeyAndQueue(exchange, routingKey, queue, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to consume message from exchange with routing key and queue:', error);
    }
}
async function consumeFromQueueWithExchange(queue, exchange, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to consume message from queue with exchange:', error);
    }
}
async function consumeFromExchangeWithQueue(exchange, queue, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to consume message from exchange with queue:', error);
    }
}
async function consumeFromExchangeWithRoutingKeyAndQueueAndCallback(exchange, routingKey, queue, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to consume message from exchange with routing key and queue:', error);
    }
}
async function consumeFromQueueWithExchangeAndRoutingKey(queue, exchange, routingKey, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to consume message from queue with exchange and routing key:', error);
    }
}
async function consumeFromExchangeWithQueueAndRoutingKey(exchange, queue, routingKey, callback) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
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
        }
        catch (error) {
            console.error('Error consuming message:', error);
        }
    }
    runTest();
}
//# sourceMappingURL=consumer.js.map