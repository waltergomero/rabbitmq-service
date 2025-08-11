interface ConnectionState {
    connection: any | null;
    channel: any | null;
    isConnecting: boolean;
    isHealthy: boolean;
    reconnectAttempts: number;
    lastError: Error | null;
}
export declare function onConnection(callback: () => void): void;
export declare function onDisconnection(callback: (error?: Error) => void): void;
export declare function removeConnectionListener(callback: () => void): void;
export declare function removeDisconnectionListener(callback: (error?: Error) => void): void;
export declare function connectRabbitMQ(): Promise<{
    connection: any;
    channel: any;
}>;
export declare function closeRabbitMQ(): Promise<void>;
export declare function getRabbitMQChannel(): any | null;
export declare function getConnectionState(): Readonly<ConnectionState>;
export declare function waitForConnection(timeout?: number): Promise<void>;
export {};
//# sourceMappingURL=rabbitmq.d.ts.map