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
import { ISynonymService } from '../search/ISynonymService';
import { ISemanticSearchService } from '../search/ISemanticSearchService';
import { ElasticsearchIngestPipeline } from './ElasticsearchIngestPipeline';
import { TOKENS } from '../../services/TOKENS';

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
    private configService: IConfigurationService,
    @inject('ISynonymService')
    private synonymService?: ISynonymService,
    @inject('ISemanticSearchService')
    private semanticSearchService?: ISemanticSearchService,
    @inject(TOKENS.ElasticsearchIngestPipeline)
    private ingestPipeline?: ElasticsearchIngestPipeline
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

    // ELSER model'ini deploy et (eğer semantic search aktifse)
    if (
      this.semanticSearchService &&
      'deployModel' in this.semanticSearchService
    ) {
      try {
        const elserService = this.semanticSearchService as any;
        await elserService.deployModel();
      } catch (error) {
        this.logger.warn(
          'ELSER model deployment failed, continuing without semantic search',
          {
            error,
          }
        );
      }
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
    // ELSER semantic pipeline'ını oluştur (eğer semantic search aktifse ve pipeline yoksa)
    if (this.ingestPipeline && this.semanticSearchService) {
      try {
        // Pipeline zaten varsa tekrar oluşturmaya çalışma
        const pipelineExists = await this.ingestPipeline.pipelineExists();
        if (!pipelineExists) {
          await this.ingestPipeline.createOrUpdatePipeline(searchFields);
        }
      } catch (error: any) {
        this.logger.warn(
          'Failed to create ELSER pipeline, continuing without semantic search',
          {
            error: error?.message || error,
          }
        );
      }
    }

    // Check if index exists - with retry to ensure cluster state is consistent
    let exists = await this.client.indices.exists({ index: indexName });

    // If index doesn't exist, wait a bit and check again to ensure cluster state is cleared
    if (!exists) {
      await new Promise(resolve => setTimeout(resolve, 500));
      exists = await this.client.indices.exists({ index: indexName });
    }

    if (!exists) {
      const mapping = this.createIndexMapping(searchFields);

      // createIndexMapping returns { properties: {...} }
      // Ensure we send it correctly: mappings: { properties: {...} }
      // Double-check mapping structure
      if (!mapping || !mapping.properties) {
        throw new Error(
          `Invalid mapping structure: expected { properties: {...} }, got ${JSON.stringify(mapping)}`
        );
      }

      // Use transport.request to send exact JSON - bypass client transformations
      const requestBody = {
        settings: TURKISH_ANALYZER_SETTINGS,
        mappings: {
          properties: mapping.properties,
        },
      };

      try {
        // Use transport.request to send raw JSON - this bypasses any client-side mapping transformations
        await this.client.transport.request({
          method: 'PUT',
          path: `/${indexName}`,
          body: requestBody,
        });
      } catch (error: any) {
        this.logger.error('Failed to create index', {
          indexName,
          error: error.message,
          errorStatus: error.meta?.statusCode,
        });
        throw error;
      }
    } else {
      // Index zaten var
      // Not: Semantic field'lar (field.semantic) pipeline tarafından otomatik oluşturulur
      // Elasticsearch'te text field'lar için nested field eklemek mümkün değil
      // Pipeline çalıştığında Elasticsearch otomatik olarak semantic field'ları oluşturur
      // Bu yüzden burada mapping güncellemesi yapmıyoruz
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

      // NOTE: Semantic fields (${field}.semantic) are NOT added to the initial mapping
      // They are created dynamically by the ELSER ingest pipeline when documents are indexed
      // Adding them here causes Elasticsearch to misinterpret the parent field as an object type
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
      let semanticSearchUnavailable = false; // Semantic search kullanılamadıysa true

      // Full-text search - EntityType'un searchFields'ını kullan
      if (query && query.trim()) {
        // Query uzunluğu kontrolü (200 karakter limiti)
        const trimmedQuery = query.trim();
        if (trimmedQuery.length > 200) {
          throw new Error('Query too long. Maximum 200 characters allowed.');
        }

        const searchMode = options?.searchMode || 'any_word'; // Varsayılan any_word
        const matchType = options?.matchType || 'fuzzy'; // Varsayılan fuzzy
        const typoTolerance = options?.typoTolerance || 'medium'; // Varsayılan medium
        const smartSearch = options?.smartSearch || false; // Akıllı arama açık/kapalı
        const smartOptions = smartSearch ? options?.smartOptions : undefined;

        // searchMode geçerliliğini kontrol et
        const validModes = ['phrase', 'all_words', 'any_word'];
        const effectiveMode = validModes.includes(searchMode)
          ? searchMode
          : 'any_word';

        const queryClauses: any[] = [];
        const ngramQueryClauses: any[] = [];

        // Kelime sayısını hesapla ve tekrarlayan kelimeleri kaldır
        const words = trimmedQuery.split(/\s+/).filter(w => w.length > 0);

        // Tekrarlayan kelimeleri kaldır (duplicate removal)
        const uniqueWords = Array.from(new Set(words));
        const wordCount = uniqueWords.length;

        // Tek kelime için searchMode'u normalize et - tek kelime için tüm modlar aynı sonucu vermeli
        // Çünkü tek kelime için "phrase", "all_words" ve "any_word" aynı anlama gelir
        const normalizedMode = wordCount === 1 ? 'any_word' : effectiveMode;

        // Fuzziness ve prefix_length belirleme (matchType ve typoTolerance'ye göre)
        let fuzziness: number = 0;
        let prefixLength: number = 0;
        let useNgram = false;
        let useLinguistic = false;
        let useSemantic = false;

        if (matchType === 'fuzzy') {
          // Typo toleransına göre ayarlar
          if (typoTolerance === 'low') {
            fuzziness = 1; // Maksimum 1 karakter hatası
            prefixLength = 3; // İlk 3 karakter kesin doğru olmalı
          } else if (typoTolerance === 'medium') {
            fuzziness = 2; // Maksimum 2 karakter hatası
            prefixLength = 2; // İlk 2 karakter kesin doğru olmalı
          } else if (typoTolerance === 'high') {
            fuzziness = 2; // Maksimum 2 karakter hatası
            prefixLength = 1; // İlk 1 karakter kesin doğru olmalı
          }
          useNgram = true;
        } else if (matchType === 'exact') {
          fuzziness = 0;
          prefixLength = 0;
          useNgram = false;
        }

        // Akıllı arama açıksa linguistic/semantic özellikler kullanılacak
        if (smartSearch) {
          useLinguistic = smartOptions?.linguistic || false;
          useSemantic = smartOptions?.semantic || false;
        }

        // searchMode'a göre query yapısını oluştur (normalize edilmiş mode kullan)
        if (normalizedMode === 'any_word') {
          // Herhangi bir kelime: Her kelimeyi ayrı ayrı ara
          // NOT: any_word modunda fuzzy kullanıldığında çok geniş sonuçlar döner
          // Bu yüzden fuzzy modunda minimum_should_match'i artırıyoruz
          searchFields.forEach((field, idx) => {
            const boost = 3 - idx;
            uniqueWords.forEach(word => {
              const matchQuery: any = {
                match: {
                  [field]: {
                    query: word,
                    boost: boost,
                    operator: 'or',
                  },
                },
              };
              // Fuzzy modunda fuzziness ve prefix_length ekle
              if (matchType === 'fuzzy') {
                // Kısa kelimeler (<4 karakter) için fuzzy kullanma
                if (word.length < 4) {
                  matchQuery.match[field].fuzziness = 0;
                  matchQuery.match[field].prefix_length = 0;
                } else {
                  // Typo toleransına göre ayarlar (kelime uzunluğuna göre dinamik)
                  const wordPrefixLength = Math.min(
                    prefixLength,
                    Math.floor(word.length / 2)
                  );
                  matchQuery.match[field].fuzziness = fuzziness;
                  matchQuery.match[field].prefix_length = wordPrefixLength;
                }
              } else if (matchType === 'exact') {
                matchQuery.match[field].fuzziness = 0;
              }
              queryClauses.push(matchQuery);
            });
          });
        } else if (normalizedMode === 'phrase') {
          // Phrase match: tam sırayla, ama fuzzy modunda fuzziness ekle
          searchFields.forEach((field, idx) => {
            const boost = 3 - idx;
            if (matchType === 'fuzzy') {
              // Fuzzy modunda: match kullan (match_phrase fuzziness desteklemez)
              // operator: 'and' ile tüm kelimelerin aynı sırada olmasını sağla
              const matchQuery: any = {
                match: {
                  [field]: {
                    query: trimmedQuery,
                    boost: boost,
                    operator: 'and', // Tüm kelimeler bulunmalı
                  },
                },
              };
              // Typo toleransına göre fuzziness ve prefix_length ayarla
              if (matchType === 'fuzzy') {
                const avgWordLength =
                  uniqueWords.reduce((sum, w) => sum + w.length, 0) /
                  uniqueWords.length;

                // Kısa kelimeler için özel kurallar
                if (avgWordLength < 4) {
                  matchQuery.match[field].fuzziness = 0;
                  matchQuery.match[field].prefix_length = 0;
                } else {
                  const wordPrefixLength = Math.min(
                    prefixLength,
                    Math.floor(avgWordLength / 2)
                  );
                  matchQuery.match[field].fuzziness = fuzziness;
                  matchQuery.match[field].prefix_length = wordPrefixLength;
                }
              } else if (matchType === 'exact') {
                matchQuery.match[field].fuzziness = 0;
              }
              queryClauses.push(matchQuery);
            } else {
              // Exact modunda: match_phrase kullan
              queryClauses.push({
                match_phrase: {
                  [field]: {
                    query: trimmedQuery,
                    boost: boost,
                    slop: 0, // Kelimeler arası mesafe
                  },
                },
              });
            }
          });
        } else if (normalizedMode === 'all_words') {
          // All words: tüm kelimeler, sıra önemli değil (AND)
          searchFields.forEach((field, idx) => {
            const boost = 3 - idx;
            const matchQuery: any = {
              match: {
                [field]: {
                  query: trimmedQuery,
                  boost: boost,
                  operator: 'and',
                },
              },
            };
            // Fuzziness sadece fuzzy modunda eklenir, exact modunda 0 olmalı
            if (matchType === 'fuzzy') {
              // Typo toleransına göre fuzziness ve prefix_length ayarla
              const avgWordLength =
                uniqueWords.reduce((sum, w) => sum + w.length, 0) /
                uniqueWords.length;

              // Kısa kelimeler için özel kurallar
              if (avgWordLength < 4) {
                matchQuery.match[field].fuzziness = 0;
                matchQuery.match[field].prefix_length = 0;
              } else {
                const wordPrefixLength = Math.min(
                  prefixLength,
                  Math.floor(avgWordLength / 2)
                );
                matchQuery.match[field].fuzziness = fuzziness;
                matchQuery.match[field].prefix_length = wordPrefixLength;
              }
            } else if (matchType === 'exact') {
              matchQuery.match[field].fuzziness = 0;
            }
            queryClauses.push(matchQuery);
          });
        }

        // Ngram field'lar için arama (fuzzy veya smart modunda)
        // NOT: Ngram çok geniş sonuçlar döndürebilir, bu yüzden sadece belirli durumlarda kullanıyoruz
        // - Tek kelime için: Ngram kullanılabilir (daha kontrollü)
        // - Çok kelime için: Ngram kullanma (çok geniş sonuçlar)
        if (useNgram && wordCount === 1) {
          // Sadece tek kelime için ngram kullan (daha kontrollü)
          searchFields.forEach((field, idx) => {
            const boost = 1.5 - idx * 0.2; // Ngram'a daha düşük boost (normal field'lardan sonra gelsin)
            ngramQueryClauses.push({
              match: {
                [`${field}.ngram`]: {
                  query: trimmedQuery,
                  boost: boost,
                  operator: 'or',
                },
              },
            });
          });
        }
        // Çok kelimeli aramalarda ngram kullanmıyoruz - çok geniş sonuçlar döndürür

        // Akıllı arama: Linguistic ve Semantic özelliklerini ekle
        const linguisticClauses: any[] = [];
        const semanticClauses: any[] = [];

        if (smartSearch) {
          // Linguistic: Synonym'leri query'ye ekle
          if (useLinguistic && this.synonymService) {
            try {
              const language = options?.language || 'tr';
              const allSynonyms = await this.synonymService.getAllSynonyms(
                uniqueWords,
                language
              );

              if (allSynonyms.length > 0) {
                // Synonym'leri query'ye ekle
                const synonymQuery = allSynonyms.join(' ');
                searchFields.forEach((field, idx) => {
                  const boost = 2 - idx; // Synonym'ler daha düşük boost
                  if (effectiveMode === 'any_word') {
                    allSynonyms.forEach(synonym => {
                      linguisticClauses.push({
                        match: {
                          [field]: {
                            query: synonym,
                            boost: boost,
                            operator: 'or',
                            fuzziness: 2, // Maksimum 2 karakter hatası
                          },
                        },
                      });
                    });
                  } else if (effectiveMode === 'all_words') {
                    linguisticClauses.push({
                      match: {
                        [field]: {
                          query: synonymQuery,
                          boost: boost,
                          operator: 'and',
                          fuzziness: 2, // Maksimum 2 karakter hatası
                        },
                      },
                    });
                  } else if (effectiveMode === 'phrase') {
                    linguisticClauses.push({
                      match_phrase: {
                        [field]: {
                          query: synonymQuery,
                          boost: boost,
                          slop: 0,
                        },
                      },
                    });
                  }
                });
              }
            } catch (error) {
              this.logger.warn('Synonym service error', { error });
            }
          }

          // Semantic: Vector embeddings ile arama (ELSER)
          if (useSemantic && this.semanticSearchService) {
            try {
              // ELSER model'inin deploy edilip edilmediğini kontrol et
              const elserService = this.semanticSearchService as any;
              if ('isModelDeployed' in elserService) {
                const isDeployed = await elserService.isModelDeployed();
                if (!isDeployed) {
                  this.logger.warn(
                    'ELSER model not deployed, skipping semantic search',
                    {
                      query,
                    }
                  );
                  // Semantic search'i atla, diğer search modlarına devam et
                  semanticSearchUnavailable = true;
                } else {
                  const language = options?.language || 'tr'; // Kullanıcı dilinden al, yoksa varsayılan 'tr'

                  // ELSER için text_expansion query kullan
                  // ELSER'de embedding'ler otomatik oluşturulur, query text'i direkt kullanılır
                  if (
                    'createSemanticQueryWithText' in this.semanticSearchService
                  ) {
                    // ELSER service ise text_expansion query kullan
                    searchFields.forEach((field, idx) => {
                      const boost = 1.5 - idx * 0.1; // Semantic daha düşük boost
                      const semanticField = `${field}.semantic`; // Semantic field adı
                      const semanticQuery =
                        elserService.createSemanticQueryWithText(
                          trimmedQuery,
                          semanticField,
                          boost
                        );
                      semanticClauses.push(semanticQuery);
                    });
                  } else {
                    // Diğer semantic search servisleri için (gelecekte eklenebilir)
                    const queryEmbedding =
                      await this.semanticSearchService.generateQueryEmbedding(
                        query,
                        language
                      );
                    searchFields.forEach((field, idx) => {
                      const boost = 1.5 - idx * 0.1;
                      const semanticField = `${field}.semantic`;
                      const semanticQuery =
                        this.semanticSearchService!.createSemanticQuery(
                          queryEmbedding,
                          semanticField
                        );
                      if (semanticQuery.boost === undefined) {
                        semanticQuery.boost = boost;
                      }
                      semanticClauses.push(semanticQuery);
                    });
                  }
                }
              } else {
                // isModelDeployed metodu yoksa, direkt semantic query oluştur
                const language = options?.language || 'tr';
                if (
                  'createSemanticQueryWithText' in this.semanticSearchService
                ) {
                  const elserService = this.semanticSearchService as any;
                  searchFields.forEach((field, idx) => {
                    const boost = 1.5 - idx * 0.1;
                    const semanticField = `${field}.semantic`;
                    const semanticQuery =
                      elserService.createSemanticQueryWithText(
                        trimmedQuery,
                        semanticField,
                        boost
                      );
                    semanticClauses.push(semanticQuery);
                  });
                }
              }
            } catch (error) {
              this.logger.warn('Semantic search service error', { error });
            }
          }
        }

        // all_words modunda: Normal field'lardan en az birinde tüm kelimeler bulunmalı
        if (effectiveMode === 'all_words') {
          // Normal field'lar: En az birinde tüm kelimeler bulunmalı (should + minimum_should_match)
          // Ngram field'lar kullanılmıyor (all_words'te sadece normal field'larda tüm kelimeler aranmalı)
          const allClauses = [...queryClauses];
          if (linguisticClauses.length > 0) {
            allClauses.push(...linguisticClauses);
          }
          if (semanticClauses.length > 0) {
            allClauses.push(...semanticClauses);
          }

          const boolQuery: any = {
            bool: {
              should: allClauses,
              minimum_should_match: 1, // Normal field'lardan en az biri eşleşmeli
            },
          };

          // Minimum score threshold ekle - düşük kaliteli sonuçları filtrele
          // Typo toleransına göre dinamik threshold
          let minScore = 0;
          if (matchType === 'fuzzy') {
            // Typo toleransına göre threshold ayarla
            if (typoTolerance === 'low') {
              // Düşük tolerans: Yüksek threshold (daha kaliteli sonuçlar)
              if (wordCount === 1) {
                minScore = 3.0;
              } else if (wordCount === 2) {
                minScore = 2.5;
              } else {
                minScore = 2.0;
              }
            } else if (typoTolerance === 'medium') {
              // Orta tolerans: Orta-yüksek threshold
              if (wordCount === 1) {
                minScore = 2.5;
              } else if (wordCount === 2) {
                minScore = 2.0;
              } else {
                minScore = 1.5;
              }
            } else if (typoTolerance === 'high') {
              // Yüksek tolerans: Düşük ama kontrol altında threshold
              if (wordCount === 1) {
                minScore = 2.0;
              } else if (wordCount === 2) {
                minScore = 1.5;
              } else {
                minScore = 1.0;
              }
            }
          } else if (matchType === 'exact') {
            minScore = 0.5;
          }

          if (minScore > 0) {
            mustClauses.push({
              function_score: {
                query: boolQuery,
                min_score: minScore,
                functions: [],
                boost_mode: 'replace',
              },
            });
          } else {
            mustClauses.push(boolQuery);
          }
        } else {
          // Diğer modlar için: Tüm clause'lar should içinde
          const allClauses = [...queryClauses, ...ngramQueryClauses];
          if (linguisticClauses.length > 0) {
            allClauses.push(...linguisticClauses);
          }
          if (semanticClauses.length > 0) {
            allClauses.push(...semanticClauses);
          }

          // any_word modunda minimum_should_match'i kelime sayısına göre ayarla
          let minimumShouldMatch = 1;
          if (effectiveMode === 'any_word') {
            // Fuzzy modunda daha sıkı kontrol
            if (matchType === 'fuzzy') {
              if (wordCount === 1) {
                // Tek kelime: en az 1 eşleşme (ama score threshold ile kontrol edilecek)
                minimumShouldMatch = 1;
              } else if (wordCount === 2) {
                // İki kelime: en az 1 kelime eşleşmeli
                minimumShouldMatch = 1;
              } else {
                // Üç veya daha fazla kelime: kelimelerin en az yarısı eşleşmeli
                minimumShouldMatch = Math.max(1, Math.ceil(wordCount / 2));
              }
            } else {
              // Exact modunda en az 1 kelime yeterli
              minimumShouldMatch = 1;
            }
          }

          // Smart modunda boost stratejisi:
          // - Normal query'ler: En yüksek boost (3, 2)
          // - Linguistic (synonym): Orta boost (2, 1)
          // - Semantic (ELSER): En düşük boost (1.5, 1.4)
          // Bu sayede normal eşleşmeler öncelikli, synonym'ler ikinci, semantic sonuçlar üçüncü sırada gelir

          const boolQuery: any = {
            bool: {
              should: allClauses,
              minimum_should_match: minimumShouldMatch,
            },
          };

          // Minimum score threshold ekle - düşük kaliteli sonuçları filtrele
          // Typo toleransına göre dinamik threshold
          let minScore = 0;
          if (matchType === 'fuzzy') {
            // Typo toleransına göre threshold ayarla
            if (typoTolerance === 'low') {
              // Düşük tolerans: Yüksek threshold (daha kaliteli sonuçlar)
              if (wordCount === 1) {
                minScore = 3.0;
              } else if (wordCount === 2) {
                minScore = 2.5;
              } else {
                minScore = 2.0;
              }
            } else if (typoTolerance === 'medium') {
              // Orta tolerans: Orta-yüksek threshold
              if (wordCount === 1) {
                minScore = 2.5;
              } else if (wordCount === 2) {
                minScore = 2.0;
              } else {
                minScore = 1.5;
              }
            } else if (typoTolerance === 'high') {
              // Yüksek tolerans: Düşük ama kontrol altında threshold
              if (wordCount === 1) {
                minScore = 2.0;
              } else if (wordCount === 2) {
                minScore = 1.5;
              } else {
                minScore = 1.0;
              }
            }
          } else if (matchType === 'exact') {
            minScore = 0.5;
          }

          if (minScore > 0) {
            mustClauses.push({
              function_score: {
                query: boolQuery,
                min_score: minScore,
                functions: [],
                boost_mode: 'replace',
              },
            });
          } else {
            mustClauses.push(boolQuery);
          }
        }
      } else {
        // Query yoksa tüm sonuçları getir
        mustClauses.push({ match_all: {} });
      }

      // Exclude IDs if provided
      if (options?.excludeIds && options.excludeIds.length > 0) {
        mustClauses.push({
          bool: {
            must_not: {
              terms: {
                _id: options.excludeIds,
              },
            },
          },
        });
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

      const result: SearchResult<TDoc> = {
        hits,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Semantic search kullanılamadıysa warning ekle
      if (semanticSearchUnavailable) {
        result.warnings = {
          semanticSearchUnavailable: true,
        };
      }

      return result;
    } catch (error: any) {
      this.logger.error('Failed to search in Elasticsearch', {
        error: error.message,
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
    document: Record<string, any>,
    pipeline?: string
  ): Promise<void> {
    const indexParams: any = {
      index: indexName,
      id,
      document,
      refresh: true,
    };

    // ELSER pipeline'ını kullan (eğer varsa)
    if (pipeline) {
      indexParams.pipeline = pipeline;
    }

    await this.client.index(indexParams);
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
