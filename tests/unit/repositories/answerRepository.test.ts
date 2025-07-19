import 'reflect-metadata';
import { AnswerRepository } from '../../../repositories/AnswerRepository';
import { FakeAnswerDataSource } from '../../mocks/datasource/FakeAnswerDataSource';

describe('AnswerRepository Unit Tests', () => {
  let answerRepository: AnswerRepository;
  let fakeAnswerDataSource: FakeAnswerDataSource;

  beforeEach(() => {
    fakeAnswerDataSource = new FakeAnswerDataSource();
    answerRepository = new AnswerRepository(fakeAnswerDataSource);
  });

  it('should create and find answer by id', async () => {
    const answer = await answerRepository.create({ content: 'RepoA', user: 'user1', question: 'q1', likes: [], createdAt: new Date() });
    const found = await answerRepository.findById(answer._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(answer._id);
  });

  it('should update answer', async () => {
    const answer = await answerRepository.create({ content: 'RepoA2', user: 'user2', question: 'q2', likes: [], createdAt: new Date() });
    const updated = await answerRepository.updateById(answer._id, { content: 'UpdatedRepoA2' });
    expect(updated).toBeDefined();
    expect(updated?.content).toBe('UpdatedRepoA2');
  });

  it('should delete answer', async () => {
    const answer = await answerRepository.create({ content: 'RepoA3', user: 'user3', question: 'q3', likes: [], createdAt: new Date() });
    const deleted = await answerRepository.deleteById(answer._id);
    expect(deleted).toBeDefined();
    const found = await answerRepository.findById(answer._id);
    expect(found).toBeNull();
  });
}); 