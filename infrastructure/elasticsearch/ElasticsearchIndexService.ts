import { injectable, inject } from 'tsyringe';
import { Client, estypes } from '@elastic/elasticsearch';
import { IElasticsearchClient } from './IElasticsearchClient';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';
import {
  ISearchClient,
  SearchOptions,
  SearchResult,
} from '../search/ISearchClient';
import { IDocumentService } from './IDocumentService';
import { IProjector } from '../search/IProjector';

// Turkish analyzer for better search experience
const TURKISH_ANALYZER_SETTINGS: estypes.IndicesCreateRequest['settings'] = {
  index: {
    max_ngram_diff: 10,
  },
  analysis: {
    analyzer: {
      turkish_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'turkish_lowercase',
          'turkish_stop',
          'turkish_stemmer',
          'asciifolding',
        ],
      },
      // Partial match için ngram analyzer
      turkish_ngram_analyzer: {
        type: 'custom' as const,
        tokenizer: 'standard',
        filter: ['lowercase', 'turkish_lowercase', 'ngram_filter'],
      },
    },
    filter: {
      turkish_lowercase: {
        type: 'lowercase' as const,
        language: 'turkish',
      },
      turkish_stop: {
        type: 'stop' as const,
        stopwords: '_turkish_',
      },
      turkish_stemmer: {
        type: 'stemmer' as const,
        language: 'turkish',
      },
      // Ngram filter - kelime içinde arama için (2-10 aralığı)
      ngram_filter: {
        type: 'ngram' as const,
        min_gram: 2,
        max_gram: 10,
      },
    },
  },
};

@injectable()
export class ElasticsearchIndexService
  implements ISearchClient, IDocumentService
{
  private client: Client;
  private indexMappings = new Map<string, any>();
  private registeredIndexes = new Map<string, string[]>(); // indexName -> searchFields

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
   * Index'i register et (self-registering projectors için)
   * @param indexName Index adı
   * @param searchFields Arama yapılacak field'lar
   */
  registerIndex(indexName: string, searchFields: string[]): void {
    this.registeredIndexes.set(indexName, searchFields);
    //this.logger.info(`Registered index: ${indexName}`, { searchFields });
  }

  /**
   * Tüm register edilmiş index'leri initialize et
   */
  async initializeRegisteredIndexes(): Promise<void> {
    const config = this.configService.getElasticsearchConfig();
    if (!config.enabled) {
      throw new Error('Elasticsearch is not enabled');
    }

    // Tüm register edilmiş index'leri oluştur
    for (const [indexName, searchFields] of this.registeredIndexes) {
      await this.ensureIndexExists(indexName, searchFields);
    }
  }

  /**
   * Index'i oluştur (eğer yoksa)
   * @param indexName Index adı
   * @param searchFields Arama yapılacak field'lar
   */
  async ensureIndexExists(
    indexName: string,
    searchFields: string[]
  ): Promise<void> {
    const exists = await this.client.indices.exists({ index: indexName });

    if (!exists) {
      const mapping = this.createIndexMapping(searchFields);
      await this.client.indices.create({
        index: indexName,
        settings: TURKISH_ANALYZER_SETTINGS,
        mappings: mapping,
      });
      //this.logger.info(`Created Elasticsearch index: ${indexName}`);
    }
  }

  private createIndexMapping(searchFields: string[]): any {
    // Generic mapping oluştur - searchFields'dan
    const properties: Record<string, any> = {};

    // Search field'ları text olarak ekle - hem full text hem ngram için
    searchFields.forEach(field => {
      properties[field] = {
        type: 'text',
        analyzer: 'turkish_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          // Ngram field - partial match için
          ngram: {
            type: 'text',
            analyzer: 'turkish_ngram_analyzer',
          },
        },
      };
    });

    // Generic fields (her entity'de olabilir)
    const genericFields = [
      'user',
      'question',
      'category',
      'tags',
      'views',
      'likes',
      'createdAt',
      'questionId',
      'userId',
      'isAccepted',
      'dislikes',
      'answers',
      'relatedContents',
      'ancestorsIds',
      'ancestorsTypes',
      'rootId',
      'depth',
      'parent',
    ];
    genericFields.forEach(field => {
      if (!properties[field]) {
        if (field === 'tags') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'createdAt') {
          properties[field] = { type: 'date' };
        } else if (field === 'views') {
          properties[field] = { type: 'integer' };
        } else if (field === 'likes') {
          // likes is string[] (user IDs), not integer
          properties[field] = { type: 'keyword' };
        } else if (field === 'dislikes') {
          // dislikes is string[] (user IDs), not integer
          properties[field] = { type: 'keyword' };
        } else if (field === 'isAccepted') {
          properties[field] = { type: 'boolean' };
        } else if (field === 'answers') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'relatedContents') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'parent') {
          properties[field] = {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              type: { type: 'keyword' },
            },
          };
        } else if (field === 'ancestorsIds') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'ancestorsTypes') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'rootId') {
          properties[field] = { type: 'keyword' };
        } else if (field === 'depth') {
          properties[field] = { type: 'integer' };
        } else {
          properties[field] = { type: 'keyword' };
        }
      }
    });

    return { properties };
  }

  // ISearchClient implementation - SearchDocument bazlı
  async search<TDoc = unknown>(
    indexName: string,
    searchFields: string[],
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult<TDoc>> {
    try {
      const config = this.configService.getElasticsearchConfig();
      if (!config.enabled) {
        throw new Error('Elasticsearch is not enabled');
      }

      await this.ensureIndexExists(indexName, searchFields);

      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const from = (page - 1) * limit;

      const mustClauses: any[] = [];

      // Full-text search - EntityType'un searchFields'ını kullan
      if (query && query.trim()) {
        const fields = searchFields.map((field, idx) => `${field}^${3 - idx}`);

        // Match query - normal arama
        const matchQueries = searchFields.map((field, idx) => ({
          match: {
            [field]: {
              query: query,
              boost: 3 - idx,
              operator: 'or',
            },
          },
        }));

        // Ngram field'da ara - partial match için (örn: "testjava" içinde "java")
        const ngramQueries = searchFields.map((field, idx) => ({
          match: {
            [`${field}.ngram`]: {
              query: query,
              boost: 2 - idx,
            },
          },
        }));

        mustClauses.push({
          bool: {
            should: [...matchQueries, ...ngramQueries],
            minimum_should_match: 1,
          },
        });
      } else {
        mustClauses.push({ match_all: {} });
      }

      // Generic filters - EntityType'a göre dinamik
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              mustClauses.push({ terms: { [key]: value } });
            } else {
              mustClauses.push({ term: { [key]: value } });
            }
          }
        }
      }

      // Sort - Generic
      let sort: any[] = [];
      if (options?.sortBy === 'date') {
        sort.push({ createdAt: { order: options.sortOrder || 'desc' } });
      } else if (options?.sortBy === 'popularity') {
        sort.push({ likes: { order: options.sortOrder || 'desc' } });
        sort.push({ views: { order: options.sortOrder || 'desc' } });
      } else {
        sort.push('_score');
        sort.push({ createdAt: { order: 'desc' } });
      }

      const searchQuery = {
        bool: {
          must: mustClauses,
        },
      };

      const searchResponse = await this.client.search<TDoc>({
        index: indexName,
        from,
        size: limit,
        query: searchQuery,
        sort,
      });

      // Elasticsearch'ten dönen _id'yi _source'a ekle
      const hits = searchResponse.hits.hits.map(
        (hit: estypes.SearchHit<TDoc>) => ({
          ...hit._source!,
          _id: hit._id, // Elasticsearch'ten gelen _id'yi ekle
        })
      );

      const total = searchResponse.hits.total
        ? typeof searchResponse.hits.total === 'number'
          ? searchResponse.hits.total
          : searchResponse.hits.total.value
        : 0;

      return {
        hits,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      this.logger.error('Failed to search in Elasticsearch', {
        error: error.message,
        query,
        indexName,
      });
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.elasticsearchClient.isConnected();
    } catch (error) {
      return false;
    }
  }

  // IDocumentService implementation - Tamamen generic
  async indexDocument(
    indexName: string,
    id: string,
    document: Record<string, any>
  ): Promise<void> {
    await this.client.index({
      index: indexName,
      id,
      document,
      refresh: true,
    });
  }

  async updateDocument(
    indexName: string,
    id: string,
    document: Record<string, any>
  ): Promise<void> {
    await this.client.update({
      index: indexName,
      id,
      doc: document,
      refresh: true,
    });
  }

  async deleteDocument(indexName: string, id: string): Promise<void> {
    await this.client.delete({
      index: indexName,
      id,
      refresh: true,
    });
  }

  async createIndexIfNotExists(indexName: string, mapping: any): Promise<void> {
    const exists = await this.client.indices.exists({ index: indexName });
    if (!exists) {
      await this.client.indices.create({
        index: indexName,
        settings: TURKISH_ANALYZER_SETTINGS,
        mappings: mapping.properties || {},
      });
    }
  }
}
