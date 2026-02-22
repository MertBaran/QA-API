import 'reflect-metadata';
import { AnswerManager } from '../../../../services/managers/AnswerManager';
import { FakeAnswerRepository } from '../../../mocks/repositories/FakeAnswerRepository';
import { FakeQuestionRepository } from '../../../mocks/repositories/FakeQuestionRepository';
import { FakeLoggerProvider } from '../../../mocks/logger/FakeLoggerProvider';
import { FakeElasticsearchClient } from '../../../mocks/elasticsearch/FakeElasticsearchClient';
import { FakeSynonymService } from '../../../mocks/search/FakeSynonymService';
import { FakeSemanticSearchService } from '../../../mocks/search/FakeSemanticSearchService';
import { ElasticsearchIndexService } from '../../../../infrastructure/elasticsearch/ElasticsearchIndexService';
import { IConfigurationService } from '../../../../services/contracts/IConfigurationService';
import { ElasticsearchIngestPipeline } from '../../../../infrastructure/elasticsearch/ElasticsearchIngestPipeline';
import { AnswerProjector } from '../../../../infrastructure/search/projectors/AnswerProjector';
import { QuestionProjector } from '../../../../infrastructure/search/projectors/QuestionProjector';
import { ElasticsearchSyncService } from '../../../../infrastructure/elasticsearch/ElasticsearchSyncService';
import { ContentType } from '../../../../types/content/RelationType';
import { AnswerSearchDoc } from '../../../../infrastructure/search/SearchDocument';
import { TOKENS } from '../../../../services/TOKENS';

describe('AnswerManager.searchAnswers()', () => {
  let answerManager: AnswerManager;
  let fakeAnswerRepository: FakeAnswerRepository;
  let fakeQuestionRepository: FakeQuestionRepository;
  let fakeLogger: FakeLoggerProvider;
  let fakeElasticsearchClient: FakeElasticsearchClient;
  let fakeSynonymService: FakeSynonymService;
  let fakeSemanticService: FakeSemanticSearchService;
  let searchService: ElasticsearchIndexService;
  let fakeConfigService: IConfigurationService;
  let fakeIngestPipeline: ElasticsearchIngestPipeline;
  let indexClient: ElasticsearchSyncService;
  let answerProjector: AnswerProjector;
  let questionProjector: QuestionProjector;

  beforeEach(() => {
    fakeAnswerRepository = new FakeAnswerRepository();
    fakeQuestionRepository = new FakeQuestionRepository();
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

    answerProjector = new AnswerProjector();
    questionProjector = new QuestionProjector();
    indexClient = new ElasticsearchSyncService(
      searchService,
      fakeConfigService,
      fakeLogger,
      fakeIngestPipeline,
      fakeSemanticService
    );

    answerManager = new AnswerManager(
      fakeAnswerRepository,
      fakeQuestionRepository,
      indexClient,
      searchService,
      answerProjector,
      questionProjector,
      fakeLogger
    );

    // Setup index
    fakeElasticsearchClient.setIndexExists('answers', true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should call searchClient.search() with correct parameters', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });

      await answerManager.searchAnswers('test', 1, 10);

      expect(searchSpy).toHaveBeenCalledWith(
        'answers',
        ['content'],
        'test',
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });

    it('should return empty result for empty search term', async () => {
      const result = await answerManager.searchAnswers('', 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should return empty result for whitespace-only search term', async () => {
      const result = await answerManager.searchAnswers('   ', 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Search Options', () => {
    beforeEach(() => {
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
    });

    it('should pass searchMode to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await answerManager.searchAnswers('test', 1, 10, 'phrase');
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ searchMode: 'phrase' })
      );
    });

    it('should pass matchType to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await answerManager.searchAnswers('test', 1, 10, 'any_word', 'exact');
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({ matchType: 'exact' })
      );
    });

    it('should pass typoTolerance to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await answerManager.searchAnswers(
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
      await answerManager.searchAnswers(
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
      await answerManager.searchAnswers(
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

    it('should pass language to searchClient', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      await answerManager.searchAnswers(
        'test',
        1,
        10,
        'any_word',
        'fuzzy',
        'medium',
        false,
        undefined,
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
    it('should transform SearchDocument to IAnswerModel correctly', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Test answer content',
        questionId: 'q1',
        userId: 'user1',
        userInfo: {
          _id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
        likes: ['user2'],
        dislikes: [],
        isAccepted: true,
        createdAt: new Date('2024-01-01'),
        ancestorsIds: [],
        ancestorsTypes: [],
      };

      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);

      // Mock question repository for enrichment
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([
        {
          _id: 'q1',
          title: 'Test Question',
          slug: 'test-question',
        } as any,
      ]);

      const result = await answerManager.searchAnswers('test', 1, 10);

      expect(result.data).toHaveLength(1);
      const answer = result.data[0];
      expect(answer._id).toBe('1');
      expect(answer.content).toBe('Test answer content');
      expect(answer.contentType).toBe(ContentType.ANSWER);
      expect(answer.user).toBe('user1');
      expect(answer.userInfo).toEqual(searchDoc.userInfo);
      expect(answer.question).toBe('q1');
      expect(answer.likes).toEqual(['user2']);
      expect(answer.dislikes).toEqual([]);
      expect(answer.isAccepted).toBe(true);
    });

    it('should handle parent reference transformation', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Answer content',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
        parent: {
          id: 'parent1',
          type: ContentType.ANSWER,
        },
        ancestorsIds: ['parent1'],
        ancestorsTypes: [ContentType.ANSWER],
      };

      // Use mock search client - ElasticsearchIndexService's complex query
      // may not match FakeElasticsearchClient's simple query structure
      const mockSearchClient = {
        search: jest.fn().mockResolvedValue({
          hits: [searchDoc],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
        registerIndex: jest.fn(),
        initializeRegisteredIndexes: jest.fn(),
      };
      const managerWithMockSearch = new AnswerManager(
        fakeAnswerRepository,
        fakeQuestionRepository,
        indexClient,
        mockSearchClient as any,
        answerProjector,
        questionProjector,
        fakeLogger
      );
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await managerWithMockSearch.searchAnswers('answer', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].parent).toEqual({
        id: 'parent1',
        type: ContentType.ANSWER,
      });
    });

    it('should handle ancestors transformation', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Nested Answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
        ancestorsIds: ['ancestor1', 'ancestor2'],
        ancestorsTypes: [ContentType.QUESTION, ContentType.ANSWER],
      };

      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('nested', 1, 10);
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

  describe('Question Info Enrichment', () => {
    it('should enrich answers with question info', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Answer content',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };

      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);

      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([
        {
          _id: 'q1',
          title: 'Test Question',
          slug: 'test-question',
        } as any,
      ]);

      const result = await answerManager.searchAnswers('answer', 1, 10);
      expect(result.data[0].questionInfo).toBeDefined();
      expect(result.data[0].questionInfo!._id).toBe('q1');
      expect(result.data[0].questionInfo!.title).toBe('Test Question');
      expect(result.data[0].questionInfo!.slug).toBe('test-question');
    });

    it('should handle missing question info gracefully', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Answer content',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };

      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('answer', 1, 10);
      expect(result.data[0].questionInfo).toBeUndefined();
    });
  });

  describe('Pagination Mapping', () => {
    beforeEach(() => {
      // Add multiple documents
      for (let i = 1; i <= 25; i++) {
        fakeElasticsearchClient.addDocument('answers', String(i), {
          _id: String(i),
          content: `Answer ${i}`,
          questionId: `q${i}`,
          userId: 'user1',
          createdAt: new Date(),
          likes: [],
          dislikes: [],
          isAccepted: false,
        });
      }
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValue([]);
    });

    it('should map pagination correctly', async () => {
      const result = await answerManager.searchAnswers('answer', 1, 10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBeGreaterThan(0);
      expect(result.pagination.totalPages).toBeGreaterThan(0);
      expect(result.pagination.hasNext).toBeDefined();
      expect(result.pagination.hasPrev).toBeDefined();
    });

    it('should calculate hasNext correctly', async () => {
      const result = await answerManager.searchAnswers('answer', 1, 10);
      const expectedHasNext =
        result.pagination.page < result.pagination.totalPages;
      expect(result.pagination.hasNext).toBe(expectedHasNext);
    });

    it('should calculate hasPrev correctly', async () => {
      const result = await answerManager.searchAnswers('answer', 2, 10);
      const expectedHasPrev = result.pagination.page > 1;
      expect(result.pagination.hasPrev).toBe(expectedHasPrev);
    });
  });

  describe('Warning Handling', () => {
    it('should log warning when semantic search is unavailable', async () => {
      fakeSemanticService.setModelDeployed(false);
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValue([]);

      const result = await answerManager.searchAnswers(
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
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValue([]);

      const result = await answerManager.searchAnswers(
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

  describe('Fallback to MongoDB', () => {
    it('should fallback to empty array when search fails', async () => {
      jest
        .spyOn(searchService, 'search')
        .mockRejectedValueOnce(new Error('Search failed'));

      const result = await answerManager.searchAnswers('test', 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(fakeLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Search failed for answers, falling back to MongoDB'
        ),
        expect.any(Object)
      );
    });

    it('should handle fallback pagination correctly', async () => {
      jest
        .spyOn(searchService, 'search')
        .mockRejectedValueOnce(new Error('Search failed'));

      const result = await answerManager.searchAnswers('test', 2, 10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  describe('Additional Edge Cases', () => {
    beforeEach(() => {
      fakeElasticsearchClient.setIndexExists('answers', true);
    });

    it('should handle answers without userInfo', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('test', 1, 10);
      expect(result.data[0].userInfo).toBeUndefined();
    });

    it('should handle answers without parent', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('test', 1, 10);
      expect(result.data[0].parent).toBeUndefined();
    });

    it('should handle answers without ancestors', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('test', 1, 10);
      expect(result.data[0].ancestors).toBeUndefined();
    });

    it('should handle default pagination values', async () => {
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('test');
      expect(result.pagination.page).toBeGreaterThan(0);
      expect(result.pagination.limit).toBeGreaterThan(0);
    });

    it('should handle default search mode', async () => {
      const searchSpy = jest.spyOn(searchService, 'search');
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      await answerManager.searchAnswers('test', 1, 10);
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
      fakeElasticsearchClient.addDocument('answers', '1', {
        _id: '1',
        content: 'Test answer',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      });
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      await answerManager.searchAnswers('test', 1, 10);
      expect(searchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          matchType: 'fuzzy',
        })
      );
    });

    it('should handle question enrichment when question not found', async () => {
      const searchDoc: AnswerSearchDoc = {
        _id: '1',
        content: 'Answer content',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      fakeElasticsearchClient.addDocument('answers', '1', searchDoc);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([]);

      const result = await answerManager.searchAnswers('answer', 1, 10);
      expect(result.data[0].questionInfo).toBeUndefined();
    });

    it('should handle multiple answers with same question', async () => {
      const searchDoc1: AnswerSearchDoc = {
        _id: '1',
        content: 'Answer 1',
        questionId: 'q1',
        userId: 'user1',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      const searchDoc2: AnswerSearchDoc = {
        _id: '2',
        content: 'Answer 2',
        questionId: 'q1',
        userId: 'user2',
        createdAt: new Date(),
        likes: [],
        dislikes: [],
        isAccepted: false,
      };
      fakeElasticsearchClient.addDocument('answers', '1', searchDoc1);
      fakeElasticsearchClient.addDocument('answers', '2', searchDoc2);
      jest.spyOn(fakeQuestionRepository, 'findByIds').mockResolvedValueOnce([
        {
          _id: 'q1',
          title: 'Test Question',
          slug: 'test-question',
        } as any,
      ]);

      const result = await answerManager.searchAnswers('answer', 1, 10);
      expect(result.data.length).toBeGreaterThan(0);
      // Both answers should have questionInfo
      result.data.forEach(answer => {
        expect(answer.questionInfo).toBeDefined();
        expect(answer.questionInfo!._id).toBe('q1');
      });
    });
  });
});
