export interface RabbitMQConfig {
    url: string;
    queue: string;
    exchange: string;
    routingKey: string;
    consumerTag: string;
    publisherTag: string;
}
export declare const getRabbitMQConfig: () => RabbitMQConfig;
export declare const RABBITMQ_URL: string;
export declare const RABBITMQ_EXCHANGE: string;
export declare const RABBITMQ_QUEUE: string;
//# sourceMappingURL=rabbitenv.d.ts.map