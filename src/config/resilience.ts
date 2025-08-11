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

export interface ResilienceConfig {
  connection: {
    maxReconnectAttempts: number;
    reconnectDelay: number;
    maxReconnectDelay: number;
    healthCheckInterval: number;
    channelMaxRetries: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    timeout: number;
    resetTimeout: number;
  };
  retry: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  monitoring: {
    healthReportInterval: number;
    metricsReportInterval: number;
  };
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

export const getResilienceConfig = (): ResilienceConfig => {
  return {
    connection: {
      maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10'),
      reconnectDelay: parseInt(process.env.RECONNECT_DELAY || '5000'),
      maxReconnectDelay: parseInt(process.env.MAX_RECONNECT_DELAY || '30000'),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
      channelMaxRetries: parseInt(process.env.CHANNEL_MAX_RETRIES || '3')
    },
    circuitBreaker: {
      failureThreshold: parseInt(process.env.CB_FAILURE_THRESHOLD || '5'),
      timeout: parseInt(process.env.CB_TIMEOUT || '60000'),
      resetTimeout: parseInt(process.env.CB_RESET_TIMEOUT || '30000')
    },
    retry: {
      maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
      baseDelay: parseInt(process.env.BASE_DELAY || '1000'),
      maxDelay: parseInt(process.env.MAX_DELAY || '10000')
    },
    monitoring: {
      healthReportInterval: parseInt(process.env.HEALTH_REPORT_INTERVAL || '30000'),
      metricsReportInterval: parseInt(process.env.METRICS_REPORT_INTERVAL || '60000')
    }
  };
};

// Export individual values if needed
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
export const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'task_exchange';
export const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'task_queue';
