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
const rabbitenv_1 = require("../config/rabbitenv");
const RabbitMQConfig = (0, rabbitenv_1.getRabbitMQConfig)();
// Enhanced publish with retry logic
async function publishMessage(queue, message, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            await (0, rabbitmq_1.waitForConnection)();
            const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
        }
        catch (error) {
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
async function publishToExchange(exchange, routingKey, message, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            await (0, rabbitmq_1.waitForConnection)();
            const { channel } = await (0, rabbitmq_1.connectRabbitMQ)();
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
        }
        catch (error) {
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
if (require.main === module) {
    const MESSAGE_QUEUE = RabbitMQConfig.queue;
    const MESSAGE_EXCHANGE = RabbitMQConfig.exchange;
    const MESSAGE_ROUTING_KEY = RabbitMQConfig.routingKey;
    const message = {
        to: "luisaqgomero@hotmail.com",
        from: "walter.gomero@gmail.com",
        subject: "Test Message",
        body: "This is a test message. Please ignore it."
    };
    async function runTest() {
        try {
            await publishToExchangeWithQueue(MESSAGE_EXCHANGE, MESSAGE_QUEUE, MESSAGE_ROUTING_KEY, JSON.stringify(message));
            console.log('Test message published successfully');
        }
        catch (error) {
            console.error('Error publishing test message:', error);
        }
        finally {
            await closePublisher();
        }
    }
    runTest();
}
//# sourceMappingURL=publisher.js.map