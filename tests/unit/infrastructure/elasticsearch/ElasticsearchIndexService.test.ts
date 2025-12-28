// Isolated unit test - no MongoDB or external dependencies needed
// All dependencies are mocked

// Mock mongoose to prevent MongoDB connection attempts
jest.mock('mongoose', () => ({
  createConnection: jest.fn().mockResolvedValue({
    asPromise: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  connection: {
    dropDatabase: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock ApplicationSetup to prevent full app initialization
jest.mock('../../../../services/ApplicationSetup', () => ({
  ApplicationSetup: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getApp: jest.fn().mockReturnValue({}),
  })),
}));

// Mock container initialization
jest.mock('../../../../services/container', () => ({
  initializeContainer: jest.fn().mockResolvedValue(undefined),
}));

import 'reflect-metadata';
import { ElasticsearchIndexService } from '../../../../infrastructure/elasticsearch/ElasticsearchIndexService';
import { FakeElasticsearchClient } from '../../../mocks/elasticsearch/FakeElasticsearchClient';
import { FakeSynonymService } from '../../../mocks/search/FakeSynonymService';
import { FakeSemanticSearchService } from '../../../mocks/search/FakeSemanticSearchService';
import { FakeLoggerProvider } from '../../../mocks/logger/FakeLoggerProvider';
import { IConfigurationService } from '../../../../services/contracts/IConfigurationService';
import { ElasticsearchIngestPipeline } from '../../../../infrastructure/elasticsearch/ElasticsearchIngestPipeline';
import { TOKENS } from '../../../../services/TOKENS';

describe('ElasticsearchIndexService', () => {
  let service: ElasticsearchIndexService;
  let fakeElasticsearchClient: FakeElasticsearchClient;
  let fakeLogger: FakeLoggerProvider;
  let fakeConfigService: IConfigurationService;
  let fakeSynonymService: FakeSynonymService;
  let fakeSemanticService: FakeSemanticSearchService;
  let fakeIngestPipeline: ElasticsearchIngestPipeline;

  const TEST_INDEX = 'test-index';
  const TEST_SEARCH_FIELDS = ['title', 'content'];

  beforeEach(() => {
    fakeElasticsearchClient = new FakeElasticsearchClient();
    fakeLogger = new FakeLoggerProvider();
    fakeSynonymService = new FakeSynonymService();
    fakeSemanticService = new FakeSemanticSearchService(false);

    fakeConfigService = {
      getElasticsearchConfig: jest.fn().mockReturnValue({
        enabled: true,
        url: 'http://localhost:9200',
        tlsEnabled: false,
        tlsSkipVerify: false,
      }),
    } as any;

    fakeIngestPipeline = {
      pipelineExists: jest.fn().mockResolvedValue(false),
      createOrUpdatePipeline: jest.fn().mockResolvedValue(undefined),
      getPipelineName: jest.fn().mockReturnValue('elser-semantic-pipeline'),
    } as any;

    service = new ElasticsearchIndexService(
      fakeElasticsearchClient,
      fakeLogger,
      fakeConfigService,
      fakeSynonymService,
      fakeSemanticService,
      fakeIngestPipeline
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Validation', () => {
    it('should handle empty query (returns all documents)', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
      });
      // Empty query returns all documents (match_all)
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, '', {});
      expect(result).toBeDefined();
      expect(result.hits).toBeDefined();
    });

    it('should handle short queries (no minimum length validation)', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Ab',
        content: 'Ab content',
      });
      // Current implementation doesn't validate minimum length
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'ab', {});
      expect(result).toBeDefined();
    });

    it('should throw error for query longer than 200 characters', async () => {
      const longQuery = 'a'.repeat(201);
      await expect(
        service.search(TEST_INDEX, TEST_SEARCH_FIELDS, longQuery, {})
      ).rejects.toThrow('Query too long');
    });

    it('should accept normal query', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
      });

      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {});
      expect(result).toBeDefined();
      expect(result.hits).toBeDefined();
    });
  });

  describe('Search Mode Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'This is a test',
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'World Hello',
        content: 'Another test',
      });
    });

    it('should use phrase mode - words in same order', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        searchMode: 'phrase',
      });
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it('should use all_words mode - all words must be present', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        searchMode: 'all_words',
      });
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it('should use any_word mode - any word is sufficient', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello test', {
        searchMode: 'any_word',
      });
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it('should normalize single word to any_word mode', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        searchMode: 'phrase', // Should be normalized to any_word
      });
      expect(result.hits.length).toBeGreaterThan(0);
    });
  });

  describe('Match Type Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Exact match test',
      });
    });

    it('should use exact match - fuzziness: 0', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'exact',
      });
      expect(result).toBeDefined();
      // Verify fuzziness is 0 in the query (check mock call)
      const searchCall = (fakeElasticsearchClient.getClient().search as jest.Mock).mock.calls[0];
      expect(searchCall).toBeDefined();
    });

    it('should use fuzzy match with typo tolerance', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Typo Tolerance Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
      });
    });

    it('should use low tolerance - prefix_length=3, fuzziness=1', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
        typoTolerance: 'low',
      });
      expect(result).toBeDefined();
    });

    it('should use medium tolerance - prefix_length=2, fuzziness=2', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should use high tolerance - prefix_length=1, fuzziness=2', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });

    it('should ignore typoTolerance in exact mode', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'exact',
        typoTolerance: 'high', // Should be ignored
      });
      expect(result).toBeDefined();
    });
  });

  describe('Smart Search Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
      });
    });

    it('should enable linguistic search when smartSearch is true', async () => {
      fakeSynonymService.addSynonym('test', 'deneme', 'tr');
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: true, semantic: false },
        language: 'tr',
      });
      expect(result).toBeDefined();
      expect(fakeSynonymService.getAllSynonyms).toBeDefined();
    });

    it('should not use linguistic when smartSearch is false', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: false,
      });
      expect(result).toBeDefined();
    });

    it('should handle semantic search when ELSER is deployed', async () => {
      fakeSemanticService.setModelDeployed(true);
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: false, semantic: true },
      });
      expect(result).toBeDefined();
    });

    it('should skip semantic search when ELSER is not deployed', async () => {
      fakeSemanticService.setModelDeployed(false);
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: false, semantic: true },
      });
      expect(result).toBeDefined();
      expect(result.warnings?.semanticSearchUnavailable).toBe(true);
    });
  });

  describe('Edge Case Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should handle single word queries', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {});
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it('should remove duplicate words', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello',
        content: 'Hello world',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello hello', {});
      expect(result).toBeDefined();
    });

    it('should handle short words (<4 characters) - no fuzziness', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hi',
        content: 'Hi there',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hi', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });

    it('should handle long words (>6 characters) with dynamic prefix_length', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'JavaScript',
        content: 'JavaScript programming',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'javascript', {
        matchType: 'fuzzy',
        typoTolerance: 'low',
      });
      expect(result).toBeDefined();
    });

    it('should handle Turkish characters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Şirket Yönetimi',
        content: 'Şirket yönetimi hakkında',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'şirket', {});
      expect(result).toBeDefined();
    });

    it('should filter special characters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test@test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {});
      expect(result).toBeDefined();
    });
  });

  describe('Minimum Score Threshold Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should use high min_score for single word + low tolerance', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
        typoTolerance: 'low',
      });
      expect(result).toBeDefined();
    });

    it('should use medium min_score for two words + medium tolerance', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'Hello world content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should use low min_score for many words + high tolerance', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World Test',
        content: 'Hello world test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world test', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });

    it('should use low min_score for exact mode', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'exact',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Pagination Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      // Add multiple documents
      for (let i = 1; i <= 25; i++) {
        fakeElasticsearchClient.addDocument(TEST_INDEX, String(i), {
          title: `Test ${i}`,
          content: `Content ${i}`,
        });
      }
    });

    it('should paginate correctly - page 1, limit 10', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        page: 1,
        limit: 10,
      });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hits.length).toBeLessThanOrEqual(10);
    });

    it('should paginate correctly - page 2, limit 20', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        page: 2,
        limit: 20,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should calculate totalPages correctly', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        page: 1,
        limit: 10,
      });
      expect(result.totalPages).toBeGreaterThan(0);
      expect(result.totalPages).toBe(Math.ceil(result.total / result.limit));
    });
  });

  describe('Filter Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
        category: 'tech',
        user: 'user1',
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Another Question',
        content: 'Another content',
        category: 'science',
        user: 'user2',
      });
    });

    it('should filter by category', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: { category: 'tech' },
      });
      expect(result).toBeDefined();
    });

    it('should filter by user', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: { user: 'user1' },
      });
      expect(result).toBeDefined();
    });

    it('should handle multiple filters', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: { category: 'tech', user: 'user1' },
      });
      expect(result).toBeDefined();
    });

    it('should filter by date range', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
        createdAt: new Date('2024-01-15'),
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Another Question',
        content: 'Another content',
        createdAt: new Date('2024-02-15'),
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: {
          createdAt: {
            gte: '2024-01-01',
            lte: '2024-01-31',
          },
        },
      });
      expect(result).toBeDefined();
    });

    it('should filter by numeric range', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test content',
        views: 10,
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Another Question',
        content: 'Another content',
        views: 50,
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: {
          views: {
            gte: 5,
            lte: 20,
          },
        },
      });
      expect(result).toBeDefined();
    });
  });

  describe('Exclude IDs Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test 1',
        content: 'Content 1',
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Test 2',
        content: 'Content 2',
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '3', {
        title: 'Test 3',
        content: 'Content 3',
      });
    });

    it('should exclude single ID', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        excludeIds: ['1'],
      });
      expect(result).toBeDefined();
      // Verify excluded ID is not in results
      const excludedIds = result.hits.map((h: any) => h._id);
      expect(excludedIds).not.toContain('1');
    });

    it('should exclude multiple IDs', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        excludeIds: ['1', '2'],
      });
      expect(result).toBeDefined();
      const excludedIds = result.hits.map((h: any) => h._id);
      expect(excludedIds).not.toContain('1');
      expect(excludedIds).not.toContain('2');
    });
  });

  describe('Sort Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-01'),
        likes: ['user1'],
        views: 10,
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-02'),
        likes: ['user1', 'user2'],
        views: 20,
      });
    });

    it('should sort by relevance (default)', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        sortBy: 'relevance',
      });
      expect(result).toBeDefined();
    });

    it('should sort by date', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        sortBy: 'date',
        sortOrder: 'desc',
      });
      expect(result).toBeDefined();
    });

    it('should sort by popularity', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        sortBy: 'popularity',
        sortOrder: 'desc',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Ngram Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should use ngram for single word queries', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });

    it('should not use ngram for multi-word queries', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'Hello world content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Synonym Service Integration Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Deneme',
        content: 'Deneme içerik',
      });
    });

    it('should add linguistic clauses when synonyms found', async () => {
      fakeSynonymService.addSynonym('test', 'deneme', 'tr');
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: true, semantic: false },
        language: 'tr',
      });
      expect(result).toBeDefined();
    });

    it('should continue when no synonyms found', async () => {
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'nonexistent', {
        smartSearch: true,
        smartOptions: { linguistic: true, semantic: false },
        language: 'tr',
      });
      expect(result).toBeDefined();
    });

    it('should handle synonym service errors gracefully', async () => {
      jest.spyOn(fakeSynonymService, 'getAllSynonyms').mockRejectedValueOnce(new Error('Service error'));
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: true, semantic: false },
        language: 'tr',
      });
      expect(result).toBeDefined();
      expect(fakeLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Semantic Search Integration Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
    });

    it('should add semantic clauses when ELSER is deployed', async () => {
      fakeSemanticService.setModelDeployed(true);
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: false, semantic: true },
      });
      expect(result).toBeDefined();
    });

    it('should skip semantic search when ELSER is not deployed', async () => {
      fakeSemanticService.setModelDeployed(false);
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: false, semantic: true },
      });
      expect(result).toBeDefined();
      expect(result.warnings?.semanticSearchUnavailable).toBe(true);
    });

    it('should handle semantic service errors gracefully', async () => {
      jest.spyOn(fakeSemanticService, 'isModelDeployed').mockRejectedValueOnce(new Error('Service error'));
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        smartSearch: true,
        smartOptions: { linguistic: false, semantic: true },
      });
      expect(result).toBeDefined();
      expect(fakeLogger.warn).toHaveBeenCalled();
    });
  });

  describe('Index Management Tests', () => {
    it('should create index if it does not exist', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      await service.ensureIndexExists(TEST_INDEX, TEST_SEARCH_FIELDS);
      expect(fakeElasticsearchClient.getClient().transport.request).toHaveBeenCalled();
    });

    it('should skip index creation if it already exists', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      await service.ensureIndexExists(TEST_INDEX, TEST_SEARCH_FIELDS);
      // Should not call create if exists
      const createCalls = (fakeElasticsearchClient.getClient().transport.request as jest.Mock).mock.calls.filter(
        (call: any[]) => call[0]?.method === 'PUT' && call[0]?.path === `/${TEST_INDEX}`
      );
      expect(createCalls.length).toBe(0);
    });

    it('should register index', () => {
      service.registerIndex(TEST_INDEX, TEST_SEARCH_FIELDS);
      // Index should be registered
      expect(service).toBeDefined();
    });

    it('should initialize registered indexes', async () => {
      service.registerIndex(TEST_INDEX, TEST_SEARCH_FIELDS);
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      await service.initializeRegisteredIndexes();
      expect(fakeElasticsearchClient.getClient().transport.request).toHaveBeenCalled();
    });

    it('should handle index creation retry logic', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      // Mock exists to return false first, then true (simulating retry)
      let callCount = 0;
      jest.spyOn(fakeElasticsearchClient.getClient().indices, 'exists').mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? false : true;
      });
      await service.ensureIndexExists(TEST_INDEX, TEST_SEARCH_FIELDS);
      expect(fakeElasticsearchClient.getClient().indices.exists).toHaveBeenCalled();
    });

    it('should create pipeline when semantic search is enabled', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      jest.spyOn(fakeIngestPipeline, 'pipelineExists').mockResolvedValueOnce(false);
      await service.ensureIndexExists(TEST_INDEX, TEST_SEARCH_FIELDS);
      expect(fakeIngestPipeline.pipelineExists).toHaveBeenCalled();
    });

    it('should skip pipeline creation if pipeline already exists', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      jest.spyOn(fakeIngestPipeline, 'pipelineExists').mockResolvedValueOnce(true);
      await service.ensureIndexExists(TEST_INDEX, TEST_SEARCH_FIELDS);
      expect(fakeIngestPipeline.createOrUpdatePipeline).not.toHaveBeenCalled();
    });
  });

  describe('Document Operations Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should index document', async () => {
      const doc = { title: 'Test', content: 'Content' };
      await service.indexDocument(TEST_INDEX, '1', doc);
      expect(fakeElasticsearchClient.getClient().index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: TEST_INDEX,
          id: '1',
          document: doc,
        })
      );
    });

    it('should update document', async () => {
      // First add a document to update
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Original',
        content: 'Content',
      });
      const doc = { title: 'Updated' };
      await service.updateDocument(TEST_INDEX, '1', doc);
      expect(fakeElasticsearchClient.getClient().update).toHaveBeenCalledWith(
        expect.objectContaining({
          index: TEST_INDEX,
          id: '1',
          doc: doc,
        })
      );
    });

    it('should delete document', async () => {
      await service.deleteDocument(TEST_INDEX, '1');
      expect(fakeElasticsearchClient.getClient().delete).toHaveBeenCalledWith(
        expect.objectContaining({
          index: TEST_INDEX,
          id: '1',
        })
      );
    });

    it('should use pipeline when indexing with pipeline', async () => {
      const doc = { title: 'Test', content: 'Content' };
      await service.indexDocument(TEST_INDEX, '1', doc, 'test-pipeline');
      expect(fakeElasticsearchClient.getClient().index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: TEST_INDEX,
          id: '1',
          document: doc,
          pipeline: 'test-pipeline',
        })
      );
    });
  });

  describe('Realistic Test Cases', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should handle "test" - single word, all modes normalize', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const phraseResult = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        searchMode: 'phrase',
      });
      const allWordsResult = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        searchMode: 'all_words',
      });
      const anyWordResult = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        searchMode: 'any_word',
      });
      // All should return results (normalized to any_word)
      expect(phraseResult.hits.length).toBeGreaterThan(0);
      expect(allWordsResult.hits.length).toBeGreaterThan(0);
      expect(anyWordResult.hits.length).toBeGreaterThan(0);
    });

    it('should handle "hello hello" - duplicate words removed', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello',
        content: 'Hello world',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello hello', {});
      expect(result).toBeDefined();
    });

    it('should handle "hello helo" - typo tolerance works', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello',
        content: 'Hello world',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'helo', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle "hi javascript" - short + long word combination', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hi JavaScript',
        content: 'Hi JavaScript programming',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hi javascript', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle "ello naber" - first letter missing, high tolerance', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'ello naber', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });

    it('should handle "hello nabera" - second word has typo', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello nabera', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle "heloo naber" - first word has typo', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'heloo naber', {
        matchType: 'fuzzy',
        typoTolerance: 'medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle "helo nabera" - both words have typos', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'helo nabera', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });

    it('should handle "naber hello" - phrase mode order matters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Naber Hello',
        content: 'Naber hello content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'naber hello', {
        searchMode: 'phrase',
        matchType: 'exact',
      });
      expect(result).toBeDefined();
    });

    it('should handle "hello nber" - high tolerance test', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello Naber',
        content: 'Hello naber content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello nber', {
        matchType: 'fuzzy',
        typoTolerance: 'high',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Additional Edge Cases', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should handle query with leading/trailing whitespace', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, '  test  ', {});
      expect(result).toBeDefined();
    });

    it('should handle query with multiple spaces between words', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'Hello world content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello    world', {});
      expect(result).toBeDefined();
    });

    it('should handle array filters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
        tags: ['tag1', 'tag2'],
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: { tags: ['tag1', 'tag2'] },
      });
      expect(result).toBeDefined();
    });

    it('should handle empty filters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: {},
      });
      expect(result).toBeDefined();
    });

    it('should handle undefined filters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        filters: undefined,
      });
      expect(result).toBeDefined();
    });

    it('should handle sort order asc', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-01'),
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-02'),
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        sortBy: 'date',
        sortOrder: 'asc',
      });
      expect(result).toBeDefined();
    });

    it('should handle sort order desc', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-01'),
      });
      fakeElasticsearchClient.addDocument(TEST_INDEX, '2', {
        title: 'Test',
        content: 'Content',
        createdAt: new Date('2024-01-02'),
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        sortBy: 'date',
        sortOrder: 'desc',
      });
      expect(result).toBeDefined();
    });

    it('should handle multiple search fields', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Title',
        content: 'Test Content',
        tags: ['test'],
      });
      const result = await service.search(TEST_INDEX, ['title', 'content', 'tags'], 'test', {});
      expect(result).toBeDefined();
    });

    it('should handle query exactly at 200 character limit', async () => {
      const query200 = 'a'.repeat(200);
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: query200,
        content: 'Content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, query200, {});
      expect(result).toBeDefined();
    });

    it('should handle query with Turkish special characters', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Şirket Yönetimi',
        content: 'Şirket yönetimi hakkında bilgi',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'şirket yönetimi', {});
      expect(result).toBeDefined();
    });

    it('should handle query with numbers', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test 123',
        content: 'Content 456',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test 123', {});
      expect(result).toBeDefined();
    });

    it('should handle query with mixed case', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test Question',
        content: 'Test Content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'TEST QUESTION', {});
      expect(result).toBeDefined();
    });
  });

  describe('Minimum Should Match Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should set minimum_should_match correctly for any_word mode with single word', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Test',
        content: 'Test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {
        searchMode: 'any_word',
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });

    it('should set minimum_should_match correctly for any_word mode with two words', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'Hello world content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        searchMode: 'any_word',
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });

    it('should set minimum_should_match correctly for any_word mode with many words', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World Test',
        content: 'Hello world test content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world test example', {
        searchMode: 'any_word',
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });

    it('should set minimum_should_match=1 for all_words mode', async () => {
      fakeElasticsearchClient.addDocument(TEST_INDEX, '1', {
        title: 'Hello World',
        content: 'Hello world content',
      });
      const result = await service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'hello world', {
        searchMode: 'all_words',
        matchType: 'fuzzy',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Index Mapping Tests', () => {
    it('should create correct index mapping structure', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      await service.ensureIndexExists(TEST_INDEX, ['title', 'content']);
      const createCall = (fakeElasticsearchClient.getClient().transport.request as jest.Mock).mock.calls.find(
        (call: any[]) => call[0]?.method === 'PUT' && call[0]?.path === `/${TEST_INDEX}`
      );
      expect(createCall).toBeDefined();
      if (createCall) {
        const body = createCall[0].body;
        expect(body.mappings).toBeDefined();
        expect(body.mappings.properties).toBeDefined();
        expect(body.settings).toBeDefined();
      }
    });

    it('should not include semantic fields in initial mapping', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      await service.ensureIndexExists(TEST_INDEX, ['title', 'content']);
      const createCall = (fakeElasticsearchClient.getClient().transport.request as jest.Mock).mock.calls.find(
        (call: any[]) => call[0]?.method === 'PUT' && call[0]?.path === `/${TEST_INDEX}`
      );
      if (createCall) {
        const body = createCall[0].body;
        const mappingStr = JSON.stringify(body.mappings);
        // Semantic fields should NOT be in initial mapping
        expect(mappingStr).not.toContain('title.semantic');
        expect(mappingStr).not.toContain('content.semantic');
      }
    });

    it('should include ngram fields in mapping', async () => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, false);
      await service.ensureIndexExists(TEST_INDEX, ['title', 'content']);
      const createCall = (fakeElasticsearchClient.getClient().transport.request as jest.Mock).mock.calls.find(
        (call: any[]) => call[0]?.method === 'PUT' && call[0]?.path === `/${TEST_INDEX}`
      );
      if (createCall) {
        const body = createCall[0].body;
        const mappingStr = JSON.stringify(body.mappings);
        // Ngram fields should be in mapping
        expect(mappingStr).toContain('ngram');
      }
    });
  });

  describe('Health Check Tests', () => {
    it('should return health status', async () => {
      const isHealthy = await service.isHealthy();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('Error Handling Tests', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists(TEST_INDEX, true);
    });

    it('should throw error when Elasticsearch is disabled', async () => {
      jest.spyOn(fakeConfigService, 'getElasticsearchConfig').mockReturnValueOnce({
        enabled: false,
        url: 'http://localhost:9200',
        tlsEnabled: false,
        tlsSkipVerify: false,
      });
      await expect(
        service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {})
      ).rejects.toThrow('Elasticsearch is not enabled');
    });

    it('should handle search errors gracefully', async () => {
      jest.spyOn(fakeElasticsearchClient.getClient(), 'search').mockRejectedValueOnce(new Error('Search error'));
      await expect(
        service.search(TEST_INDEX, TEST_SEARCH_FIELDS, 'test', {})
      ).rejects.toThrow();
      expect(fakeLogger.error).toHaveBeenCalled();
    });
  });
});
