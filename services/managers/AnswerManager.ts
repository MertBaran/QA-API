import { injectable, inject } from 'tsyringe';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { IAnswerRepository } from '../../repositories/interfaces/IAnswerRepository';
import { EntityId } from '../../types/database';
import { ContentType } from '../../types/content/RelationType';
import {
  ParentReference,
  AncestorReference,
  ParentContentInfo,
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

    // Compute parent and ancestors
    // If answerData.parent is provided, use it
    // Otherwise, if the question has a parent, inherit it
    let parent: ParentReference | undefined = undefined;
    let ancestors: AncestorReference[] = [];

    if (answerData.parent) {
      // Explicit parent provided in answerData
      const parentId = answerData.parent.id;
      const parentType = answerData.parent.type;

      if (parentType === ContentType.QUESTION) {
        // Check if parent is a question
        const parentQuestion = await this.questionRepository.findById(parentId);
        if (!parentQuestion) {
          throw ApplicationError.validationError('Parent question not found');
        }
        parent = { id: parentQuestion._id, type: ContentType.QUESTION };
        ancestors = this.computeAncestors(parentQuestion, ContentType.QUESTION);
      } else if (parentType === ContentType.ANSWER) {
        // Check if parent is an answer
        const parentAnswer = await this.answerRepository.findById(parentId);
        if (!parentAnswer) {
          throw ApplicationError.validationError('Parent answer not found');
        }
        parent = { id: parentAnswer._id, type: ContentType.ANSWER };
        ancestors = await this.computeAncestorsForAnswer(parentAnswer);
      }
    } else if (question.parent) {
      // No explicit parent in answerData, but question has a parent
      // Inherit question's parent
      parent = {
        id: question.parent.id,
        type: question.parent.type,
      };
      ancestors = this.computeAncestors(question, ContentType.QUESTION);
    }

    const answer = await this.answerRepository.create({
      ...answerData,
      question: question._id,
      user: userId,
      parent,
      ancestors,
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

  private computeAncestors(
    parentContent: IQuestionModel | IAnswerModel,
    currentType: ContentType
  ): AncestorReference[] {
    const ancestors: AncestorReference[] = [];

    // Add parent itself at depth 0
    ancestors.push({
      id: parentContent._id,
      type: currentType,
      depth: 0,
    });

    // Add parent's ancestors with incremented depth
    // Note: parent.ancestors already contains the full chain, just increment depth
    if (parentContent.ancestors) {
      parentContent.ancestors.forEach(ancestor => {
        ancestors.push({
          id: ancestor.id,
          type: ancestor.type,
          depth: ancestor.depth + 1,
        });
      });
    }

    return ancestors;
  }

  private async computeAncestorsForAnswer(
    parentAnswer: IAnswerModel
  ): Promise<AncestorReference[]> {
    const ancestors: AncestorReference[] = [];

    // Add answer itself at depth 0
    ancestors.push({
      id: parentAnswer._id,
      type: ContentType.ANSWER,
      depth: 0,
    });

    // Get the question for this answer
    const question = await this.questionRepository.findById(
      parentAnswer.question
    );

    // If question has ancestors, use them directly (they already have the correct structure)
    // Otherwise, add question at depth 1
    if (question.ancestors && question.ancestors.length > 0) {
      // Question ancestors already contain full chain, just increment depth
      question.ancestors.forEach(ancestor => {
        ancestors.push({
          id: ancestor.id,
          type: ancestor.type,
          depth: ancestor.depth + 1,
        });
      });
    } else {
      // No ancestors, just add question at depth 1
      ancestors.push({
        id: question._id,
        type: ContentType.QUESTION,
        depth: 1,
      });
    }

    return ancestors;
  }

  async getAnswersByQuestion(
    questionId: EntityId,
    page: number = 1,
    limit: number = 10
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
  }> {
    const result = await this.answerRepository.findByQuestionPaginated(
      questionId,
      page,
      limit
    );
    const enrichedAnswers = await this.enrichWithQuestionInfo(result.data);
    const answersWithParents = await this.enrichWithParentInfo(enrichedAnswers);
    
    return {
      data: answersWithParents,
      pagination: result.pagination,
    };
  }

  async getAnswerPageNumber(
    questionId: EntityId,
    answerId: EntityId,
    limit: number = 10
  ): Promise<number | null> {
    return await this.answerRepository.findAnswerPageNumber(
      questionId,
      answerId,
      limit
    );
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
    // Enrich with parent info to populate ancestors
    const enrichedAnswers = await this.enrichWithParentInfo([answer]);
    return enrichedAnswers[0] || answer;
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

  async getAnswersByUser(
    userId: EntityId,
    page: number = 1,
    limit: number = 10
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
  }> {
    // Elasticsearch'i 2 saniye timeout ile dene, dönmezse MongoDB'ye geç
    const ELASTICSEARCH_TIMEOUT = 2000; // 2 saniye

    const elasticsearchPromise = (async () => {
      try {
        const result = await this.searchClient.search<AnswerSearchDoc>(
          this.answerProjector.indexName,
          this.answerProjector.searchFields,
          '',
          {
            page,
            limit,
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
        };
      } catch (error: any) {
        throw error;
      }
    })();

    const timeoutPromise = new Promise<{
      data: IAnswerModel[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Elasticsearch timeout after 2 seconds'));
      }, ELASTICSEARCH_TIMEOUT);
    });

    try {
      // 2 saniye içinde Elasticsearch'ten cevap gelirse onu kullan
      return await Promise.race([elasticsearchPromise, timeoutPromise]);
    } catch (error: any) {
      // Timeout veya hata durumunda MongoDB'ye fallback
      this.logger.warn(
        'Elasticsearch timeout or error for answers by user, falling back to MongoDB',
        {
          error: error.message,
          userId: String(userId),
        }
      );
      // MongoDB'den pagination ile çek
      const allAnswers = await this.answerRepository.findByUser(userId);
      const skip = (page - 1) * limit;
      const paginatedAnswers = allAnswers.slice(skip, skip + limit);

      return {
        data: paginatedAnswers,
        pagination: {
          page,
          limit,
          total: allAnswers.length,
          totalPages: Math.ceil(allAnswers.length / limit),
          hasNext: skip + limit < allAnswers.length,
          hasPrev: page > 1,
        },
      };
    }
  }

  private async enrichWithParentInfo(
    answers: IAnswerModel[]
  ): Promise<IAnswerModel[]> {
    if (!answers.length) {
      return answers;
    }

    // Collect all parent IDs (questions and answers)
    const parentQuestionIds: EntityId[] = [];
    const parentAnswerIds: EntityId[] = [];

    answers.forEach(answer => {
      if (answer.parent) {
        if (answer.parent.type === ContentType.QUESTION) {
          parentQuestionIds.push(answer.parent.id);
        } else if (answer.parent.type === ContentType.ANSWER) {
          parentAnswerIds.push(answer.parent.id);
        }
      }
    });

    // Fetch parent questions and answers
    const parentQuestions = parentQuestionIds.length
      ? await this.questionRepository.findByIds(parentQuestionIds)
      : [];
    const parentAnswers = parentAnswerIds.length
      ? await this.answerRepository.findByIds(parentAnswerIds)
      : [];

    // Create maps for quick lookup
    const parentQuestionMap = new Map(
      parentQuestions.map(q => [q._id.toString(), q])
    );
    const parentAnswerMap = new Map(
      parentAnswers.map(a => [a._id.toString(), a])
    );

    // Get question IDs for parent answers
    const parentAnswerQuestionIds = Array.from(
      new Set(
        parentAnswers
          .map(a => {
            const question: any = a.question;
            if (!question) return null;
            return typeof question === 'object'
              ? question._id?.toString()
              : question.toString();
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    const parentAnswerQuestions = parentAnswerQuestionIds.length
      ? await this.questionRepository.findByIds(parentAnswerQuestionIds)
      : [];

    const parentAnswerQuestionMap = new Map(
      parentAnswerQuestions.map(q => [q._id.toString(), q])
    );

    // Enrich answers with parent content info
    return answers.map(answer => {
      if (!answer.parent) {
        // Debug log for answer without parent
        if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
          this.logger.info('Answer has no parent', {
            answerId: answer._id.toString(),
            ancestors: answer.ancestors,
          });
        }
        return answer;
      }

      const parentId = answer.parent.id.toString();
      const parentType = answer.parent.type;

      if (parentType === ContentType.QUESTION) {
        const parentQuestion = parentQuestionMap.get(parentId);
        if (parentQuestion) {
          // Debug log before processing
          if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
            this.logger.info('Processing answer with parent question', {
              answerId: answer._id.toString(),
              parentId,
              parentQuestionId: parentQuestion._id.toString(),
              parentQuestionAncestors: parentQuestion.ancestors,
              parentQuestionAncestorsLength: parentQuestion.ancestors?.length,
              answerAncestors: answer.ancestors,
              answerAncestorsLength: answer.ancestors?.length,
            });
          }

          // Eğer answer'ın ancestors'ı yoksa ama parent question'ın ancestors'ı varsa,
          // ancestors'ı parent question'ın ancestors'ından oluştur
          let enrichedAncestors = answer.ancestors;
          if (!enrichedAncestors || enrichedAncestors.length === 0) {
            // Parent question'ın ancestors'ı var mı kontrol et
            if (
              parentQuestion.ancestors &&
              parentQuestion.ancestors.length > 0
            ) {
              // Parent question'ın ancestors'ı var, o zaman bu answer'ın da ancestors'ı olmalı
              enrichedAncestors = [
                {
                  id: parentQuestion._id,
                  type: ContentType.QUESTION,
                  depth: 0,
                },
                ...parentQuestion.ancestors.map(a => ({
                  id: a.id,
                  type: a.type,
                  depth: a.depth + 1,
                })),
              ];

              // Debug log after creating ancestors
              if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
                this.logger.info('Created ancestors from parent question', {
                  answerId: answer._id.toString(),
                  enrichedAncestors,
                  enrichedAncestorsLength: enrichedAncestors.length,
                });
              }
            } else {
              // Debug log when parent question has no ancestors
              if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
                this.logger.info('Parent question has no ancestors', {
                  answerId: answer._id.toString(),
                  parentQuestionId: parentQuestion._id.toString(),
                });
              }
            }
          }

          // Debug log for specific answer
          if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
            this.logger.info('Debug answer ancestors (parent question)', {
              answerId: answer._id.toString(),
              originalAncestors: answer.ancestors,
              enrichedAncestors,
              parentQuestionId: parentQuestion._id.toString(),
              parentQuestionAncestors: parentQuestion.ancestors,
            });
          }

          return {
            ...answer,
            ancestors: enrichedAncestors,
            parentContentInfo: {
              id: parentQuestion._id,
              type: ContentType.QUESTION,
              title: parentQuestion.title,
              slug: parentQuestion.slug,
              user: parentQuestion.user,
              userInfo: parentQuestion.userInfo,
            } as ParentContentInfo,
          };
        }
      } else if (parentType === ContentType.ANSWER) {
        const parentAnswer = parentAnswerMap.get(parentId);
        if (parentAnswer) {
          const questionId =
            typeof parentAnswer.question === 'object'
              ? (parentAnswer.question as any)._id?.toString()
              : parentAnswer.question?.toString();
          const answerQuestion = questionId
            ? parentAnswerQuestionMap.get(questionId)
            : null;

          // Eğer answer'ın ancestors'ı yoksa ama parent answer'ın parent'ı varsa,
          // ancestors'ı parent answer'ın ancestors'ından oluştur
          let enrichedAncestors = answer.ancestors;
          if (!enrichedAncestors || enrichedAncestors.length === 0) {
            // Parent answer'ın parent'ı var mı kontrol et
            if (parentAnswer.parent) {
              // Parent answer'ın parent'ı var, o zaman bu answer'ın da ancestors'ı olmalı
              enrichedAncestors = [
                {
                  id: parentAnswer._id,
                  type: ContentType.ANSWER,
                  depth: 0,
                },
              ];

              // Parent answer'ın ancestors'ını da ekle
              if (parentAnswer.ancestors && parentAnswer.ancestors.length > 0) {
                enrichedAncestors.push(
                  ...parentAnswer.ancestors.map(a => ({
                    id: a.id,
                    type: a.type,
                    depth: a.depth + 1,
                  }))
                );
              } else {
                // Parent answer'ın ancestors'ı yok ama parent'ı var, o zaman parent'ı da ekle
                enrichedAncestors.push({
                  id: parentAnswer.parent.id,
                  type: parentAnswer.parent.type,
                  depth: 1,
                });
              }
            } else if (
              parentAnswer.ancestors &&
              parentAnswer.ancestors.length > 0
            ) {
              // Parent answer'ın ancestors'ı var ama parent field'ı yok
              enrichedAncestors = [
                {
                  id: parentAnswer._id,
                  type: ContentType.ANSWER,
                  depth: 0,
                },
                ...parentAnswer.ancestors.map(a => ({
                  id: a.id,
                  type: a.type,
                  depth: a.depth + 1,
                })),
              ];
            }
          }

          // Debug log for specific answer
          if (answer._id.toString() === '6951cc1f0ffdbcb4e9208825') {
            this.logger.info('Debug answer ancestors', {
              answerId: answer._id.toString(),
              originalAncestors: answer.ancestors,
              enrichedAncestors,
              parentAnswerId: parentAnswer._id.toString(),
              parentAnswerParent: parentAnswer.parent,
              parentAnswerAncestors: parentAnswer.ancestors,
            });
          }

          return {
            ...answer,
            ancestors: enrichedAncestors,
            parentContentInfo: {
              id: parentAnswer._id,
              type: ContentType.ANSWER,
              questionId: questionId as EntityId,
              questionTitle: answerQuestion?.title,
              questionSlug: answerQuestion?.slug,
              user: parentAnswer.user,
              userInfo: parentAnswer.userInfo,
            } as ParentContentInfo,
          };
        }
      }

      return answer;
    });
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
      const answersWithParentInfo =
        await this.enrichWithParentInfo(enrichedAnswers);

      return {
        data: answersWithParentInfo,
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
