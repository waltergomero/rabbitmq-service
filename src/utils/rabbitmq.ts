import * as amqp from 'amqplib';
import {  RABBITMQ_URL } from '../config/rabbitenv';


let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<{ connection: amqp.ChannelModel; channel: amqp.Channel }> {
    if (connection && channel) {
        return { connection, channel };
    }
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
        return { connection, channel };
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
}

export async function closeRabbitMQ(): Promise<void> {
    if (channel) await channel.close();
    if (connection) await connection.close();
    connection = null;
    channel = null;
    console.log('Disconnected from RabbitMQ');
}

export function getRabbitMQChannel(): amqp.Channel | null {
    return channel;
}