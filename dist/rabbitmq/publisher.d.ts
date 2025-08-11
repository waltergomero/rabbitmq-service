import * as amqp from 'amqplib';
export declare function publishMessage(queue: string, message: string, retries?: number): Promise<void>;
export declare function publishToExchange(exchange: string, routingKey: string, message: string, retries?: number): Promise<void>;
export declare function closePublisher(): Promise<void>;
export declare function getPublisherChannel(): amqp.Channel | null;
export declare function publishToQueue(queue: string, message: string): Promise<void>;
export declare function publishToExchangeWithRoutingKey(exchange: string, routingKey: string, message: string): Promise<void>;
export declare function closePublisherChannel(): Promise<void>;
export declare function publishToExchangeWithQueue(exchange: string, queue: string, routingKey: string, message: string): Promise<void>;
//# sourceMappingURL=publisher.d.ts.map