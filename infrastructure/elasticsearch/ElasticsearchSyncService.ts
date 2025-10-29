import { injectable, inject } from 'tsyringe';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import {
  IIndexClient,
  SyncPayload,
  IndexOperation,
} from '../search/IIndexClient';
import { IDocumentService } from './IDocumentService';

@injectable()
export class ElasticsearchSyncService implements IIndexClient {
  private elasticsearchEnabled: boolean;

  constructor(
    @inject('IDocumentService')
    private documentService: IDocumentService,
    @inject('IConfigurationService')
    private configService: IConfigurationService,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {
    const esConfig = this.configService.getElasticsearchConfig();
    this.elasticsearchEnabled = esConfig.enabled;
  }

  private async indexDocument(
    indexName: string,
    id: string,
    content: Record<string, any>
  ): Promise<void> {
    await this.documentService.createIndexIfNotExists(indexName, {});
    await this.documentService.indexDocument(indexName, id, content);
  }

  private async updateDocument(
    indexName: string,
    id: string,
    content: Record<string, any>
  ): Promise<void> {
    await this.documentService.updateDocument(indexName, id, content);
  }

  private async deleteDocument(indexName: string, id: string): Promise<void> {
    await this.documentService.deleteDocument(indexName, id);
  }

  // IIndexClient implementation - SearchDocument bazlı
  async sync<TDoc = unknown>(
    indexName: string,
    operation: IndexOperation,
    document: TDoc | string
  ): Promise<void> {
    if (!this.elasticsearchEnabled) {
      return;
    }

    try {
      if (operation === 'delete') {
        await this.deleteDocument(indexName, String(document));
      } else {
        const doc = document as TDoc;
        const docId = (doc as any)?._id || (doc as any)?.id;

        if (!docId) {
          this.logger.warn('Document ID not found for indexing', {
            indexName,
            operation,
          });
          return;
        }

        if (operation === 'index') {
          // _id'yi document'tan çıkar (Elasticsearch metadata field olarak kabul eder)
          const { _id, ...documentWithoutId } = doc as Record<string, any>;
          await this.indexDocument(
            indexName,
            String(docId),
            documentWithoutId
          );
        } else if (operation === 'update') {
          // _id'yi document'tan çıkar (Elasticsearch metadata field olarak kabul eder)
          const { _id, ...documentWithoutId } = doc as Record<string, any>;
          await this.updateDocument(
            indexName,
            String(docId),
            documentWithoutId
          );
        }
      }
    } catch (error: any) {
      const docId =
        typeof document === 'string' ? document : (document as any)?._id;
      this.logger.warn(
        `Failed to sync document to Elasticsearch index: ${indexName}`,
        {
          error: error.message,
          operation,
          indexName,
          docId,
        }
      );
    }
  }

  // IIndexClient implementation - Sync with payload
  async syncWithPayload<TDoc = unknown>(
    payload: SyncPayload<TDoc>
  ): Promise<void> {
    await this.sync(payload.indexName, payload.operation, payload.document);
  }

  // IIndexClient implementation - Bulk sync
  async bulkSync<TDoc = unknown>(payloads: SyncPayload<TDoc>[]): Promise<void> {
    await Promise.all(payloads.map(payload => this.syncWithPayload(payload)));
  }
}
