import 'reflect-metadata';
import { QuestionManager } from '../../../../services/managers/QuestionManager';
import { FakeQuestionRepository } from '../../../mocks/repositories/FakeQuestionRepository';
import { FakeAnswerRepository } from '../../../mocks/repositories/FakeAnswerRepository';
import { FakeCacheProvider } from '../../../mocks/cache/FakeCacheProvider';
import { FakeLoggerProvider } from '../../../mocks/logger/FakeLoggerProvider';
import { FakeElasticsearchClient } from '../../../mocks/elasticsearch/FakeElasticsearchClient';
import { FakeSynonymService } from '../../../mocks/search/FakeSynonymService';
import { FakeSemanticSearchService } from '../../../mocks/search/FakeSemanticSearchService';
import { ElasticsearchIndexService } from '../../../../infrastructure/elasticsearch/ElasticsearchIndexService';
import { IConfigurationService } from '../../../../services/contracts/IConfigurationService';
import { ElasticsearchIngestPipeline } from '../../../../infrastructure/elasticsearch/ElasticsearchIngestPipeline';
import { QuestionProjector } from '../../../../infrastructure/search/projectors/QuestionProjector';
import { ElasticsearchSyncService } from '../../../../infrastructure/elasticsearch/ElasticsearchSyncService';
import { ContentType } from '../../../../types/content/RelationType';
import { QuestionSearchDoc } from '../../../../infrastructure/search/SearchDocument';
import { TOKENS } from '../../../../services/TOKENS';

describe('QuestionManager.searchQuestions()', () => {
  let questionManager: QuestionManager;
  let fakeQuestionRepository: FakeQuestionRepository;
  let fakeAnswerRepository: FakeAnswerRepository;
  let fakeCacheProvider: FakeCacheProvider;
  let fakeLogger: FakeLoggerProvider;
  let fakeElasticsearchClient: FakeElasticsearchClient;
  let fakeSynonymService: FakeSynonymService;
  let fakeSemanticService: FakeSemanticSearchService;
  let searchService: ElasticsearchIndexService;
  let fakeConfigService: IConfigurationService;
  let fakeIngestPipeline: ElasticsearchIngestPipeline;
  let indexClient: ElasticsearchSyncService;
  let questionProjector: QuestionProjector;

  beforeEach(() => {
    fakeQuestionRepository = new FakeQuestionRepository();
    fakeAnswerRepository = new FakeAnswerRepository();
    fakeCacheProvider = new FakeCacheProvider();
    fakeLogger = new FakeLoggerProvider();
    fakeElasticsearchClient = new FakeElasticsearchClient();
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

    searchService = new ElasticsearchIndexService(
      fakeElasticsearchClient,
      fakeLogger,
      fakeConfigService,
      fakeSynonymService,
      fakeSemanticService,
      fakeIngestPipeline
    );

    questionProjector = new QuestionProjector();
    indexClient = new ElasticsearchSyncService(
      searchService,
      fakeConfigService,
      fakeLogger,
      fakeIngestPipeline,
      fakeSemanticService
    );

    questionManager = new QuestionManager(
      fakeQuestionRepository,
      fakeAnswerRepository,
      {} as any, // IContentRelationRepository
      fakeCacheProvider,
      indexClient,
      searchService,
      questionProjector,
      {} as any, // IContentAssetService
      fakeLogger
    );

    // Setup index
    fakeElasticsearchClient.setIndexExists('questions', true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should call searchClient.search() with correct parameters', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      await questionManager.searchQuestions('test', 1, 10);

      expect(searchSpy).toHaveBeenCalledWith(
        'questions',
        ['title', 'content', 'tags'],
        'test',
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });

    it('should return empty result for empty search term', async () => {
      const result = await questionManager.searchQuestions('', 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should return empty result for whitespace-only search term', async () => {
      const result = await questionManager.searchQuestions('   ', 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Search Options', () => {
    beforeEach(() => {
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });
    });

    it('should pass searchMode to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions('test', 1, 10, 'phrase');
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ searchMode: 'phrase' })
      );
    });

    it('should pass matchType to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions('test', 1, 10, 'any_word', 'exact');
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ matchType: 'exact' })
      );
    });

    it('should pass typoTolerance to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'high'
      );
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ typoTolerance: 'high' })
      );
    });

    it('should pass smartSearch flag to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        true
      );
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ smartSearch: true })
      );
    });

    it('should pass smartOptions to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      const smartOptions = { linguistic: true, semantic: false };
      await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        true,
        smartOptions
      );
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ smartOptions })
      );
    });

    it('should pass excludeQuestionIds to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        false,
        undefined,
        ['1', '2']
      );
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ excludeIds: ['1', '2'] })
      );
    });

    it('should pass language to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        false,
        undefined,
        [],
        'en'
      );
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ language: 'en' })
      );
    });
  });

  describe('Result Transformation', () => {
    it('should transform SearchDocument to IQuestionModel correctly', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        category: 'tech',
        tags: ['test', 'question'],
        views: 10,
        createdAt: new Date('2024-01-01'),
        user: 'user1',
        userInfo: {
          _id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        likes: ['user2'],
        dislikes: [],
        answers: ['answer1'],
        relatedContents: [],
        ancestorsIds: [],
        ancestorsTypes: [],
      };

      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('test', 1, 10);

      expect(result.data).toHaveLength(1);
      const question = result.data[0];
      expect(question._id).toBe('1');
      expect(question.title).toBe('Test Question');
      expect(question.content).toBe('Test content');
      expect(question.slug).toBe('test-question');
      expect(question.category).toBe('tech');
      expect(question.tags).toEqual(['test', 'question']);
      expect(question.contentType).toBe(ContentType.QUESTION);
      expect(question.user).toBe('user1');
      expect(question.userInfo).toEqual(searchDoc.userInfo);
      expect(question.likes).toEqual(['user2']);
      expect(question.dislikes).toEqual([]);
      expect(question.answers).toEqual(['answer1']);
    });

    it('should handle parent reference transformation', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Child Question',
        content: 'Content',
        slug: 'child-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
        parent: {
          id: 'parent1',
          type: ContentType.QUESTION,
        },
        ancestorsIds: ['parent1'],
        ancestorsTypes: [ContentType.QUESTION],
      };

      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('child', 1, 10);
      expect(result.data[0].parent).toEqual({
        id: 'parent1',
        type: ContentType.QUESTION,
      });
    });

    it('should handle ancestors transformation', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Nested Question',
        content: 'Content',
        slug: 'nested-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
        ancestorsIds: ['ancestor1', 'ancestor2'],
        ancestorsTypes: [ContentType.QUESTION, ContentType.ANSWER],
      };

      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('nested', 1, 10);
      expect(result.data[0].ancestors).toHaveLength(2);
      expect(result.data[0].ancestors![0]).toEqual({
        id: 'ancestor1',
        type: ContentType.QUESTION,
        depth: 0,
      });
      expect(result.data[0].ancestors![1]).toEqual({
        id: 'ancestor2',
        type: ContentType.ANSWER,
        depth: 1,
      });
    });
  });

  describe('Pagination Mapping', () => {
    beforeEach(() => {
      // Add multiple documents
      for (let i = 1; i <= 25; i++) {
        fakeElasticsearchClient.addDocument('questions', String(i), {
          _id: String(i),
          title: `Question ${i}`,
          content: `Content ${i}`,
          slug: `question-${i}`,
          user: 'user1',
          createdAt: new Date(),
          likes: [],
          dislikes: [],
          answers: [],
        });
      }
    });

    it('should map pagination correctly', async () => {
      const result = await questionManager.searchQuestions('question', 1, 10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBeGreaterThan(0);
      expect(result.pagination.totalPages).toBeGreaterThan(0);
      expect(result.pagination.hasNext).toBeDefined();
      expect(result.pagination.hasPrev).toBeDefined();
    });

    it('should calculate hasNext correctly', async () => {
      const result = await questionManager.searchQuestions('question', 1, 10);
      const expectedHasNext =
        result.pagination.page < result.pagination.totalPages;
      expect(result.pagination.hasNext).toBe(expectedHasNext);
    });

    it('should calculate hasPrev correctly', async () => {
      const result = await questionManager.searchQuestions('question', 2, 10);
      const expectedHasPrev = result.pagination.page > 1;
      expect(result.pagination.hasPrev).toBe(expectedHasPrev);
    });
  });

  describe('Warning Handling', () => {
    it('should log warning when semantic search is unavailable', async () => {
      fakeSemanticService.setModelDeployed(false);
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test',
        content: 'Content',
        slug: 'test',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      const result = await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        true,
        {
          linguistic: false,
          semantic: true,
        }
      );

      expect(fakeLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Semantic search was requested but ELSER model is not deployed'
        ),
        expect.any(Object)
      );
    });

    it('should return warnings in result when semantic search unavailable', async () => {
      fakeSemanticService.setModelDeployed(false);
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test',
        content: 'Content',
        slug: 'test',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      const result = await questionManager.searchQuestions(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        true,
        {
          linguistic: false,
          semantic: true,
        }
      );

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.semanticSearchUnavailable).toBe(true);
    });
  });

  describe('Exclude IDs Handling', () => {
    beforeEach(() => {
      for (let i = 1; i <= 5; i++) {
        fakeElasticsearchClient.addDocument('questions', String(i), {
          _id: String(i),
          title: `Question ${i}`,
          content: `Content ${i}`,
          slug: `question-${i}`,
          user: 'user1',
          createdAt: new Date(),
          likes: [],
          dislikes: [],
          answers: [],
        });
      }
    });

    it('should exclude specified question IDs from results', async () => {
      const result = await questionManager.searchQuestions(
        'question',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        false,
        undefined,
        ['1', '2']
      );
      const resultIds = result.data.map(q => q._id.toString());
      expect(resultIds).not.toContain('1');
      expect(resultIds).not.toContain('2');
    });
  });

  describe('Fallback to MongoDB', () => {
    it('should fallback to MongoDB when search fails', async () => {
      jest
        .spyOn(searchService, 'search')
        .mockRejectedValueOnce(new Error('Search failed'));
      jest
        .spyOn(fakeQuestionRepository, 'searchByTitle')
        .mockResolvedValueOnce([
          {
            _id: '1',
            title: 'Test Question',
            content: 'Content',
            slug: 'test-question',
            contentType: ContentType.QUESTION,
            user: 'user1',
            createdAt: new Date(),
            likes: [],
            dislikes: [],
            answers: [],
          } as any,
        ]);

      const result = await questionManager.searchQuestions('test', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(fakeLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Search failed, falling back to MongoDB'),
        expect.any(Object)
      );
    });

    it('should handle MongoDB fallback pagination correctly', async () => {
      jest
        .spyOn(searchService, 'search')
        .mockRejectedValueOnce(new Error('Search failed'));
      const mockQuestions = Array.from({ length: 25 }, (_, i) => ({
        _id: String(i + 1),
        title: `Question ${i + 1}`,
        content: `Content ${i + 1}`,
        slug: `question-${i + 1}`,
        contentType: ContentType.QUESTION,
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      }));
      jest
        .spyOn(fakeQuestionRepository, 'searchByTitle')
        .mockResolvedValueOnce(mockQuestions as any);

      const result = await questionManager.searchQuestions('question', 2, 10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.data.length).toBe(10);
    });
  });

  describe('Additional Edge Cases', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists('questions', true);
    });

    it('should handle questions without userInfo', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      };
      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('test', 1, 10);
      expect(result.data[0].userInfo).toBeUndefined();
    });

    it('should handle questions without relatedContents', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      };
      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('test', 1, 10);
      expect(result.data[0].relatedContents).toEqual([]);
    });

    it('should handle questions with empty tags array', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        tags: [],
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      };
      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('test', 1, 10);
      expect(result.data[0].tags).toEqual([]);
    });

    it('should handle questions with undefined category', async () => {
      const searchDoc: QuestionSearchDoc = {
        _id: '1',
        title: 'Test Question',
        content: 'Test content',
        slug: 'test-question',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      };
      fakeElasticsearchClient.addDocument('questions', '1', searchDoc);

      const result = await questionManager.searchQuestions('test', 1, 10);
      expect(result.data[0].category).toBeUndefined();
    });

    it('should handle default pagination values', async () => {
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test',
        content: 'Content',
        slug: 'test',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      const result = await questionManager.searchQuestions('test');
      expect(result.pagination.page).toBeGreaterThan(0);
      expect(result.pagination.limit).toBeGreaterThan(0);
    });

    it('should handle default search mode', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test',
        content: 'Content',
        slug: 'test',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      await questionManager.searchQuestions('test', 1, 10);
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          searchMode: 'any_word',
        })
      );
    });

    it('should handle default match type', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      fakeElasticsearchClient.addDocument('questions', '1', {
        _id: '1',
        title: 'Test',
        content: 'Content',
        slug: 'test',
        user: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        answers: [],
      });

      await questionManager.searchQuestions('test', 1, 10);
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          matchType: 'fuzzy',
        })
      );
    });
  });
});
