"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RABBITMQ_QUEUE = exports.RABBITMQ_EXCHANGE = exports.RABBITMQ_URL = exports.getRabbitMQConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const getRabbitMQConfig = () => {
    return {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        queue: process.env.RABBITMQ_QUEUE || 'task_queue',
        exchange: process.env.RABBITMQ_EXCHANGE || 'task_exchange',
        routingKey: process.env.RABBITMQ_ROUTING_KEY || 'task_routing_key',
        consumerTag: process.env.RABBITMQ_CONSUMER_TAG || 'task_consumer',
        publisherTag: process.env.RABBITMQ_PUBLISHER_TAG || 'task_publisher'
    };
};
exports.getRabbitMQConfig = getRabbitMQConfig;
// Export individual values if needed
exports.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
exports.RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'task_exchange';
exports.RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'task_queue';
//# sourceMappingURL=rabbitenv.js.map