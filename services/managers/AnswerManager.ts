import { injectable, inject } from "tsyringe";
import { IAnswerModel } from "../../models/interfaces/IAnswerModel";
import CustomError from "../../helpers/error/CustomError";
import { IAnswerRepository } from "../../repositories/interfaces/IAnswerRepository";
import { EntityId } from "../../types/database";
import { IQuestionRepository } from "../../repositories/interfaces/IQuestionRepository";
import { IAnswerService } from "../contracts/IAnswerService";
import { AnswerServiceMessages } from "../constants/ServiceMessages";

@injectable()
export class AnswerManager implements IAnswerService {
  constructor(
    @inject("AnswerRepository") private answerRepository: IAnswerRepository,
    @inject("QuestionRepository") private questionRepository: IQuestionRepository
  ) {}

  async createAnswer(answerData: any, questionId: EntityId, userId: EntityId): Promise<IAnswerModel> {
    try {
      const answer = await this.answerRepository.create({
        ...answerData,
        question: questionId,
        user: userId,
      });
      return answer;
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.AnswerCreationDbError.en, 500);
    }
  }

  async getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    try {
      return await this.answerRepository.findByQuestion(questionId);
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.GetAnswersDbError.en, 500);
    }
  }

  async getAnswerById(answerId: string): Promise<IAnswerModel> {
    try {
      const answer = await this.answerRepository.findByIdWithPopulate(answerId);
      if (!answer) {
        throw new CustomError(AnswerServiceMessages.AnswerNotFound.en, 404);
      }
      return answer;
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.GetAnswerDbError.en, 500);
    }
  }

  async updateAnswer(answerId: string, content: string): Promise<IAnswerModel> {
    if (!content) {
      throw new CustomError(AnswerServiceMessages.ContentRequired.en, 400);
    }
    try {
      const answer = await this.answerRepository.updateById(answerId, { content });
      if (!answer) {
        throw new CustomError(AnswerServiceMessages.AnswerNotFound.en, 404);
      }
      return answer;
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.UpdateAnswerDbError.en, 500);
    }
  }

  async deleteAnswer(answerId: string, questionId: string): Promise<void> {
    try {
      await this.answerRepository.deleteById(answerId);
      const question = await this.questionRepository.findById(questionId);
      if (question) {
        question.answers = question.answers.filter((id: any) => id.toString() !== answerId.toString());
        await this.questionRepository.updateById(questionId, { answers: question.answers });
      }
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.DeleteAnswerDbError.en, 500);
    }
  }

  async likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
    try {
      const answer = await this.answerRepository.likeAnswer(answerId, userId);
      if (!answer) {
        const exists = await this.answerRepository.findById(answerId);
        if (!exists) throw new CustomError(AnswerServiceMessages.AnswerNotFound.en, 404);
        throw new CustomError(AnswerServiceMessages.AlreadyLiked.en, 400);
      }
      return answer;
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.LikeAnswerDbError.en, 500);
    }
  }

  async undoLikeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
    try {
      const answer = await this.answerRepository.unlikeAnswer(answerId, userId);
      if (!answer) {
        const exists = await this.answerRepository.findById(answerId);
        if (!exists) throw new CustomError(AnswerServiceMessages.AnswerNotFound.en, 404);
        throw new CustomError(AnswerServiceMessages.CannotUndoLike.en, 400);
      }
      return answer;
    } catch (err) {
      throw new CustomError(AnswerServiceMessages.UndoLikeDbError.en, 500);
    }
  }

  async getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]> {
    return await this.answerRepository.findByUser(userId);
  }

  async getAnswersWithPopulatedData(questionId: EntityId): Promise<IAnswerModel[]> {
    return await this.answerRepository.findAnswersByQuestionWithPopulate(questionId);
  }
} 