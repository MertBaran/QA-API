import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { IAnswerRepository } from '../../repositories/interfaces/IAnswerRepository';
import { EntityId } from '../../types/database';
import { ContentType } from '../../types/content/RelationType';
import {
  ParentReference,
  AncestorReference,
} from '../../types/content/IContent';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IAnswerService } from '../contracts/IAnswerService';
import {
  AnswerServiceMessages,
  QuestionServiceMessages,
} from '../constants/ServiceMessages';
import { IIndexClient } from '../../infrastructure/search/IIndexClient';
import { ISearchClient } from '../../infrastructure/search/ISearchClient';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { IProjector } from '../../infrastructure/search/IProjector';
import {
  AnswerSearchDoc,
  QuestionSearchDoc,
} from '../../infrastructure/search/SearchDocument';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';

@injectable()
export class AnswerManager implements IAnswerService {
  constructor(
    @inject('IAnswerRepository') private answerRepository: IAnswerRepository,
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository,
    @inject('IIndexClient')
    private indexClient: IIndexClient,
    @inject('ISearchClient')
    private searchClient: ISearchClient,
    @inject('IProjector<IAnswerModel, AnswerSearchDoc>')
    private answerProjector: IProjector<IAnswerModel, AnswerSearchDoc>,
    @inject('IProjector<IQuestionModel, QuestionSearchDoc>')
    private questionProjector: IProjector<IQuestionModel, QuestionSearchDoc>,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  async createAnswer(
    answerData: any,
    questionId: EntityId,
    userId: EntityId
  ): Promise<IAnswerModel> {
    // Question'ın var olup olmadığını kontrol et
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }

    const answer = await this.answerRepository.create({
      ...answerData,
      question: question._id,
      user: userId,
    });

    // Project entity to SearchDocument and index
    const answerSearchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'index',
      answerSearchDoc
    );

    // Update question index - answers array changed
    // Use 'index' instead of 'update' to handle case where document doesn't exist yet (upsert behavior)
    const updatedQuestion = await this.questionRepository.findById(questionId);
    if (updatedQuestion) {
      const questionSearchDoc = this.questionProjector.project(updatedQuestion);
      await this.indexClient.sync(
        this.questionProjector.indexName,
        'index',
        questionSearchDoc
      );
    }

    // Return answer (already populated from create)
    return answer;
  }

  async getAnswersByQuestion(questionId: EntityId): Promise<IAnswerModel[]> {
    const answers = await this.answerRepository.findByQuestion(questionId);
    return this.enrichWithQuestionInfo(answers);
    // try {
    //   const result = await this.searchClient.search<AnswerSearchDoc>(
    //     this.answerProjector.indexName,
    //     this.answerProjector.searchFields,
    //     '',
    //     {
    //       page: 1,
    //       limit: 100,
    //       filters: {
    //         questionId: String(questionId),
    //       },
    //       sortBy: 'date',
    //       sortOrder: 'desc',
    //     }
    //   );
    //   // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
    //   const answers = result.hits.map(
    //     (doc): IAnswerModel => ({
    //       _id: doc._id as EntityId,
    //       contentType: ContentType.ANSWER,
    //       content: doc.content,
    //       user: doc.userId as EntityId,
    //       userInfo: doc.userInfo,
    //       question: doc.questionId as EntityId,
    //       likes: (doc.likes || []).map(id => id as EntityId),
    //       dislikes: (doc.dislikes || []).map(id => id as EntityId),
    //       isAccepted: doc.isAccepted,
    //       createdAt: doc.createdAt || new Date(),
    //     })
    //   );
    //   return this.enrichWithQuestionInfo(answers);
    // } catch (error: any) {
    //   this.logger.warn(
    //     'Search failed for answers by question, falling back to MongoDB',
    //     {
    //       error: error.message,
    //     }
    //   );
    // }
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

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async deleteAnswer(answerId: string, questionId: string): Promise<void> {
    await this.answerRepository.deleteById(answerId);

    // Delete from index
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'delete',
      answerId
    );

    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      return;
    }

    question.answers = question.answers.filter(
      (id: any) => id.toString() !== answerId.toString()
    );
    await this.questionRepository.updateById(questionId, {
      answers: question.answers,
    });

    // Update question index - answers array changed
    const updatedQuestion = await this.questionRepository.findById(questionId);
    if (updatedQuestion) {
      const questionSearchDoc = this.questionProjector.project(updatedQuestion);
      await this.indexClient.sync(
        this.questionProjector.indexName,
        'update',
        questionSearchDoc
      );
    }
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

    // Project entity to SearchDocument and update index
    try {
      const searchDoc = this.answerProjector.project(answer);
      await this.indexClient.sync(
        this.answerProjector.indexName,
        'update',
        searchDoc
      );
    } catch (error) {
      // Silently handle Elasticsearch sync error
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

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async dislikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.answerRepository.dislikeAnswer(answerId, userId);
    if (!answer) {
      // Answer var ama beğeni yok
      throw ApplicationError.businessError(
        AnswerServiceMessages.CannotUndoLike.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async undoDislikeAnswer(
    answerId: string,
    userId: EntityId
  ): Promise<IAnswerModel> {
    const answer = await this.answerRepository.undoDislikeAnswer(
      answerId,
      userId
    );
    if (!answer) {
      // Answer var ama beğeni yok
      throw ApplicationError.businessError(
        AnswerServiceMessages.CannotUndoLike.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.answerProjector.project(answer);
    await this.indexClient.sync(
      this.answerProjector.indexName,
      'update',
      searchDoc
    );

    return answer;
  }

  async getAnswersByUser(userId: EntityId): Promise<IAnswerModel[]> {
    try {
      const result = await this.searchClient.search<AnswerSearchDoc>(
        this.answerProjector.indexName,
        this.answerProjector.searchFields,
        '',
        {
          page: 1,
          limit: 100,
          filters: {
            userId: String(userId),
          },
          sortBy: 'date',
          sortOrder: 'desc',
        }
      );
      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      const answers = result.hits.map(
        (doc): IAnswerModel => ({
          _id: doc._id as EntityId,
          contentType: ContentType.ANSWER,
          content: doc.content,
          user: doc.userId as EntityId,
          userInfo: doc.userInfo,
          question: doc.questionId as EntityId,
          likes: (doc.likes || []).map(id => id as EntityId),
          dislikes: (doc.dislikes || []).map(id => id as EntityId),
          isAccepted: doc.isAccepted,
          createdAt: doc.createdAt || new Date(),
        })
      );
      return this.enrichWithQuestionInfo(answers);
    } catch (error: any) {
      this.logger.warn(
        'Search failed for answers by user, falling back to MongoDB',
        {
          error: error.message,
        }
      );
    }

    // Fallback to MongoDB
    return await this.answerRepository.findByUser(userId);
  }

  private async enrichWithQuestionInfo(
    answers: IAnswerModel[]
  ): Promise<IAnswerModel[]> {
    if (!answers.length) {
      return answers;
    }

    const questionIds = Array.from(
      new Set(
        answers
          .map(answer => {
            const question: any = answer.question;
            if (!question) {
              return null;
            }
            if (typeof question === 'object') {
              return question._id ? question._id.toString() : null;
            }
            return question.toString();
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    if (!questionIds.length) {
      return answers;
    }

    const questions = await this.questionRepository.findByIds(questionIds);
    if (!questions.length) {
      return answers;
    }

    const questionMap = new Map(
      questions.map(question => [question._id.toString(), question])
    );

    return answers.map(answer => {
      const questionId =
        typeof answer.question === 'object'
          ? (answer.question as any)._id?.toString()
          : answer.question?.toString();
      const question = questionId ? questionMap.get(questionId) : undefined;
      if (!question) {
        return answer;
      }
      return {
        ...answer,
        question: questionId as EntityId,
        questionInfo: {
          _id: question._id.toString(),
          title: question.title,
          slug: question.slug,
        },
      };
    });
  }

  async getAnswersWithPopulatedData(
    questionId: EntityId
  ): Promise<IAnswerModel[]> {
    return await this.answerRepository.findAnswersByQuestionWithPopulate(
      questionId
    );
  }

  async searchAnswers(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'medium',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string
  ): Promise<{
    data: IAnswerModel[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    warnings?: {
      semanticSearchUnavailable?: boolean;
    };
  }> {
    if (searchTerm.trim().length === 0) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    try {
      const result = await this.searchClient.search<AnswerSearchDoc>(
        this.answerProjector.indexName,
        this.answerProjector.searchFields,
        searchTerm,
        {
          page,
          limit,
          searchMode,
          matchType,
          typoTolerance,
          smartSearch,
          smartOptions,
          language,
        }
      );

      // Semantic search kullanılamadıysa warning'i logla
      if (result.warnings?.semanticSearchUnavailable) {
        this.logger.warn(
          'Semantic search was requested but ELSER model is not deployed',
          {
            searchTerm,
            matchType,
            smartOptions,
          }
        );
      }

      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      const answers = result.hits.map(
        (doc): IAnswerModel => ({
          _id: doc._id as EntityId,
          contentType: ContentType.ANSWER,
          content: doc.content,
          user: doc.userId as EntityId,
          userInfo: doc.userInfo,
          question: doc.questionId as EntityId,
          likes: (doc.likes || []).map(id => id as EntityId),
          dislikes: (doc.dislikes || []).map(id => id as EntityId),
          isAccepted: doc.isAccepted,
          createdAt: doc.createdAt || new Date(),
          parent: doc.parent
            ? {
                id: doc.parent.id as EntityId,
                type: doc.parent.type as ContentType,
              }
            : undefined,
          ancestors:
            doc.ancestorsIds && doc.ancestorsTypes
              ? doc.ancestorsIds.map((id, idx) => ({
                  id: id as EntityId,
                  type: doc.ancestorsTypes![idx] as ContentType,
                  depth: idx,
                }))
              : undefined,
        })
      );
      const enrichedAnswers = await this.enrichWithQuestionInfo(answers);

      return {
        data: enrichedAnswers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
        warnings: result.warnings,
      };
    } catch (error: any) {
      this.logger.warn('Search failed for answers, falling back to MongoDB', {
        error: error.message,
      });
    }

    // Fallback to MongoDB - repository'de searchByContent metodu yoksa eklememiz gerekebilir
    // Şimdilik boş array döndürelim, MongoDB fallback'i eklenebilir
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}
