import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IQuestionModel } from '../../../models/interfaces/IQuestionModel';
import { EntityId } from '../../../types/database';

export class FakeQuestionDataSource implements IDataSource<IQuestionModel> {
  private store: Map<string, IQuestionModel> = new Map();

  async create(data: Partial<IQuestionModel>): Promise<IQuestionModel> {
    const _id = (data._id ||
      Math.random().toString(36).substr(2, 9)) as EntityId;
    const question: IQuestionModel = {
      _id,
      title: data.title || '',
      content: data.content || '',
      slug: data.slug || '',
      createdAt: data.createdAt || new Date(),
      user: data.user as EntityId,
      likes: data.likes || [],
      answers: data.answers || [],
      ...data,
    };
    this.store.set(_id, question);
    return question;
  }

  async findById(id: string): Promise<IQuestionModel | null> {
    return this.store.get(id) || null;
  }

  async findAll(): Promise<IQuestionModel[]> {
    return Array.from(this.store.values());
  }

  async updateById(
    id: string,
    data: Partial<IQuestionModel>
  ): Promise<IQuestionModel | null> {
    const question = this.store.get(id);
    if (!question) return null;
    const updated = { ...question, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async deleteById(id: string): Promise<IQuestionModel | null> {
    const question = this.store.get(id);
    if (!question) return null;
    this.store.delete(id);
    return question;
  }

  async findByField(field: keyof IQuestionModel, value: any): Promise<IQuestionModel[]> {
    const questions = Array.from(this.store.values());
    return questions.filter(question => question[field] === value);
  }

  async findByFields(fields: Partial<IQuestionModel>): Promise<IQuestionModel[]> {
    const questions = Array.from(this.store.values());
    return questions.filter(question => {
      return Object.entries(fields).every(([key, value]) => question[key as keyof IQuestionModel] === value);
    });
  }

  async countAll(): Promise<number> {
    return this.store.size;
  }

  async deleteAll(): Promise<number> {
    const count = this.store.size;
    this.store.clear();
    return count;
  }
}
