import * as amqp from 'amqplib';
export declare function consumeMessage(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchange(exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function closeConsumer(): Promise<void>;
export declare function getConsumerChannel(): amqp.Channel | null;
export declare function consumeFromQueue(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchangeWithRoutingKey(exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromQueueWithRoutingKey(queue: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchangeWithRoutingKeyAndQueue(exchange: string, routingKey: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromQueueWithExchange(queue: string, exchange: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchangeWithQueue(exchange: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchangeWithRoutingKeyAndQueueAndCallback(exchange: string, routingKey: string, queue: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromQueueWithExchangeAndRoutingKey(queue: string, exchange: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
export declare function consumeFromExchangeWithQueueAndRoutingKey(exchange: string, queue: string, routingKey: string, callback: (msg: amqp.ConsumeMessage | null) => void): Promise<void>;
//# sourceMappingURL=consumer.d.ts.map