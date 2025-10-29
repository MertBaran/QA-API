import { Client } from '@elastic/elasticsearch';

export interface IElasticsearchClient {
  getClient(): Client;
  isConnected(): Promise<boolean>;
  healthCheck(): Promise<{ status: string; message?: string }>;
  close(): Promise<void>;
}

