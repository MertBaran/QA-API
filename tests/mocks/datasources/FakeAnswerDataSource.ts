import { IDataSource } from '../../../repositories/interfaces/IDataSource';
import { IAnswerModel } from '../../../models/interfaces/IAnswerModel';
import { EntityId } from '../../../types/database';

export class FakeAnswerDataSource implements IDataSource<IAnswerModel> {
  private answers: IAnswerModel[] = [];

  create = jest
    .fn()
    .mockImplementation(
      async (data: Partial<IAnswerModel>): Promise<IAnswerModel> => {
        const answer: IAnswerModel = {
          _id: `a_${Date.now()}_${Math.random()}`,
          content: data.content || 'Test answer content',
          question: data.question || 'question1',
          user: data.user || 'user1',
          likes: data.likes || [],
          createdAt: data.createdAt || new Date(),
        };
        this.answers.push(answer);
        return answer;
      }
    );

  findById = jest
    .fn()
    .mockImplementation(async (id: string): Promise<IAnswerModel | null> => {
      return this.answers.find(a => a._id === id) || null;
    });

  findAll = jest.fn().mockImplementation(async (): Promise<IAnswerModel[]> => {
    return [...this.answers];
  });

  updateById = jest
    .fn()
    .mockImplementation(
      async (
        id: string,
        data: Partial<IAnswerModel>
      ): Promise<IAnswerModel | null> => {
        const index = this.answers.findIndex(a => a._id === id);
        if (index === -1) return null;

        const answer = this.answers[index];
        if (!answer) return null;

        this.answers[index] = { ...answer, ...data };
        return this.answers[index];
      }
    );

  deleteById = jest
    .fn()
    .mockImplementation(async (id: string): Promise<IAnswerModel | null> => {
      const index = this.answers.findIndex(a => a._id === id);
      if (index === -1) return null;

      const deletedAnswer = this.answers[index];
      if (!deletedAnswer) return null;

      this.answers.splice(index, 1);
      return deletedAnswer;
    });

  findByField = jest
    .fn()
    .mockImplementation(
      async (
        field: keyof IAnswerModel,
        value: any
      ): Promise<IAnswerModel[]> => {
        return this.answers.filter(a => a[field] === value);
      }
    );

  findByFields = jest
    .fn()
    .mockImplementation(
      async (fields: Partial<IAnswerModel>): Promise<IAnswerModel[]> => {
        return this.answers.filter(a => {
          return Object.entries(fields).every(
            ([key, value]) => a[key as keyof IAnswerModel] === value
          );
        });
      }
    );

  countAll = jest.fn().mockImplementation(async (): Promise<number> => {
    return this.answers.length;
  });

  deleteAll = jest.fn().mockImplementation(async (): Promise<number> => {
    const count = this.answers.length;
    this.answers = [];
    return count;
  });

  findByQuestion = jest
    .fn()
    .mockImplementation(
      async (questionId: EntityId): Promise<IAnswerModel[]> => {
        return this.answers.filter(a => a.question === questionId);
      }
    );

  findByUser = jest
    .fn()
    .mockImplementation(async (userId: EntityId): Promise<IAnswerModel[]> => {
      return this.answers.filter(a => a.user === userId);
    });

  findByQuestionAndUser = jest
    .fn()
    .mockImplementation(
      async (
        questionId: EntityId,
        userId: EntityId
      ): Promise<IAnswerModel | null> => {
        return (
          this.answers.find(
            a => a.question === questionId && a.user === userId
          ) || null
        );
      }
    );

  clear = jest.fn().mockImplementation((): void => {
    this.answers = [];
  });
}
