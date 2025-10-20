import 'reflect-metadata';
import { AnswerManager } from '../../../services/managers/AnswerManager';
import { AnswerRepository } from '../../../repositories/AnswerRepository';
import { FakeAnswerDataSource } from '../../mocks/datasources/FakeAnswerDataSource';
import { QuestionRepository } from '../../../repositories/QuestionRepository';
import { FakeQuestionDataSource } from '../../mocks/datasources/FakeQuestionDataSource';

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
    answerService = new AnswerManager(answerRepository, questionRepository);
  });

  it('should create an answer', async () => {
    const answer = await answerService.createAnswer(
      { content: 'Answer1' },
      'q1',
      'user1'
    );
    expect(answer).toBeDefined();
    expect(answer.content).toBe('Answer1');
    expect(answer.user).toBe('user1');
    expect(answer.question).toBe('q1');
  });

  it('should get answer by id', async () => {
    const answer = await answerService.createAnswer(
      { content: 'Answer2' },
      'q2',
      'user2'
    );
    const found = await answerService.getAnswerById(answer._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(answer._id);
  });

  it('should update an answer', async () => {
    const answer = await answerService.createAnswer(
      { content: 'Answer3' },
      'q3',
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
    const answer = await answerService.createAnswer(
      { content: 'Answer4' },
      'q4',
      'user4'
    );
    await answerService.deleteAnswer(answer._id, 'q4');
    await expect(answerService.getAnswerById(answer._id)).rejects.toThrow();
  });
});
