import 'reflect-metadata';
import { QuestionRepository } from '../../../repositories/QuestionRepository';
import { FakeQuestionDataSource } from '../../mocks/datasource/FakeQuestionDataSource';

describe('QuestionRepository Unit Tests', () => {
  let questionRepository: QuestionRepository;
  let fakeQuestionDataSource: FakeQuestionDataSource;

  beforeEach(() => {
    fakeQuestionDataSource = new FakeQuestionDataSource();
    questionRepository = new QuestionRepository(fakeQuestionDataSource);
  });

  it('should create and find question by id', async () => {
    const question = await questionRepository.create({ title: 'RepoQ', content: 'QContent', slug: 'repoq', user: 'user1', likes: [], answers: [], createdAt: new Date() });
    const found = await questionRepository.findById(question._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(question._id);
  });

  it('should update question', async () => {
    const question = await questionRepository.create({ title: 'RepoQ2', content: 'QContent2', slug: 'repoq2', user: 'user2', likes: [], answers: [], createdAt: new Date() });
    const updated = await questionRepository.updateById(question._id, { title: 'UpdatedRepoQ2' });
    expect(updated).toBeDefined();
    expect(updated?.title).toBe('UpdatedRepoQ2');
  });

  it('should delete question', async () => {
    const question = await questionRepository.create({ title: 'RepoQ3', content: 'QContent3', slug: 'repoq3', user: 'user3', likes: [], answers: [], createdAt: new Date() });
    const deleted = await questionRepository.deleteById(question._id);
    expect(deleted).toBeDefined();
    const found = await questionRepository.findById(question._id);
    expect(found).toBeNull();
  });
}); 