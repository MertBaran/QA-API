import { IQuestionModel } from "../../models/interfaces/IQuestionModel";
import { EntityId } from "../../types/database";

export interface IQuestionService {
  createQuestion(questionData: any, userId: EntityId): Promise<IQuestionModel>;
  getAllQuestions(): Promise<IQuestionModel[]>;
  getQuestionById(questionId: EntityId): Promise<IQuestionModel>;
  updateQuestion(questionId: EntityId, updateData: { title?: string; content?: string }): Promise<IQuestionModel>;
  deleteQuestion(questionId: EntityId): Promise<IQuestionModel>;
  likeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel>;
  undoLikeQuestion(questionId: EntityId, userId: EntityId): Promise<IQuestionModel>;
  getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]>;
  searchQuestions(searchTerm: string): Promise<IQuestionModel[]>;
} 