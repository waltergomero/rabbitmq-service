//check queue
import { connectRabbitMQ, getRabbitMQChannel } from '../utils/rabbitmq';
import { getRabbitMQConfig } from '../config/rabbitenv';
import * as amqp from 'amqplib';

const RabbitMQConfig = getRabbitMQConfig();

export async function checkQueue(queue: string): Promise<{ messageCount: number; consumerCount: number }> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        const queueInfo = await channel.checkQueue(queue);
        console.log(`Queue ${queue} has ${queueInfo.messageCount} messages and ${queueInfo.consumerCount} consumers`);
        return queueInfo;
    } catch (error) {
        console.error('Failed to check queue:', error);
        throw error;
    }
}

export async function checkExchange(exchange: string): Promise<boolean> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        // checkExchange only verifies if exchange exists, returns Empty object
        await channel.checkExchange(exchange);
        console.log(`Exchange ${exchange} exists`);
        return true;
    } catch (error) {
        console.error(`Exchange ${exchange} does not exist or failed to check:`, error);
        return false;
    }
}

export async function getQueueInfo(queue: string): Promise<{ messageCount: number; consumerCount: number } | null> {
    try {
        const { channel } = await connectRabbitMQ();
        if (!channel) {
            throw new Error('Channel is not available');
        }
        const queueInfo = await channel.checkQueue(queue);
        return {
            messageCount: queueInfo.messageCount,
            consumerCount: queueInfo.consumerCount
        };
    } catch (error) {
        console.error('Failed to get queue info:', error);
        return null;
    }
}

export async function closeChecker(): Promise<void> {
    const { channel } = await connectRabbitMQ();
    if (channel) {
        await channel.close();
        console.log('Checker channel closed');
    }
}

export function getCheckerChannel(): amqp.Channel | null {
    return getRabbitMQChannel();
}