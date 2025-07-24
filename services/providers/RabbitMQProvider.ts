import { injectable, inject } from 'tsyringe';
import * as amqp from 'amqplib';
import {
  IQueueProvider,
  QueueMessage,
  QueueOptions,
  ConsumerOptions,
} from '../contracts/IQueueProvider';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';

@injectable()
export class RabbitMQProvider implements IQueueProvider {
  private connection: any = null;
  private channel: any = null;
  private consumers: Map<string, any> = new Map();

  constructor(@inject('ILoggerProvider') private logger: ILoggerProvider) {}

  async connect(): Promise<void> {
    try {
      const url = this.getConnectionUrl();
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Connected successfully
      this.logger.info('RabbitMQ connected successfully');

      // Connection event handlers
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', {
          error: error.message,
        });
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.logger.info('RabbitMQ disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async createQueue(
    queueName: string,
    options: QueueOptions = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const queueOptions: amqp.Options.AssertQueue = {
      durable: options.durable ?? true,
      autoDelete: options.autoDelete ?? false,
      arguments: {},
    };

    if (options.deadLetterExchange) {
      queueOptions.arguments = {
        ...queueOptions.arguments,
        'x-dead-letter-exchange': options.deadLetterExchange,
        'x-dead-letter-routing-key': options.deadLetterRoutingKey || queueName,
      };
    }

    await this.channel.assertQueue(queueName, queueOptions);
    // Queue created silently
  }

  async deleteQueue(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.deleteQueue(queueName);
    this.logger.info('Queue deleted', { queueName });
  }

  async purgeQueue(queueName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.purgeQueue(queueName);
    this.logger.info('Queue purged', { queueName });
  }

  async createExchange(
    exchangeName: string,
    type: 'direct' | 'fanout' | 'topic' | 'headers',
    options: QueueOptions = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const exchangeOptions: amqp.Options.AssertExchange = {
      durable: options.durable ?? true,
      autoDelete: options.autoDelete ?? false,
    };

    await this.channel.assertExchange(exchangeName, type, exchangeOptions);
    // Exchange created silently
  }

  async deleteExchange(exchangeName: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.deleteExchange(exchangeName);
    this.logger.info('Exchange deleted', { exchangeName });
  }

  async publish(
    exchange: string,
    routingKey: string,
    message: QueueMessage,
    options: QueueOptions = {}
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const publishOptions: amqp.Options.Publish = {
      persistent: options.durable ?? true,
      priority: options.priority,
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const result = this.channel.publish(
      exchange,
      routingKey,
      messageBuffer,
      publishOptions
    );

    this.logger.info('Message published', {
      exchange,
      routingKey,
      messageId: message.id,
      result,
    });

    return result;
  }

  async publishToQueue(
    queueName: string,
    message: QueueMessage,
    options: QueueOptions = {}
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const publishOptions: amqp.Options.Publish = {
      persistent: options.durable ?? true,
      priority: options.priority,
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const result = this.channel.sendToQueue(
      queueName,
      messageBuffer,
      publishOptions
    );

    return result;
  }

  async consume(
    queueName: string,
    handler: (message: QueueMessage) => Promise<void>,
    options: ConsumerOptions = {}
  ): Promise<string> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const consumeOptions: amqp.Options.Consume = {
      noAck: options.noAck ?? false,
      exclusive: options.exclusive ?? false,
      priority: options.priority,
    };

    if (options.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    const result = await this.channel.consume(
      queueName,
      async (msg: any) => {
        if (!msg) return;

        try {
          const message: QueueMessage = JSON.parse(msg.content.toString());
          await handler(message);

          if (!consumeOptions.noAck) {
            this.channel!.ack(msg);
          }
        } catch (error) {
          this.logger.error('Error processing message', {
            error: (error as Error).message,
            queueName,
            messageId: msg.properties.messageId,
          });

          if (!consumeOptions.noAck) {
            this.channel!.nack(msg, false, true); // Requeue on error
          }
        }
      },
      consumeOptions
    );

    this.consumers.set(result.consumerTag, result);
    // Consumer started silently

    return result.consumerTag;
  }

  async cancel(consumerTag: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.cancel(consumerTag);
    this.consumers.delete(consumerTag);
    this.logger.info('Consumer cancelled', { consumerTag });
  }

  async ack(message: QueueMessage): Promise<void> {
    // This method is mainly for interface compatibility
    // Actual ack is handled in the consume method
    this.logger.debug('Message acknowledged', { messageId: message.id });
  }

  async nack(message: QueueMessage, requeue: boolean = true): Promise<void> {
    // This method is mainly for interface compatibility
    // Actual nack is handled in the consume method
    this.logger.debug('Message nacked', { messageId: message.id, requeue });
  }

  async getQueueInfo(
    queueName: string
  ): Promise<{ messageCount: number; consumerCount: number }> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const queueInfo = await this.channel.checkQueue(queueName);
    return {
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }

      // Try to get queue info to test connection
      await this.getQueueInfo('health-check-queue');
      return true;
    } catch (error) {
      this.logger.error('RabbitMQ health check failed', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  private getConnectionUrl(): string {
    const host = process.env['RABBITMQ_HOST'] || 'localhost';
    const port = process.env['RABBITMQ_PORT'] || '5672';
    const user = process.env['RABBITMQ_USER'] || 'admin';
    const password = process.env['RABBITMQ_PASS'] || 'admin123';
    const vhost = process.env['RABBITMQ_VHOST'] || '/';

    return `amqp://${user}:${password}@${host}:${port}${vhost}`;
  }
}
