import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { IAnswerRepository } from '../../repositories/interfaces/IAnswerRepository';
import { EntityId } from '../../types/database';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IAnswerService } from '../contracts/IAnswerService';
import { AnswerServiceMessages } from '../constants/ServiceMessages';

@injectable()
export class AnswerManager implements IAnswerService {
  constructor(
    @inject('IAnswerRepository') private answerRepository: IAnswerRepository,
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository
  ) {}

  async createAnswer(
    answerData: any,
    questionId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel> {
    // Question'ın var olup olmadığını kontrol et
    const question = await this.questionRepository.findById(questionId);

    const answer = await this.answerRepository.create({
      ...answerData,
      question: question._id,
      user: userId,
    });
    return answer;
  }

  async getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    return await this.answerRepository.findByQuestion(questionId);
  }

  async getAnswerById(answerId: string): Promise<IAnswerModel> {
    const answer = await this.answerRepository.findByIdWithPopulate(answerId);
    if (!answer) {
      throw ApplicationError.notFoundError(
        AnswerServiceMessages.AnswerNotFound.en
      );
    }
    return answer;
  }

  async updateAnswer(answerId: string, content: string): Promise<IAnswerModel> {
    if (!content) {
      throw ApplicationError.validationError(
        AnswerServiceMessages.ContentRequired.en
      );
    }
    const answer = await this.answerRepository.updateById(answerId, {
      content,
    });
    if (!answer) {
      throw ApplicationError.notFoundError(
        AnswerServiceMessages.AnswerNotFound.en
      );
    }
    return answer;
  }

  async deleteAnswer(answerId: string, questionId: string): Promise<void> {
    await this.answerRepository.deleteById(answerId);
    const question = await this.questionRepository.findById(questionId);
    question.answers = question.answers.filter(
      (id: any) => id.toString() !== answerId.toString()
    );
    await this.questionRepository.updateById(questionId, {
      answers: question.answers,
    });
  }

  async likeAnswer(answerId: string, userId: EntityId): Promise<IAnswerModel> {
    const answer = await this.answerRepository.likeAnswer(answerId, userId);
    if (!answer) {
      // Answer var ama zaten beğenilmiş
      throw ApplicationError.businessError(
        AnswerServiceMessages.AlreadyLiked.en,
        400
      );
    }
    return answer;
  }

  async undoLikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.answerRepository.unlikeAnswer(answerId, userId);
    if (!answer) {
      // Answer var ama beğeni yok
      throw ApplicationError.businessError(
        AnswerServiceMessages.CannotUndoLike.en,
        400
      );
    }
    return answer;
  }

  async getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]> {
    return await this.answerRepository.findByUser(userId);
  }

  async getAnswersWithPopulatedData(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return await this.answerRepository.findAnswersByQuestionWithPopulate(
      questionId
    );
  }
}
