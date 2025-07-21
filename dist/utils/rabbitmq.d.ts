import * as amqp from 'amqplib';
export declare function connectRabbitMQ(): Promise<{
    connection: amqp.ChannelModel;
    channel: amqp.Channel;
}>;
export declare function closeRabbitMQ(): Promise<void>;
export declare function getRabbitMQChannel(): amqp.Channel | null;
//# sourceMappingURL=rabbitmq.d.ts.map