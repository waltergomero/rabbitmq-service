import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface RabbitMQConfig {
  url: string;
  queue: string;
  exchange: string;
  routingKey: string;
  consumerTag: string;
  publisherTag: string;
}

export const getRabbitMQConfig = (): RabbitMQConfig => {
  return {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'task_queue',
    exchange: process.env.RABBITMQ_EXCHANGE || 'task_exchange',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'task_routing_key',
    consumerTag: process.env.RABBITMQ_CONSUMER_TAG || 'task_consumer',
    publisherTag: process.env.RABBITMQ_PUBLISHER_TAG || 'task_publisher'
  };
};

// Export individual values if needed
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
export const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'task_exchange';
export const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'task_queue';