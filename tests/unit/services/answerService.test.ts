import 'reflect-metadata';
import { AnswerManager } from '../../../services/managers/AnswerManager';
import { AnswerRepository } from '../../../repositories/AnswerRepository';
import { FakeAnswerDataSource } from '../../mocks/datasources/FakeAnswerDataSource';
import { QuestionRepository } from '../../../repositories/QuestionRepository';
import { FakeQuestionDataSource } from '../../mocks/datasources/FakeQuestionDataSource';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { AnswerProjector } from '../../../infrastructure/search/projectors/AnswerProjector';
import { QuestionProjector } from '../../../infrastructure/search/projectors/QuestionProjector';

const createMockIndexClient = () => ({
  sync: jest.fn().mockResolvedValue(undefined),
});
const createMockSearchClient = () => ({
  search: jest.fn().mockResolvedValue({ hits: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
});

describe('AnswerService Unit Tests', () => {
  let answerService: AnswerManager;
  let answerRepository: AnswerRepository;
  let fakeAnswerDataSource: FakeAnswerDataSource;
  let questionRepository: QuestionRepository;
  let fakeQuestionDataSource: FakeQuestionDataSource;

  beforeEach(() => {
    fakeAnswerDataSource = new FakeAnswerDataSource();
    answerRepository = new AnswerRepository(fakeAnswerDataSource);
    fakeQuestionDataSource = new FakeQuestionDataSource();
    questionRepository = new QuestionRepository(fakeQuestionDataSource);
    answerService = new AnswerManager(
      answerRepository,
      questionRepository,
      createMockIndexClient() as any,
      createMockSearchClient() as any,
      new AnswerProjector(),
      new QuestionProjector(),
      new FakeLoggerProvider()
    );
  });

  it('should create an answer', async () => {
    const question = await questionRepository.create({
      title: 'Q1',
      content: 'C1',
      slug: 'q1',
      user: 'user1',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });
    const answer = await answerService.createAnswer(
      { content: 'Answer1', likes: [], dislikes: [] },
      question._id,
      'user1'
    );
    expect(answer).toBeDefined();
    expect(answer.content).toBe('Answer1');
    expect(answer.user).toBe('user1');
    expect(String(answer.question)).toBe(String(question._id));
  });

  it('should get answer by id', async () => {
    const question = await questionRepository.create({
      title: 'Q2',
      content: 'C2',
      slug: 'q2',
      user: 'user2',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });
    const answer = await answerService.createAnswer(
      { content: 'Answer2', likes: [], dislikes: [] },
      question._id,
      'user2'
    );
    const found = await answerService.getAnswerById(answer._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(answer._id);
  });

  it('should update an answer', async () => {
    const question = await questionRepository.create({
      title: 'Q3',
      content: 'C3',
      slug: 'q3',
      user: 'user3',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });
    const answer = await answerService.createAnswer(
      { content: 'Answer3', likes: [], dislikes: [] },
      question._id,
      'user3'
    );
    const updated = await answerService.updateAnswer(
      answer._id,
      'Updated Answer3'
    );
    expect(updated).toBeDefined();
    expect(updated?.content).toBe('Updated Answer3');
  });

  it('should delete an answer', async () => {
    const question = await questionRepository.create({
      title: 'Q4',
      content: 'C4',
      slug: 'q4',
      user: 'user4',
      likes: [],
      answers: [],
      createdAt: new Date(),
    });
    const answer = await answerService.createAnswer(
      { content: 'Answer4', likes: [], dislikes: [] },
      question._id,
      'user4'
    );
    await answerService.deleteAnswer(answer._id, String(question._id));
    await expect(answerService.getAnswerById(answer._id)).rejects.toThrow();
  });
});
