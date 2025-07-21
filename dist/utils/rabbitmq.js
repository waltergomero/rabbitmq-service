"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRabbitMQ = connectRabbitMQ;
exports.closeRabbitMQ = closeRabbitMQ;
exports.getRabbitMQChannel = getRabbitMQChannel;
const amqp = __importStar(require("amqplib"));
const rabbitenv_1 = require("../config/rabbitenv");
let connection = null;
let channel = null;
async function connectRabbitMQ() {
    if (connection && channel) {
        return { connection, channel };
    }
    try {
        connection = await amqp.connect(rabbitenv_1.RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
        return { connection, channel };
    }
    catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
}
async function closeRabbitMQ() {
    if (channel)
        await channel.close();
    if (connection)
        await connection.close();
    connection = null;
    channel = null;
    console.log('Disconnected from RabbitMQ');
}
function getRabbitMQChannel() {
    return channel;
}
//# sourceMappingURL=rabbitmq.js.map