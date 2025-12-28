import { injectable, inject } from 'tsyringe';
import { ISemanticSearchService } from './ISemanticSearchService';
import { IElasticsearchClient } from '../elasticsearch/IElasticsearchClient';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import { Client } from '@elastic/elasticsearch';

/**
 * ELSER Semantic Search Service Implementation
 * Elasticsearch'in ELSER (Elastic Learned Sparse Encoder) modelini kullanır
 */
@injectable()
export class ElserSemanticSearchService implements ISemanticSearchService {
  private client: Client;
  private readonly ELSER_MODEL_ID = '.elser_model_2'; // ELSER v2 model ID

  constructor(
    @inject('IElasticsearchClient')
    private elasticsearchClient: IElasticsearchClient,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {
    this.client = elasticsearchClient.getClient();
  }

  /**
   * Query için embedding oluşturur (ELSER text_expansion kullanır)
   * ELSER'de embedding'ler Elasticsearch tarafından otomatik oluşturulur
   * Bu metod sadece query'yi döner, gerçek embedding ELSER tarafından yapılır
   */
  async generateQueryEmbedding(
    query: string,
    language: string
  ): Promise<number[]> {
    // ELSER'de embedding'ler Elasticsearch tarafından otomatik oluşturulur
    // Bu metod sadece interface uyumluluğu için var
    // Gerçek embedding text_expansion query'sinde yapılır
    throw new Error(
      'ELSER does not require manual embedding generation. Use text_expansion query directly.'
    );
  }

  /**
   * Document için embedding oluşturur
   * ELSER'de document embedding'leri index time'da otomatik oluşturulur
   */
  async generateDocumentEmbedding(
    text: string,
    language: string
  ): Promise<number[]> {
    // ELSER'de document embedding'leri index time'da otomatik oluşturulur
    // Bu metod sadece interface uyumluluğu için var
    throw new Error(
      'ELSER document embeddings are created automatically at index time via ingest pipeline.'
    );
  }

  /**
   * ELSER semantic search query oluşturur
   * Elasticsearch'in text_expansion query'sini kullanır
   */
  createSemanticQuery(queryEmbedding: number[], fieldName: string): any {
    // ELSER için text_expansion query kullanılır
    // queryEmbedding parametresi burada kullanılmaz, query string direkt kullanılır
    // Ama interface uyumluluğu için parametreyi alıyoruz
    throw new Error(
      'Use createSemanticQueryWithText instead for ELSER text_expansion queries.'
    );
  }

  /**
   * ELSER için text_expansion query oluşturur
   * @param queryText Arama sorgusu metni
   * @param fieldName Semantic field adı (örn: "title.semantic")
   * @param boost Boost değeri
   */
  createSemanticQueryWithText(
    queryText: string,
    fieldName: string,
    boost: number = 1.0
  ): any {
    // text_expansion query'si boost'u desteklemez
    // Boost'u uygulamak için query'yi function_score ile wrap etmek gerekir
    const textExpansionQuery = {
      text_expansion: {
        [fieldName]: {
          model_id: this.ELSER_MODEL_ID,
          model_text: queryText,
        },
      },
    };

    // Boost 1.0 değilse, query'yi function_score ile wrap et
    if (boost !== 1.0) {
      return {
        function_score: {
          query: textExpansionQuery,
          boost: boost,
        },
      };
    }

    return textExpansionQuery;
  }

  /**
   * ELSER model'inin deploy edilip edilmediğini kontrol eder
   * Sadece model'in var olup olmadığını değil, gerçekten deploy edilip edilmediğini kontrol eder
   */
  async isModelDeployed(): Promise<boolean> {
    try {
      // Önce model'in var olup olmadığını kontrol et
      const modelResponse = await this.client.ml.getTrainedModels({
        model_id: this.ELSER_MODEL_ID,
      });

      // Model yoksa false döndür
      if (
        !modelResponse.trained_model_configs ||
        modelResponse.trained_model_configs.length === 0
      ) {
        return false;
      }

      // Model varsa, deployment durumunu kontrol et
      try {
        const deploymentStatus = await this.client.ml.getTrainedModelsStats({
          model_id: this.ELSER_MODEL_ID,
        });

        const deploymentInfo =
          deploymentStatus.trained_model_stats?.[0]?.deployment_stats;

        // deployment_stats bir array olabilir veya tek bir obje olabilir
        if (deploymentInfo) {
          const deploymentArray = Array.isArray(deploymentInfo)
            ? deploymentInfo
            : [deploymentInfo];

          if (deploymentArray.length > 0) {
            const firstDeployment = deploymentArray[0] as any;
            const deploymentState = firstDeployment?.state;

            // Model deploy edilmişse state "started" veya "started" benzeri bir durum olmalı
            // ELSER model'leri için genellikle state "started" olur
            if (
              deploymentState === 'started' ||
              deploymentState === 'starting'
            ) {
              return true;
            }
          }
        }

        // Deployment stats yoksa veya state "started" değilse, model deploy edilmemiş demektir
        return false;
      } catch (statsError: any) {
        // Deployment stats alınamadıysa, model kayıtlı ama deploy edilmemiş olabilir
        this.logger.debug(
          'Could not get deployment stats, assuming model not deployed',
          {
            error: statsError.message,
          }
        );
        return false;
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      this.logger.warn('Error checking ELSER model deployment', { error });
      return false;
    }
  }

  /**
   * ELSER model'ini deploy eder (eğer yoksa)
   * ELSER model'i Elasticsearch'te inference service olarak deploy edilir
   */
  async deployModel(): Promise<void> {
    try {
      // Önce model'in var olup olmadığını kontrol et
      const isDeployed = await this.isModelDeployed();
      if (isDeployed) {
        // Model var, deployment durumunu kontrol et
        try {
          const deploymentStatus = await this.client.ml.getTrainedModelsStats({
            model_id: this.ELSER_MODEL_ID,
          });

          const deploymentInfo =
            deploymentStatus.trained_model_stats?.[0]?.deployment_stats;

          // deployment_stats bir array olabilir veya tek bir obje olabilir
          if (deploymentInfo) {
            const deploymentArray = Array.isArray(deploymentInfo)
              ? deploymentInfo
              : [deploymentInfo];

            if (deploymentArray.length > 0) {
              const firstDeployment = deploymentArray[0] as any;
              const deploymentState = firstDeployment?.state;

              if (deploymentState) {
                this.logger.info('ELSER model already deployed and running', {
                  modelId: this.ELSER_MODEL_ID,
                  state: deploymentState,
                });
                return;
              }
            }
          }
        } catch (error: any) {
          // Deployment stats alınamadı, devam et
          this.logger.debug(
            'Could not get deployment stats, attempting deployment',
            {
              error: error.message,
            }
          );
        }
      }

      // Model yoksa veya deploy edilmemişse, deploy et
      // ELSER model'i için inference service oluştur
      try {
        // Önce model'i download et (eğer yoksa)
        // Elasticsearch 8.x'te ELSER model'i otomatik olarak download edilir
        // Ama bazen manuel olarak yapmak gerekebilir

        // Model'i inference service olarak deploy et
        await this.client.ml.startTrainedModelDeployment({
          model_id: this.ELSER_MODEL_ID,
          wait_for: 'started', // Deployment'ın tamamlanmasını bekle
          timeout: '5m', // 5 dakika timeout
        });

        this.logger.info('ELSER model deployed successfully', {
          modelId: this.ELSER_MODEL_ID,
        });
      } catch (error: any) {
        // Model zaten deploy edilmiş olabilir veya başka bir hata
        if (
          error.statusCode === 400 &&
          error.message?.includes('already deployed')
        ) {
          this.logger.info('ELSER model already deployed');
          return;
        }

        // Model download edilmemiş olabilir
        if (error.statusCode === 404 || error.message?.includes('not found')) {
          this.logger.warn(
            'ELSER model not found. Please download it first using Elasticsearch API or Kibana.',
            {
              modelId: this.ELSER_MODEL_ID,
              hint: 'You can download ELSER model using: POST /_ml/trained_models/.elser_model_2/_download',
            }
          );
          throw new Error(
            `ELSER model ${this.ELSER_MODEL_ID} not found. Please download it first.`
          );
        }

        throw error;
      }
    } catch (error: any) {
      this.logger.error('Failed to deploy ELSER model', {
        error: error.message,
        modelId: this.ELSER_MODEL_ID,
      });
      throw error;
    }
  }

  /**
   * ELSER model'ini indirir (download)
   * Elasticsearch 8.x'te model otomatik olarak indirilebilir veya manuel olarak indirilebilir
   */
  async downloadModel(): Promise<void> {
    try {
      // Önce model'in zaten indirilip indirilmediğini kontrol et
      const modelResponse = await this.client.ml.getTrainedModels({
        model_id: this.ELSER_MODEL_ID,
      });

      if (
        modelResponse.trained_model_configs &&
        modelResponse.trained_model_configs.length > 0
      ) {
        this.logger.info('ELSER model already downloaded', {
          modelId: this.ELSER_MODEL_ID,
        });
        return;
      }

      // Model indirilmemişse, direkt HTTP request ile indirmeyi dene
      // Elasticsearch JavaScript client'ında inference API yok, bu yüzden transport.request kullanıyoruz
      try {
        // Transport request ile direkt download endpoint'ini çağır
        await this.client.transport.request({
          method: 'POST',
          path: `/_ml/trained_models/${this.ELSER_MODEL_ID}/_download`,
        });

        this.logger.info('ELSER model download initiated via ML API', {
          modelId: this.ELSER_MODEL_ID,
        });
      } catch (error: any) {
        // Model zaten indiriliyorsa veya başka bir hata
        if (
          error.statusCode === 400 &&
          error.message?.includes('already downloading')
        ) {
          this.logger.info('ELSER model download already in progress');
          return;
        }

        // Download başarısız olursa, manuel download için hata fırlat
        this.logger.warn(
          'Could not download ELSER model via ML API. Please download manually.',
          {
            error: error.message,
            hint: 'Use: curl -X POST "http://localhost:9200/_ml/trained_models/.elser_model_2/_download"',
          }
        );
        throw new Error(
          `Failed to download ELSER model. Please download manually: POST /_ml/trained_models/.elser_model_2/_download`
        );
      }
    } catch (error: any) {
      this.logger.error('Failed to download ELSER model', {
        error: error.message,
        modelId: this.ELSER_MODEL_ID,
      });
      throw error;
    }
  }
}
