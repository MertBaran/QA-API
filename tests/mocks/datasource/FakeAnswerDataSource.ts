import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IAnswerModel } from '../../../models/interfaces/IAnswerModel';
import { EntityId } from '../../../types/database';

export class FakeAnswerDataSource implements IDataSource<IAnswerModel> {
  private store: Map<string, IAnswerModel> = new Map();

  async create(data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    const _id = (data._id ||
      Math.random().toString(36).substr(2, 9)) as EntityId;
    const answer: IAnswerModel = {
      _id,
      content: data.content || '',
      user: data.user as EntityId,
      question: data.question as EntityId,
      likes: data.likes || [],
      createdAt: data.createdAt || new Date(),
      ...data,
    };
    this.store.set(_id, answer);
    return answer;
  }

  async findById(id: string): Promise<IAnswerModel | null> {
    return this.store.get(id) || null;
  }

  async findAll(): Promise<IAnswerModel[]> {
    return Array.from(this.store.values());
  }

  async updateById(
    id: string,
    data: Partial<IAnswerModel>
  ): Promise<IAnswerModel | null> {
    const answer = this.store.get(id);
    if (!answer) return null;
    const updated = { ...answer, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async deleteById(id: string): Promise<IAnswerModel | null> {
    const answer = this.store.get(id);
    if (!answer) return null;
    this.store.delete(id);
    return answer;
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
