export interface QueueMessage {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  priority?: number;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface QueueOptions {
  durable?: boolean;
  autoDelete?: boolean;
  priority?: number;
  delay?: number; // milliseconds
  retryLimit?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
}

export interface ConsumerOptions {
  prefetch?: number;
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
}

export interface IQueueProvider {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Queue operations
  createQueue(queueName: string, options?: QueueOptions): Promise<void>;
  deleteQueue(queueName: string): Promise<void>;
  purgeQueue(queueName: string): Promise<void>;

  // Exchange operations
  createExchange(
    exchangeName: string,
    type: 'direct' | 'fanout' | 'topic' | 'headers',
    options?: QueueOptions
  ): Promise<void>;
  deleteExchange(exchangeName: string): Promise<void>;

  // Publishing
  publish(
    exchange: string,
    routingKey: string,
    message: QueueMessage,
    options?: QueueOptions
  ): Promise<boolean>;
  publishToQueue(
    queueName: string,
    message: QueueMessage,
    options?: QueueOptions
  ): Promise<boolean>;

  // Consuming
  consume(
    queueName: string,
    handler: (message: QueueMessage) => Promise<void>,
    options?: ConsumerOptions
  ): Promise<string>; // Returns consumer tag
  cancel(consumerTag: string): Promise<void>;

  // Message acknowledgment
  ack(message: QueueMessage): Promise<void>;
  nack(message: QueueMessage, requeue?: boolean): Promise<void>;

  // Queue information
  getQueueInfo(queueName: string): Promise<{
    messageCount: number;
    consumerCount: number;
  }>;

  // Health check
  healthCheck(): Promise<boolean>;
}
