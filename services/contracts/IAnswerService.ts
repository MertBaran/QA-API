import { IAnswerModel } from "../../models/interfaces/IAnswerModel";
import { EntityId } from "../../types/database";

export interface IAnswerService {
  createAnswer(answerData: any, questionId: EntityId, userId: EntityId): Promise<IAnswerModel>;
  getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]>;
  getAnswerById(answerId: string): Promise<IAnswerModel>;
  updateAnswer(answerId: string, content: string): Promise<IAnswerModel>;
  deleteAnswer(answerId: string, questionId: string): Promise<void>;
  likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  undoLikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel>;
  getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]>;
  getAnswersWithPopulatedData(questionId: EntityId): Promise<IAnswerModel[]>;
} 