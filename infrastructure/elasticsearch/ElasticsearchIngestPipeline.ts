import { injectable, inject } from 'tsyringe';
import { Client } from '@elastic/elasticsearch';
import { IElasticsearchClient } from './IElasticsearchClient';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';

/**
 * Elasticsearch Ingest Pipeline Service
 * ELSER semantic field'larını otomatik doldurmak için ingest pipeline oluşturur
 */
@injectable()
export class ElasticsearchIngestPipeline {
  private client: Client;
  private readonly ELSER_MODEL_ID = '.elser_model_2';
  private readonly PIPELINE_NAME = 'elser-semantic-pipeline';

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

  /**
   * ELSER semantic pipeline'ını oluşturur veya günceller
   * @param searchFields Semantic field'ların oluşturulacağı field'lar
   */
  async createOrUpdatePipeline(searchFields: string[]): Promise<void> {
    const config = this.configService.getElasticsearchConfig();
    if (!config.enabled) {
      return;
    }

    try {
      // Her search field için inference processor ekle
      const processors: any[] = [];

      searchFields.forEach(field => {
        // ELSER inference processor - semantic field'ı otomatik doldurur
        processors.push({
          inference: {
            model_id: this.ELSER_MODEL_ID,
            field_map: {
              [field]: 'text_field', // Input field
            },
            target_field: `${field}.semantic`, // Output field (sparse_vector)
          },
        });
      });

      await this.client.ingest.putPipeline({
        id: this.PIPELINE_NAME,
        processors: processors,
        description:
          'ELSER semantic search pipeline - automatically populates semantic fields',
      });
    } catch (error: any) {
      this.logger.error('Failed to create/update ELSER semantic pipeline', {
        error: error.message,
        pipelineName: this.PIPELINE_NAME,
      });
      throw error;
    }
  }

  /**
   * Pipeline'ın var olup olmadığını kontrol eder
   */
  async pipelineExists(): Promise<boolean> {
    try {
      const response = await this.client.ingest.getPipeline({
        id: this.PIPELINE_NAME,
      });
      return !!response[this.PIPELINE_NAME];
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      this.logger.warn('Error checking pipeline existence', { error });
      return false;
    }
  }

  /**
   * Pipeline'ı siler
   */
  async deletePipeline(): Promise<void> {
    try {
      await this.client.ingest.deletePipeline({
        id: this.PIPELINE_NAME,
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return;
      }
      this.logger.error('Failed to delete pipeline', { error });
      throw error;
    }
  }

  /**
   * Pipeline adını döner
   */
  getPipelineName(): string {
    return this.PIPELINE_NAME;
  }
}
