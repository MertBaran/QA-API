import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IQuestionModel } from '../../../models/interfaces/IQuestionModel';
import { EntityId } from '../../../types/database';

export class FakeQuestionDataSource implements IDataSource<IQuestionModel> {
  private questions: IQuestionModel[] = [];

  create = jest.fn().mockImplementation(async (data: Partial<IQuestionModel>): Promise<IQuestionModel> => {
    const question: IQuestionModel = {
      _id: `q_${Date.now()}_${Math.random()}`,
      title: data.title || 'Test Question',
      content: data.content || 'Test content',
      slug: data.slug || 'test-question',
      user: data.user || 'user1',
      tags: data.tags || ['test'],
      category: data.category || 'general',
      likes: data.likes || [],
      dislikes: (data as any).dislikes || [],
      answers: data.answers || [],
      views: data.views || 0,
      createdAt: data.createdAt || new Date(),
    };
    this.questions.push(question);
    return question;
  });

  findById = jest.fn().mockImplementation(async (id: string): Promise<IQuestionModel | null> => {
    return this.questions.find(q => q._id === id) || null;
  });

  findAll = jest.fn().mockImplementation(async (): Promise<IQuestionModel[]> => {
    return [...this.questions];
  });

  updateById = jest.fn().mockImplementation(async (id: string, data: Partial<IQuestionModel>): Promise<IQuestionModel | null> => {
    const index = this.questions.findIndex(q => q._id === id);
    if (index === -1) return null;

    const question = this.questions[index];
    if (!question) return null;

    this.questions[index] = { ...question, ...data };
    return this.questions[index];
  });

  deleteById = jest.fn().mockImplementation(async (id: string): Promise<IQuestionModel | null> => {
    const index = this.questions.findIndex(q => q._id === id);
    if (index === -1) return null;

    const deletedQuestion = this.questions[index];
    if (!deletedQuestion) return null;
    
    this.questions.splice(index, 1);
    return deletedQuestion;
  });

  findByField = jest.fn().mockImplementation(async (field: keyof IQuestionModel, value: any): Promise<IQuestionModel[]> => {
    return this.questions.filter(q => q[field] === value);
  });

  findByFields = jest.fn().mockImplementation(async (fields: Partial<IQuestionModel>): Promise<IQuestionModel[]> => {
    return this.questions.filter(q => {
      return Object.entries(fields).every(([key, value]) => q[key as keyof IQuestionModel] === value);
    });
  });

  countAll = jest.fn().mockImplementation(async (): Promise<number> => {
    return this.questions.length;
  });

  deleteAll = jest.fn().mockImplementation(async (): Promise<number> => {
    const count = this.questions.length;
    this.questions = [];
    return count;
  });

  findByUser = jest.fn().mockImplementation(async (userId: EntityId): Promise<IQuestionModel[]> => {
    return this.questions.filter(q => q.user === userId);
  });

  findByTags = jest.fn().mockImplementation(async (tags: string[]): Promise<IQuestionModel[]> => {
    return this.questions.filter(q => q.tags && tags.some(tag => q.tags!.includes(tag)));
  });

  findByCategory = jest.fn().mockImplementation(async (category: string): Promise<IQuestionModel[]> => {
    return this.questions.filter(q => q.category === category);
  });

  search = jest.fn().mockImplementation(async (query: string): Promise<IQuestionModel[]> => {
    const lowerQuery = query.toLowerCase();
    return this.questions.filter(q => 
      q.title.toLowerCase().includes(lowerQuery) || 
      q.content.toLowerCase().includes(lowerQuery)
    );
  });

  clear = jest.fn().mockImplementation((): void => {
    this.questions = [];
  });
}
