import { IAnswerRepository } from '../../../repositories/interfaces/IAnswerRepository';
import { IAnswerModel } from '../../../models/interfaces/IAnswerModel';
import { EntityId } from '../../../types/database';

export class FakeAnswerRepository implements IAnswerRepository {
  private answers: IAnswerModel[] = [];

  async findById(id: EntityId): Promise<IAnswerModel | null> {
    return this.answers.find(a => a._id === id) || null;
  }

  async findByIds(ids: EntityId[]): Promise<IAnswerModel[]> {
    if (ids.length === 0) return [];
    return this.answers.filter(a => ids.includes(a._id));
  }

  async findByIdWithPopulate(id: EntityId): Promise<IAnswerModel | null> {
    return this.answers.find(a => a._id === id) || null;
  }

  async findByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    return this.answers.filter(a => a.question === questionId);
  }

  async findByUser(userId: EntityId): Promise<IAnswerModel[]> {
    return this.answers.filter(a => a.user === userId);
  }

  async create(data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    const answer: IAnswerModel = {
      _id: `answer_${Date.now()}`,
      content: data.content || 'Test answer content',
      createdAt: new Date(),
      user: data.user || 'user_1',
      question: data.question || 'question_1',
      likes: data.likes || [],
      ...data,
    } as IAnswerModel;

    this.answers.push(answer);
    return answer;
  }

  async updateById(
    id: EntityId,
    data: Partial<IAnswerModel>
  ): Promise<IAnswerModel | null> {
    const index = this.answers.findIndex(a => a._id === id);
    if (index === -1) return null;

    this.answers[index] = { ...this.answers[index], ...data } as IAnswerModel;
    return this.answers[index];
  }

  async deleteById(id: EntityId): Promise<IAnswerModel | null> {
    const index = this.answers.findIndex(a => a._id === id);
    if (index === -1) return null;

    const deletedAnswer = this.answers[index]!;
    this.answers.splice(index, 1);
    return deletedAnswer;
  }

  async findAll(): Promise<IAnswerModel[]> {
    return [...this.answers];
  }

  async findAnswersWithPopulatedData(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return this.answers.filter(a => a.question === questionId);
  }

  async countAll(): Promise<number> {
    return this.answers.length;
  }

  async findByField(
    field: keyof IAnswerModel,
    value: any
  ): Promise<IAnswerModel[]> {
    return this.answers.filter(a => a[field] === value);
  }

  async findByFields(fields: Partial<IAnswerModel>): Promise<IAnswerModel[]> {
    return this.answers.filter(answer =>
      Object.entries(fields).every(
        ([key, value]) => answer[key as keyof IAnswerModel] === value
      )
    );
  }

  async likeAnswer(
    answerId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel | null> {
    const answer = this.answers.find(a => a._id === answerId);
    if (!answer) return null;

    if (!answer.likes.includes(userId)) {
      answer.likes.push(userId);
    }
    return answer;
  }

  async unlikeAnswer(
    answerId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel | null> {
    const answer = this.answers.find(a => a._id === answerId);
    if (!answer) return null;

    answer.likes = answer.likes.filter(id => id !== userId);
    return answer;
  }

  async findAnswersByQuestionWithPopulate(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return this.answers.filter(a => a.question === questionId);
  }

  async findByQuestionAndId(
    questionId: EntityId,
    answerId: EntityId
  ): Promise<IAnswerModel | null> {
    return (
      this.answers.find(a => a.question === questionId && a._id === answerId) ||
      null
    );
  }
}
