"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMessage = publishMessage;
exports.publishToExchange = publishToExchange;
exports.closePublisher = closePublisher;
exports.getPublisherChannel = getPublisherChannel;
exports.publishToQueue = publishToQueue;
exports.publishToExchangeWithRoutingKey = publishToExchangeWithRoutingKey;
exports.closePublisherChannel = closePublisherChannel;
exports.publishToExchangeWithQueue = publishToExchangeWithQueue;
// Publisher for RabbitMQ messages
const rabbitmq_1 = require("../utils/rabbitmq");
async function publishMessage(queue, message) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist 
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        console.log(`Message sent to queue ${queue}: ${message}`);
    }
    catch (error) {
        console.error('Failed to publish message:', error);
    }
}
async function publishToExchange(exchange, routingKey, message) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        channel.publish(exchange, routingKey, Buffer.from(message), { persistent: true });
        console.log(`Message sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
    }
    catch (error) {
        console.error('Failed to publish message to exchange:', error);
    }
}
async function closePublisher() {
    const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
    if (channel) {
        await channel.close();
        console.log('Publisher channel closed');
    }
}
function getPublisherChannel() {
    return (0, rabbitmq_1.getRabbitMQChannel)();
}
async function publishToQueue(queue, message) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create queue if it doesn't exist
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        console.log(`Message sent to queue ${queue}: ${message}`);
    }
    catch (error) {
        console.error('Failed to publish message:', error);
    }
}
async function publishToExchangeWithRoutingKey(exchange, routingKey, message) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // Create exchange if it doesn't exist
        await channel.assertExchange(exchange, 'direct', { durable: true });
        channel.publish(exchange, routingKey, Buffer.from(message), { persistent: true });
        console.log(`Message sent to exchange ${exchange} with routing key ${routingKey}: ${message}`);
    }
    catch (error) {
        console.error('Failed to publish message to exchange:', error);
    }
}
async function closePublisherChannel() {
    const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
    if (channel) {
        await channel.close();
        console.log('Publisher channel closed');
    }
}
// New function to create exchange and bind queue
async function publishToExchangeWithQueue(exchange, queue, routingKey, message) {
    try {
        const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
    }
    catch (error) {
        console.error('Failed to publish message to exchange with queue:', error);
    }
}
//# sourceMappingURL=publisher.js.map