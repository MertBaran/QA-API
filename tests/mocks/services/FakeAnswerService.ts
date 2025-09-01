import { IAnswerService } from '../../../services/contracts/IAnswerService';
import { IAnswerModel } from '../../../models/interfaces/IAnswerModel';
import { EntityId } from '../../../types/database';

export class FakeAnswerService implements IAnswerService {
  private answers: IAnswerModel[] = [];

  addAnswer = jest.fn((answer: IAnswerModel): void => {
    this.answers.push(answer);
  });

  createAnswer = jest
    .fn()
    .mockImplementation(
      async (
        answerData: any,
        questionId: EntityId,
        userId: EntityId
      ): Promise<IAnswerModel> => {
        const answer: IAnswerModel = {
          _id: `answer_${Date.now()}`,
          content: answerData.content,
          user: userId,
          question: questionId,
          likes: [],
          createdAt: new Date(),
        } as IAnswerModel;

        this.answers.push(answer);
        return answer;
      }
    );

  getAnswerById = jest
    .fn()
    .mockImplementation(async (answerId: EntityId): Promise<IAnswerModel> => {
      const answer: IAnswerModel = {
        _id: answerId,
        content: 'Test answer content',
        user: 'user_1',
        question: 'question_1',
        likes: [],
        createdAt: new Date(),
      } as IAnswerModel;

      return answer;
    });

  updateAnswer = jest
    .fn()
    .mockImplementation(
      async (answerId: EntityId, content: string): Promise<IAnswerModel> => {
        return this.getAnswerById(answerId);
      }
    );

  deleteAnswer = jest
    .fn()
    .mockImplementation(
      async (answerId: EntityId, questionId: string): Promise<void> => {
        // Test ortamında hiçbir şey yapma
      }
    );

  likeAnswer = jest
    .fn()
    .mockImplementation(
      async (answerId: EntityId, userId: EntityId): Promise<IAnswerModel> => {
        return this.getAnswerById(answerId);
      }
    );

  undoLikeAnswer = jest
    .fn()
    .mockImplementation(
      async (answerId: EntityId, userId: EntityId): Promise<IAnswerModel> => {
        return this.getAnswerById(answerId);
      }
    );

  getAnswersByQuestion = jest
    .fn()
    .mockImplementation(
      async (questionId: EntityId): Promise<IAnswerModel[]> => {
        return this.answers.filter(answer => answer.question === questionId);
      }
    );

  async getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]> {
    return [await this.getAnswerById('answer_1')];
  }

  async getAnswersWithPopulatedData(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return [await this.getAnswerById('answer_1')];
  }
}
