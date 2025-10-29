import { injectable, inject } from 'tsyringe';
import { Client } from '@elastic/elasticsearch';
import { IElasticsearchLogShipper, LogEntry } from './IElasticsearchLogShipper';
import { IElasticsearchClient } from './IElasticsearchClient';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';

const LOGS_INDEX_PREFIX = 'qa-logs';
const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 5000; // 5 seconds

@injectable()
export class ElasticsearchLogShipper implements IElasticsearchLogShipper {
  private client: Client;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isShipperEnabled = false;
  private isRunning = false;

  constructor(
    @inject('IElasticsearchClient')
    private elasticsearchClient: IElasticsearchClient,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider,
    @inject('IConfigurationService')
    private configService: IConfigurationService
  ) {
    this.client = elasticsearchClient.getClient();
  }

  isEnabled(): boolean {
    const config = this.configService.getElasticsearchConfig();
    return config.enabled && this.isShipperEnabled;
  }

  async start(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Create index template if needed
    await this.createIndexTemplate();

    // Start periodic flush
    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        this.logger.error('Error during periodic log flush', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, FLUSH_INTERVAL_MS);

    this.logger.info('Elasticsearch log shipper started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush remaining logs
    await this.flush();

    this.logger.info('Elasticsearch log shipper stopped');
  }

  async shipLog(entry: LogEntry): Promise<void> {
    if (!this.isEnabled() || !this.isRunning) {
      return;
    }

    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= BATCH_SIZE) {
      await this.flush();
    }
  }

  async shipLogs(entries: LogEntry[]): Promise<void> {
    if (!this.isEnabled() || !this.isRunning) {
      return;
    }

    this.logBuffer.push(...entries);

    // Flush if buffer is full
    if (this.logBuffer.length >= BATCH_SIZE) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (!this.isEnabled() || this.logBuffer.length === 0) {
      return;
    }

    const logsToShip = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const indexName = this.getIndexName();

      // Build bulk operations
      const operations = logsToShip.flatMap(log => [
        {
          index: {
            _index: indexName,
          },
        },
        this.formatLogEntry(log),
      ]);

      if (operations.length > 0) {
        await this.client.bulk({
          operations,
          refresh: false, // Don't wait for refresh for better performance
        });

        //this.logger.debug(`Shipped ${logsToShip.length} logs to Elasticsearch`);
      }
    } catch (error: any) {
      // Put logs back in buffer if shipping failed
      this.logBuffer.unshift(...logsToShip);

      this.logger.error('Failed to ship logs to Elasticsearch', {
        error: error.message,
        logCount: logsToShip.length,
      });

      // Truncate buffer if it gets too large (prevent memory issues)
      if (this.logBuffer.length > BATCH_SIZE * 10) {
        this.logBuffer = this.logBuffer.slice(-BATCH_SIZE * 5);
        this.logger.warn('Log buffer truncated to prevent memory issues');
      }
    }
  }

  private formatLogEntry(entry: LogEntry): any {
    return {
      '@timestamp': entry.timestamp || new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context,
      meta: entry.meta,
      pid: entry.pid,
      hostname: entry.hostname,
      // Additional fields for better searchability
      service: 'qa-api',
      environment: this.configService.getEnvironment(),
    };
  }

  private getIndexName(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${LOGS_INDEX_PREFIX}-${dateStr}`;
  }

  private async createIndexTemplate(): Promise<void> {
    try {
      const templateName = `${LOGS_INDEX_PREFIX}-template`;

      await this.client.indices.putIndexTemplate({
        name: templateName,
        index_patterns: [`${LOGS_INDEX_PREFIX}-*`],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            'index.lifecycle.name': `${LOGS_INDEX_PREFIX}-policy`,
            'index.lifecycle.rollover_alias': `${LOGS_INDEX_PREFIX}-alias`,
          },
          mappings: {
            properties: {
              '@timestamp': { type: 'date' },
              level: { type: 'keyword' },
              message: {
                type: 'text',
                analyzer: 'standard',
              },
              context: { type: 'keyword' },
              meta: { type: 'object', enabled: true },
              pid: { type: 'integer' },
              hostname: { type: 'keyword' },
              service: { type: 'keyword' },
              environment: { type: 'keyword' },
            },
          },
        },
      });
    } catch (error: any) {
      // Template might already exist, which is fine
      if (error.statusCode !== 400) {
        this.logger.warn('Failed to create log index template', {
          error: error.message,
        });
      }
    }
  }

  // Public method to enable the shipper (called during bootstrap)
  enable(): void {
    this.isShipperEnabled = true;
  }
}
