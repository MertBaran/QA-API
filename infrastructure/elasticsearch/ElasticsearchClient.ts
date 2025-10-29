import { injectable, inject } from 'tsyringe';
import { Client, ClientOptions } from '@elastic/elasticsearch';
import { IElasticsearchClient } from './IElasticsearchClient';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';
import { ILoggerProvider } from '../logging/ILoggerProvider';

@injectable()
export class ElasticsearchClient implements IElasticsearchClient {
  private client: Client | null = null;
  private isInitialized = false;

  constructor(
    @inject('IConfigurationService')
    private configService: IConfigurationService,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  private initializeClient(): Client {
    if (this.client) {
      return this.client;
    }

    try {
      const elasticsearchConfig = this.configService.getElasticsearchConfig();

      const clientOptions: ClientOptions = {
        node: elasticsearchConfig.url,
      };

      // Authentication (eğer varsa)
      if (elasticsearchConfig.username && elasticsearchConfig.password) {
        clientOptions.auth = {
          username: elasticsearchConfig.username,
          password: elasticsearchConfig.password,
        };
      }

      // TLS/SSL ayarları (production için)
      if (elasticsearchConfig.tlsEnabled) {
        clientOptions.tls = {
          rejectUnauthorized: !elasticsearchConfig.tlsSkipVerify,
        };
      }

      // Request timeout
      if (elasticsearchConfig.requestTimeout) {
        clientOptions.requestTimeout = elasticsearchConfig.requestTimeout;
      }

      this.client = new Client(clientOptions);
      this.isInitialized = true;

      this.logger.info('Elasticsearch client initialized', {
        url: elasticsearchConfig.url,
      });

      return this.client;
    } catch (error: any) {
      this.logger.error('Failed to initialize Elasticsearch client', {
        error: error.message,
      });
      throw error;
    }
  }

  getClient(): Client {
    if (!this.isInitialized || !this.client) {
      return this.initializeClient();
    }
    return this.client;
  }

  async isConnected(): Promise<boolean> {
    try {
      const client = this.getClient();
      const response = await client.ping();
      return response === true;
    } catch (error) {
      this.logger.warn('Elasticsearch connection check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const client = this.getClient();
      const response = await client.cluster.health();

      return {
        status: response.status === 'green' ? 'healthy' : 'degraded',
        message: `Cluster status: ${response.status}`,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message || 'Elasticsearch health check failed',
      };
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        this.logger.info('Elasticsearch client closed');
      } catch (error: any) {
        this.logger.error('Error closing Elasticsearch client', {
          error: error.message,
        });
      } finally {
        this.client = null;
        this.isInitialized = false;
      }
    }
  }
}
