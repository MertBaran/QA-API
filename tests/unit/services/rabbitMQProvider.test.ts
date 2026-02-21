import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';

// Mock amqplib before importing the provider so the mock is used
jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import * as amqp from 'amqplib';

import { RabbitMQProvider } from '../../../services/providers/RabbitMQProvider';
import {
  QueueMessage,
  QueueOptions,
  ConsumerOptions,
} from '../../../services/contracts/IQueueProvider';

// Mock logger
const mockLogger: ILoggerProvider = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  isEnabled: jest.fn().mockReturnValue(true),
  setLevel: jest.fn(),
  getLevel: jest.fn().mockReturnValue('info'),
};

describe('RabbitMQProvider', () => {
  let rabbitMQProvider: RabbitMQProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    rabbitMQProvider = new RabbitMQProvider(mockLogger);
  });

  describe('Connection Management', () => {
    it('should connect to RabbitMQ successfully', async () => {
      const mockChannel = {
        assertQueue: jest.fn(),
        assertExchange: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        consume: jest.fn(),
        ack: jest.fn(),
        nack: jest.fn(),
        deleteQueue: jest.fn(),
        deleteExchange: jest.fn(),
        checkQueue: jest.fn(),
        prefetch: jest.fn(),
      };

      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
        close: jest.fn(),
      };

      (amqp.connect as jest.Mock).mockClear();
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

      await rabbitMQProvider.connect();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'RabbitMQ connected successfully'
      );
      expect(rabbitMQProvider.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const connError = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(connError);

      await expect(rabbitMQProvider.connect()).rejects.toThrow();
    });

    it('should disconnect successfully', async () => {
      const mockChannel = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      const mockConnection = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      // Mock internal properties
      (rabbitMQProvider as any).channel = mockChannel;
      (rabbitMQProvider as any).connection = mockConnection;

      await rabbitMQProvider.disconnect();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'RabbitMQ disconnected successfully'
      );
    });
  });

  describe('Queue Operations', () => {
    beforeEach(async () => {
      // Mock connection setup
      const mockChannel = {
        assertQueue: jest.fn(),
        deleteQueue: jest.fn(),
        purgeQueue: jest.fn(),
      };

      (rabbitMQProvider as any).channel = mockChannel;
    });

    it('should create queue successfully', async () => {
      const queueName = 'test-queue';
      const options: QueueOptions = { durable: true };

      await rabbitMQProvider.createQueue(queueName, options);

      expect(
        (rabbitMQProvider as any).channel.assertQueue
      ).toHaveBeenCalledWith(
        queueName,
        expect.objectContaining({
          durable: true,
          autoDelete: false,
          arguments: {},
        })
      );
    });

    it('should create queue with dead letter exchange', async () => {
      const queueName = 'test-queue';
      const options: QueueOptions = {
        deadLetterExchange: 'dlx',
        deadLetterRoutingKey: 'dlq',
      };

      await rabbitMQProvider.createQueue(queueName, options);

      expect(
        (rabbitMQProvider as any).channel.assertQueue
      ).toHaveBeenCalledWith(
        queueName,
        expect.objectContaining({
          arguments: {
            'x-dead-letter-exchange': 'dlx',
            'x-dead-letter-routing-key': 'dlq',
          },
        })
      );
    });

    it('should delete queue successfully', async () => {
      const queueName = 'test-queue';

      await rabbitMQProvider.deleteQueue(queueName);

      expect(
        (rabbitMQProvider as any).channel.deleteQueue
      ).toHaveBeenCalledWith(queueName);
    });

    it('should purge queue successfully', async () => {
      const queueName = 'test-queue';

      await rabbitMQProvider.purgeQueue(queueName);

      expect((rabbitMQProvider as any).channel.purgeQueue).toHaveBeenCalledWith(
        queueName
      );
    });
  });

  describe('Exchange Operations', () => {
    beforeEach(async () => {
      const mockChannel = {
        assertExchange: jest.fn(),
        deleteExchange: jest.fn(),
      };

      (rabbitMQProvider as any).channel = mockChannel;
    });

    it('should create exchange successfully', async () => {
      const exchangeName = 'test-exchange';
      const type = 'direct' as const;
      const options: QueueOptions = { durable: true };

      await rabbitMQProvider.createExchange(exchangeName, type, options);

      expect(
        (rabbitMQProvider as any).channel.assertExchange
      ).toHaveBeenCalledWith(
        exchangeName,
        type,
        expect.objectContaining({
          durable: true,
          autoDelete: false,
        })
      );
    });

    it('should delete exchange successfully', async () => {
      const exchangeName = 'test-exchange';

      await rabbitMQProvider.deleteExchange(exchangeName);

      expect(
        (rabbitMQProvider as any).channel.deleteExchange
      ).toHaveBeenCalledWith(exchangeName);
    });
  });

  describe('Publishing', () => {
    beforeEach(async () => {
      const mockChannel = {
        publish: jest.fn().mockReturnValue(true),
        sendToQueue: jest.fn().mockReturnValue(true),
      };

      (rabbitMQProvider as any).channel = mockChannel;
    });

    it('should publish message to exchange successfully', async () => {
      const exchange = 'test-exchange';
      const routingKey = 'test.key';
      const message: QueueMessage = {
        id: 'test-id',
        type: 'test',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      const result = await rabbitMQProvider.publish(
        exchange,
        routingKey,
        message
      );

      expect(result).toBe(true);
      expect((rabbitMQProvider as any).channel.publish).toHaveBeenCalledWith(
        exchange,
        routingKey,
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
        })
      );
    });

    it('should publish message to queue successfully', async () => {
      const queueName = 'test-queue';
      const message: QueueMessage = {
        id: 'test-id',
        type: 'test',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      const result = await rabbitMQProvider.publishToQueue(queueName, message);

      expect(result).toBe(true);
      expect(
        (rabbitMQProvider as any).channel.sendToQueue
      ).toHaveBeenCalledWith(
        queueName,
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
        })
      );
    });
  });

  describe('Consuming', () => {
    beforeEach(async () => {
      const mockChannel = {
        consume: jest.fn().mockResolvedValue({
          consumerTag: 'test-consumer-tag',
        }),
        cancel: jest.fn(),
        prefetch: jest.fn(),
        ack: jest.fn(),
        nack: jest.fn(),
      };

      (rabbitMQProvider as any).channel = mockChannel;
    });

    it('should start consumer successfully', async () => {
      const queueName = 'test-queue';
      const handler = jest.fn();
      const options: ConsumerOptions = { prefetch: 10 };

      const consumerTag = await rabbitMQProvider.consume(
        queueName,
        handler,
        options
      );

      expect(consumerTag).toBe('test-consumer-tag');
      expect((rabbitMQProvider as any).channel.prefetch).toHaveBeenCalledWith(
        10
      );
      expect((rabbitMQProvider as any).channel.consume).toHaveBeenCalledWith(
        queueName,
        expect.any(Function),
        expect.objectContaining({
          noAck: false,
          exclusive: false,
        })
      );
    });

    it('should cancel consumer successfully', async () => {
      const consumerTag = 'test-consumer-tag';

      await rabbitMQProvider.cancel(consumerTag);

      expect((rabbitMQProvider as any).channel.cancel).toHaveBeenCalledWith(
        consumerTag
      );
    });
  });

  describe('Queue Information', () => {
    beforeEach(async () => {
      const mockChannel = {
        checkQueue: jest.fn().mockResolvedValue({
          messageCount: 5,
          consumerCount: 2,
        }),
      };

      (rabbitMQProvider as any).channel = mockChannel;
    });

    it('should get queue info successfully', async () => {
      const queueName = 'test-queue';

      const info = await rabbitMQProvider.getQueueInfo(queueName);

      expect(info).toEqual({
        messageCount: 5,
        consumerCount: 2,
      });
      expect((rabbitMQProvider as any).channel.checkQueue).toHaveBeenCalledWith(
        queueName
      );
    });
  });

  describe('Health Check', () => {
    it('should return false when not connected', async () => {
      const isHealthy = await rabbitMQProvider.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return true when connected and healthy', async () => {
      // Mock connection and queue info
      (rabbitMQProvider as any).connection = {};
      (rabbitMQProvider as any).channel = {
        checkQueue: jest.fn().mockResolvedValue({
          messageCount: 0,
          consumerCount: 0,
        }),
      };

      const isHealthy = await rabbitMQProvider.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when health check fails', async () => {
      // Mock connection but failed queue check
      (rabbitMQProvider as any).connection = {};
      (rabbitMQProvider as any).channel = {
        checkQueue: jest
          .fn()
          .mockRejectedValue(new Error('Health check failed')),
      };

      const isHealthy = await rabbitMQProvider.healthCheck();
      expect(isHealthy).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'RabbitMQ health check failed',
        { error: 'Health check failed' }
      );
    });
  });

  describe('Connection URL', () => {
    it('should generate correct connection URL with default values', () => {
      const url = (rabbitMQProvider as any).getConnectionUrl();
      expect(url).toBe('amqp://admin:admin123@localhost:5672/');
    });

    it('should generate correct connection URL with environment variables', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        RABBITMQ_HOST: 'rabbitmq.example.com',
        RABBITMQ_PORT: '5673',
        RABBITMQ_USER: 'testuser',
        RABBITMQ_PASS: 'testpass',
        RABBITMQ_VHOST: '/test',
      };

      const url = (rabbitMQProvider as any).getConnectionUrl();
      expect(url).toBe(
        'amqp://testuser:testpass@rabbitmq.example.com:5673/test'
      );

      process.env = originalEnv;
    });
  });
});
