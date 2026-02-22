import 'reflect-metadata';
import { QuestionManager } from '../../../services/managers/QuestionManager';
import { QuestionRepository } from '../../../repositories/QuestionRepository';
import { FakeQuestionDataSource } from '../../mocks/datasources/FakeQuestionDataSource';
import { FakeAnswerDataSource } from '../../mocks/datasources/FakeAnswerDataSource';
import { AnswerRepository } from '../../../repositories/AnswerRepository';
import { FakeCacheProvider } from '../../mocks/cache/FakeCacheProvider';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { QuestionProjector } from '../../../infrastructure/search/projectors/QuestionProjector';
import { AnswerProjector } from '../../../infrastructure/search/projectors/AnswerProjector';

const createMockIndexClient = () => ({ sync: jest.fn().mockResolvedValue(undefined) });
const createMockSearchClient = () => ({
  search: jest.fn().mockResolvedValue({ hits: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
});

describe('QuestionService Unit Tests', () => {
  let questionService: QuestionManager;
  let questionRepository: QuestionRepository;
  let fakeQuestionDataSource: FakeQuestionDataSource;
  let fakeCacheProvider: FakeCacheProvider;

  beforeEach(() => {
    fakeQuestionDataSource = new FakeQuestionDataSource();
    questionRepository = new QuestionRepository(fakeQuestionDataSource);
    const fakeAnswerDataSource = new FakeAnswerDataSource();
    const answerRepository = new AnswerRepository(fakeAnswerDataSource);
    fakeCacheProvider = new FakeCacheProvider();
    questionService = new QuestionManager(
      questionRepository,
      answerRepository,
      {} as any, // IContentRelationRepository
      fakeCacheProvider,
      createMockIndexClient() as any,
      createMockSearchClient() as any,
      new QuestionProjector(),
      new AnswerProjector(),
      {} as any, // IContentAssetService
      new FakeLoggerProvider()
    );
  });

  it('should create a question', async () => {
    const question = await questionService.createQuestion(
      { title: 'Q1', content: 'Content1', slug: 'q1' },
      'user1'
    );
    expect(question).toBeDefined();
    expect(question.title).toBe('Q1');
    expect(question.user).toBe('user1');
  });

  it('should get all questions', async () => {
    await questionService.createQuestion(
      { title: 'Q2', content: 'Content2', slug: 'q2' },
      'user2'
    );
    await questionService.createQuestion(
      { title: 'Q3', content: 'Content3', slug: 'q3' },
      'user3'
    );
    const questions = await questionService.getAllQuestions();
    expect(questions.length).toBe(2);
    expect(questions.map((q: any) => q.title)).toContain('Q2');
    expect(questions.map((q: any) => q.title)).toContain('Q3');
  });

  it('should get question by id', async () => {
    const question = await questionService.createQuestion(
      { title: 'Q4', content: 'Content4', slug: 'q4' },
      'user4'
    );
    const found = await questionService.getQuestionById(question._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(question._id);
  });

  it('should update a question', async () => {
    const question = await questionService.createQuestion(
      { title: 'Q5', content: 'Content5', slug: 'q5' },
      'user5'
    );
    const updated = await questionService.updateQuestion(question._id, {
      title: 'Q5 Updated',
    });
    expect(updated).toBeDefined();
    expect(updated?.title).toBe('Q5 Updated');
  });

  it('should delete a question', async () => {
    const question = await questionService.createQuestion(
      { title: 'Q6', content: 'Content6', slug: 'q6' },
      'user6'
    );
    const deleted = await questionService.deleteQuestion(question._id);
    expect(deleted).toBeDefined();

    // After deletion, BaseRepository.findById throws "Resource not found"
    await expect(questionService.getQuestionById(question._id)).rejects.toThrow(
      'Resource not found'
    );
  });
});
