import { injectable, inject } from 'tsyringe';
import { IQuestionRepository } from '../../repositories/interfaces/IQuestionRepository';
import { IAnswerRepository } from '../../repositories/interfaces/IAnswerRepository';
import { IContentRelationRepository } from '../../repositories/interfaces/IContentRelationRepository';
import { IQuestionModel } from '../../models/interfaces/IQuestionModel';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { EntityId } from '../../types/database';
import { ContentType } from '../../types/content/RelationType';
import {
  ParentReference,
  AncestorReference,
  ParentContentInfo,
} from '../../types/content/IContent';
import { ICacheProvider } from '../../infrastructure/cache/ICacheProvider';
import { IQuestionService } from '../contracts/IQuestionService';
import { QuestionServiceMessages } from '../constants/ServiceMessages';
import {
  PaginationQueryDTO,
  PaginatedResponse,
} from '../../types/dto/question/pagination.dto';
import { IIndexClient } from '../../infrastructure/search/IIndexClient';
import { ISearchClient } from '../../infrastructure/search/ISearchClient';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { IProjector } from '../../infrastructure/search/IProjector';
import {
  QuestionSearchDoc,
  AnswerSearchDoc,
} from '../../infrastructure/search/SearchDocument';
import { TOKENS } from '../TOKENS';
import { IContentAssetService } from '../../infrastructure/storage/content/IContentAssetService';
import {
  ContentAssetDescriptor,
  ContentAssetType,
  ContentAssetVisibility,
} from '../../infrastructure/storage/content/ContentAssetType';
import type { CreateQuestionDTO } from '../../types/dto/question/create-question.dto';
import type { UpdateQuestionDTO } from '../../types/dto/question/update-question.dto';

@injectable()
export class QuestionManager implements IQuestionService {
  constructor(
    @inject('IQuestionRepository')
    private questionRepository: IQuestionRepository,
    @inject('IAnswerRepository')
    private answerRepository: IAnswerRepository,
    @inject('IContentRelationRepository')
    private contentRelationRepository: IContentRelationRepository,
    @inject('ICacheProvider') private cacheProvider: ICacheProvider,
    @inject('IIndexClient')
    private indexClient: IIndexClient,
    @inject('ISearchClient')
    private searchClient: ISearchClient,
    @inject('IProjector<IQuestionModel, QuestionSearchDoc>')
    private questionProjector: IProjector<IQuestionModel, QuestionSearchDoc>,
    @inject('IProjector<IAnswerModel, AnswerSearchDoc>')
    private answerProjector: IProjector<IAnswerModel, AnswerSearchDoc>,
    @inject(TOKENS.IContentAssetService)
    private contentAssetService: IContentAssetService,
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  async createQuestion(
    questionData: CreateQuestionDTO,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const {
      thumbnailKey,
      parent: parentInput,
      ...restQuestionData
    } = questionData;

    // Compute parent and ancestors if parent is provided
    let parent: ParentReference | undefined = undefined;
    let ancestors: AncestorReference[] = [];

    if (parentInput) {
      const parentId = parentInput.id;
      const parentType = parentInput.type;

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

      // Cycle check: ensure question ID is not in ancestors chain
      // Note: We can't check against questionId yet since it doesn't exist, so we skip this for now
      // The cycle prevention relies on ancestors depth limit and database constraints
    }

    const question = await this.questionRepository.create({
      ...restQuestionData,
      contentType: ContentType.QUESTION,
      user: userId,
      parent,
      ancestors,
    });

    let questionWithAssets = question;

    if (thumbnailKey) {
      const descriptor = this.buildQuestionThumbnailDescriptor(
        userId,
        question._id
      );
      const thumbnail = await this.buildThumbnail(thumbnailKey, descriptor);
      questionWithAssets = await this.questionRepository.updateById(
        question._id,
        {
          thumbnail,
        }
      );
    }

    await this.cacheProvider.del('questions:all');

    // Project entity to SearchDocument and index
    const searchDoc = this.questionProjector.project(questionWithAssets);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'index',
      searchDoc
    );

    return questionWithAssets;
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

  async getAllQuestions(): Promise<IQuestionModel[]> {
    const cacheKey = 'questions:all';
    const cached = await this.cacheProvider.get<IQuestionModel[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const questions = await this.questionRepository.findAll();
    //tüm soruları redis'te cachlemek çok ağır yük olur.
    //await this.cacheProvider.set<IQuestionModel[]>(cacheKey, questions, 60);
    return questions;
  }

  async getQuestionsPaginated(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    // TODO: Consider using Elasticsearch when category/tags filters are present (even without search)
    // Currently only uses Elasticsearch when search term is provided
    // Potential improvement: if (filters.search || filters.category || filters.tags) { ... }
    // Search client kullan - SearchDocument bazlı
    if (filters.search && filters.search.trim().length > 0) {
      try {
        const searchResult = await this.searchClient.search<QuestionSearchDoc>(
          this.questionProjector.indexName,
          this.questionProjector.searchFields,
          filters.search,
          {
            page: filters.page,
            limit: filters.limit,
            filters: {
              category: filters.category,
              tags: filters.tags
                ? filters.tags.split(',').map(t => t.trim())
                : undefined,
            },
            sortBy:
              filters.sortBy === 'likes' || filters.sortBy === 'answers'
                ? 'popularity'
                : filters.sortBy === 'createdAt'
                  ? 'date'
                  : 'relevance',
            sortOrder: filters.sortOrder as 'asc' | 'desc',
          }
        );

        // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür (MongoDB'ye gitmeden)
        const questions = searchResult.hits.map(
          (doc): IQuestionModel => ({
            _id: doc._id as EntityId,
            contentType: ContentType.QUESTION,
            title: doc.title,
            content: doc.content,
            slug: doc.slug,
            category: doc.category,
            tags: doc.tags,
            createdAt: doc.createdAt,
            user: doc.user as EntityId,
            userInfo: doc.userInfo,
            likes: (doc.likes || []).map(id => id as EntityId),
            dislikes: (doc.dislikes || []).map(id => id as EntityId),
            answers: (doc.answers || []).map(id => id as EntityId),
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
            relatedContents: (doc.relatedContents || []).map(
              id => id as EntityId
            ),
          })
        );

        return {
          data: questions,
          pagination: {
            currentPage: searchResult.page,
            totalPages: searchResult.totalPages,
            totalItems: searchResult.total,
            itemsPerPage: searchResult.limit,
            hasNextPage: searchResult.page < searchResult.totalPages,
            hasPreviousPage: searchResult.page > 1,
          },
        };
      } catch (error: any) {
        this.logger.warn('Search failed, falling back to MongoDB', {
          error: error.message,
        });
      }
    }

    // Fallback to MongoDB for non-search queries or if search fails
    return await this.questionRepository.findPaginated(filters);
  }

  async getQuestionsWithParents(
    filters: PaginationQueryDTO
  ): Promise<PaginatedResponse<IQuestionModel>> {
    // First get paginated questions
    const result = await this.getQuestionsPaginated(filters);

    // Collect all unique parent IDs from ancestors arrays (depth 0)
    const parentIds = new Set<EntityId>();
    result.data.forEach(q => {
      if (q.ancestors && q.ancestors.length > 0) {
        // Get parent from depth 0
        const parent = q.ancestors.find(a => a.depth === 0);
        if (parent) {
          parentIds.add(parent.id);
        }
      }
    });

    if (parentIds.size === 0) {
      return result;
    }

    // Fetch all unique parents
    const uniqueParentIds = Array.from(parentIds);
    const [parentQuestions, parentAnswers] = await Promise.all([
      this.questionRepository.findByIds(uniqueParentIds),
      this.answerRepository.findByIds(uniqueParentIds),
    ]);

    // Create lookup maps
    const parentQuestionMap = new Map<string, IQuestionModel>();
    parentQuestions.forEach(q => {
      if (q && q._id) {
        parentQuestionMap.set(String(q._id), q);
      }
    });

    const parentAnswerMap = new Map<string, IAnswerModel>();
    parentAnswers.forEach(a => {
      if (a && a._id) {
        parentAnswerMap.set(String(a._id), a);
      }
    });

    // For answers, we need their question info
    const answerQuestionIds = parentAnswers
      .filter(a => a && a.question)
      .map(a => String(a.question));
    const answerQuestions =
      answerQuestionIds.length > 0
        ? await this.questionRepository.findByIds(answerQuestionIds)
        : [];
    const answerQuestionMap = new Map<string, IQuestionModel>();
    answerQuestions.forEach(q => {
      if (q && q._id) {
        answerQuestionMap.set(String(q._id), q);
      }
    });

    // Enrich questions with parent content info
    result.data = result.data.map(question => {
      let parentId: EntityId | undefined;
      let parentType: ContentType | undefined;

      // Try to get parent from ancestors (new structure)
      if (question.ancestors && question.ancestors.length > 0) {
        const parent = question.ancestors.find(a => a.depth === 0);
        if (parent) {
          parentId = parent.id;
          parentType = parent.type;
        }
      }

      if (!parentId) return question;

      // If we have parentType, use it (new structure)
      if (parentType) {
        if (parentType === ContentType.QUESTION) {
          const parentQuestion = parentQuestionMap.get(String(parentId));
          if (parentQuestion) {
            return {
              ...question,
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
          const parentAnswer = parentAnswerMap.get(String(parentId));
          if (parentAnswer) {
            const answerQuestion = parentAnswer.question
              ? answerQuestionMap.get(parentAnswer.question?.toString() || '')
              : null;
            return {
              ...question,
              parentContentInfo: {
                id: parentAnswer._id,
                type: ContentType.ANSWER,
                questionId: parentAnswer.question,
                questionTitle: answerQuestion?.title,
                questionSlug: answerQuestion?.slug,
                user: parentAnswer.user,
                userInfo: parentAnswer.userInfo,
              } as ParentContentInfo,
            };
          }
        }
      } else {
        // Legacy: no parentType, try both
        const parentQuestion = parentQuestionMap.get(String(parentId));
        if (parentQuestion) {
          return {
            ...question,
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

        const parentAnswer = parentAnswerMap.get(String(parentId));
        if (parentAnswer) {
          const answerQuestion = parentAnswer.question
            ? answerQuestionMap.get(parentAnswer.question?.toString() || '')
            : null;
          return {
            ...question,
            parentContentInfo: {
              id: parentAnswer._id,
              type: ContentType.ANSWER,
              questionId: parentAnswer.question,
              questionTitle: answerQuestion?.title,
              questionSlug: answerQuestion?.slug,
              user: parentAnswer.user,
              userInfo: parentAnswer.userInfo,
            } as ParentContentInfo,
          };
        }
      }

      return question;
    });

    return result;
  }

  async getQuestionById(questionId: EntityId): Promise<IQuestionModel> {
    const question =
      await this.questionRepository.findByIdWithPopulate(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }

    return question;
  }

  async updateQuestion(
    questionId: EntityId,
    updateData: UpdateQuestionDTO
  ): Promise<IQuestionModel> {
    const existingQuestion = await this.questionRepository.findById(questionId);

    const { thumbnailKey, removeThumbnail, ...restUpdateData } = updateData;

    const updates: Partial<IQuestionModel> = {};

    if (restUpdateData.title !== undefined) {
      updates.title = restUpdateData.title;
    }
    if (restUpdateData.content !== undefined) {
      updates.content = restUpdateData.content;
    }

    const descriptor = this.buildQuestionThumbnailDescriptor(
      existingQuestion.user,
      existingQuestion._id
    );

    if (thumbnailKey) {
      if (
        existingQuestion.thumbnail?.key &&
        existingQuestion.thumbnail.key !== thumbnailKey
      ) {
        await this.safeDeleteAsset(existingQuestion.thumbnail.key, descriptor);
      }
      const thumbnail = await this.buildThumbnail(thumbnailKey, descriptor);
      updates.thumbnail = thumbnail;
    } else if (removeThumbnail) {
      if (existingQuestion.thumbnail?.key) {
        await this.safeDeleteAsset(existingQuestion.thumbnail.key, descriptor);
      }
      updates.thumbnail = null;
    }

    let question = existingQuestion;

    if (Object.keys(updates).length > 0) {
      question = await this.questionRepository.updateById(questionId, updates);
    }

    await this.cacheProvider.del('questions:all');

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async deleteQuestion(questionId: EntityId): Promise<IQuestionModel> {
    // Önce soruyu bul (silmeden önce)
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }

    // 1. Cevapları bul ve Elasticsearch'ten sil
    const answers = await this.answerRepository.findByQuestion(questionId);
    for (const answer of answers) {
      await this.indexClient.sync(
        this.answerProjector.indexName,
        'delete',
        String(answer._id)
      );
    }

    // 2. Child soruları bul (bu soruyu parent olarak kullananlar)
    const childQuestions =
      await this.questionRepository.findByParent(questionId);
    for (const childQuestion of childQuestions) {
      // Parent'ı null yap ve ancestors'ları güncelle
      const updatedAncestors =
        childQuestion.ancestors?.filter(
          ancestor => ancestor.id !== questionId
        ) || [];

      await this.questionRepository.updateById(childQuestion._id, {
        parent: undefined,
        ancestors: updatedAncestors,
      });

      // Elasticsearch'i güncelle
      const updatedChild = await this.questionRepository.findById(
        childQuestion._id
      );
      if (updatedChild) {
        const searchDoc = this.questionProjector.project(updatedChild);
        await this.indexClient.sync(
          this.questionProjector.indexName,
          'update',
          searchDoc
        );
      }
    }

    // 3. Bu soruyu ancestor olarak içeren tüm soruları ve cevapları bul ve güncelle
    const allQuestions = await this.questionRepository.findAll();
    const allAnswers = (await (
      this.answerRepository as any
    ).findAll()) as IAnswerModel[];

    // Bu soruyu ancestor olarak içeren sorular
    const questionsWithThisAncestor = allQuestions.filter((q: IQuestionModel) =>
      q.ancestors?.some(
        (ancestor: AncestorReference) => ancestor.id === questionId
      )
    );

    for (const q of questionsWithThisAncestor) {
      const updatedAncestors =
        q.ancestors?.filter(
          (ancestor: AncestorReference) => ancestor.id !== questionId
        ) || [];

      // Depth'leri yeniden hesapla
      const reindexedAncestors = updatedAncestors.map(
        (ancestor: AncestorReference, index: number) => ({
          ...ancestor,
          depth: index,
        })
      );

      await this.questionRepository.updateById(q._id, {
        ancestors: reindexedAncestors,
      });

      // Elasticsearch'i güncelle
      const updatedQ = await this.questionRepository.findById(q._id);
      if (updatedQ) {
        const searchDoc = this.questionProjector.project(updatedQ);
        await this.indexClient.sync(
          this.questionProjector.indexName,
          'update',
          searchDoc
        );
      }
    }

    // Bu soruyu ancestor olarak içeren cevaplar
    const answersWithThisAncestor = allAnswers.filter((a: IAnswerModel) =>
      a.ancestors?.some(
        (ancestor: AncestorReference) => ancestor.id === questionId
      )
    );

    for (const answer of answersWithThisAncestor) {
      const updatedAncestors =
        answer.ancestors?.filter(
          (ancestor: AncestorReference) => ancestor.id !== questionId
        ) || [];

      // Depth'leri yeniden hesapla
      const reindexedAncestors = updatedAncestors.map(
        (ancestor: AncestorReference, index: number) => ({
          ...ancestor,
          depth: index,
        })
      );

      await this.answerRepository.updateById(answer._id, {
        ancestors: reindexedAncestors,
      });

      // Elasticsearch'i güncelle
      const updatedAnswer = await this.answerRepository.findById(answer._id);
      if (updatedAnswer) {
        const answerSearchDoc = this.answerProjector.project(updatedAnswer);
        await this.indexClient.sync(
          this.answerProjector.indexName,
          'update',
          answerSearchDoc
        );
      }
    }

    // 4. Soruyu MongoDB'den sil (cevaplar pre-hook ile otomatik silinecek)
    const deletedQuestion =
      await this.questionRepository.deleteById(questionId);

    // 5. Thumbnail'i sil
    await this.deleteThumbnailIfExists(deletedQuestion);

    // 6. Redis cache'lerini temizle
    await this.cacheProvider.del('questions:all');
    await this.cacheProvider.del(`question:${questionId}`);
    await this.cacheProvider.del(`questions:user:${question.user}`);

    // 7. Elasticsearch'ten soruyu sil
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'delete',
      String(questionId)
    );

    this.logger.info('Question deleted successfully', {
      questionId: String(questionId),
      deletedAnswersCount: answers.length,
      updatedChildQuestionsCount: childQuestions.length,
      updatedQuestionsWithAncestorCount: questionsWithThisAncestor.length,
      updatedAnswersWithAncestorCount: answersWithThisAncestor.length,
    });

    return deletedQuestion;
  }

  async likeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.likeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.AlreadyLiked.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async undoLikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.unlikeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.NotLikedYet.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async dislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.dislikeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.AlreadyLiked.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async undoDislikeQuestion(
    questionId: EntityId,
    userId: EntityId
  ): Promise<IQuestionModel> {
    const question = await this.questionRepository.undoDislikeQuestion(
      questionId,
      userId
    );
    if (!question) {
      const exists = await this.questionRepository.findById(questionId);
      if (!exists)
        throw ApplicationError.notFoundError(
          QuestionServiceMessages.QuestionNotFound.en
        );
      throw ApplicationError.businessError(
        QuestionServiceMessages.NotLikedYet.en,
        400
      );
    }

    // Project entity to SearchDocument and update index
    const searchDoc = this.questionProjector.project(question);
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'update',
      searchDoc
    );

    return question;
  }

  async getQuestionsByUser(
    userId: EntityId,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<IQuestionModel>> {
    // Elasticsearch'i 2 saniye timeout ile dene, dönmezse MongoDB'ye geç
    const ELASTICSEARCH_TIMEOUT = 2000; // 2 saniye

    const elasticsearchPromise = (async () => {
      try {
        const result = await this.searchClient.search<QuestionSearchDoc>(
          this.questionProjector.indexName,
          this.questionProjector.searchFields,
          '',
          {
            page,
            limit,
            filters: {
              user: String(userId), // QuestionSearchDoc'da field adı 'user', 'userId' değil
            },
            sortBy: 'date',
            sortOrder: 'desc',
          }
        );
        // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
        const questions = result.hits.map(
          (doc): IQuestionModel => ({
            _id: doc._id as EntityId,
            contentType: ContentType.QUESTION,
            title: doc.title,
            content: doc.content,
            slug: doc.slug,
            user: doc.user as EntityId,
            userInfo: doc.userInfo,
            likes: (doc.likes || []).map(id => id as EntityId),
            dislikes: (doc.dislikes || []).map(id => id as EntityId),
            createdAt: doc.createdAt || new Date(),
            category: doc.category,
            tags: doc.tags || [],
            answers: (doc.answers || []).map(id => id as EntityId),
            thumbnail: doc.thumbnailUrl
              ? {
                  key: doc.thumbnailUrl,
                  url: doc.thumbnailUrl,
                }
              : null,
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
            relatedContents: (doc.relatedContents || []).map(
              id => id as EntityId
            ),
          })
        );

        return {
          data: questions,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: result.limit,
            hasNextPage: result.page < result.totalPages,
            hasPreviousPage: result.page > 1,
          },
        };
      } catch (error: any) {
        throw error;
      }
    })();

    const timeoutPromise = new Promise<PaginatedResponse<IQuestionModel>>(
      (_, reject) => {
        setTimeout(() => {
          reject(new Error('Elasticsearch timeout after 2 seconds'));
        }, ELASTICSEARCH_TIMEOUT);
      }
    );

    try {
      // 2 saniye içinde Elasticsearch'ten cevap gelirse onu kullan
      return await Promise.race([elasticsearchPromise, timeoutPromise]);
    } catch (error: any) {
      // Timeout veya hata durumunda MongoDB'ye fallback
      this.logger.warn(
        'Elasticsearch timeout or error for questions by user, falling back to MongoDB',
        {
          error: error.message,
          userId: String(userId),
        }
      );
      // MongoDB'den pagination ile çek
      const allQuestions = await this.questionRepository.findByUser(userId);
      const skip = (page - 1) * limit;
      const paginatedQuestions = allQuestions.slice(skip, skip + limit);
      const totalPages = Math.ceil(allQuestions.length / limit);

      return {
        data: paginatedQuestions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: allQuestions.length,
          itemsPerPage: limit,
          hasNextPage: skip + limit < allQuestions.length,
          hasPreviousPage: page > 1,
        },
      };
    }
  }

  async getQuestionsByParent(parentId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByParent(parentId);
  }

  private async enrichQuestionsWithParentInfo(
    questions: IQuestionModel[]
  ): Promise<IQuestionModel[]> {
    if (!questions.length) {
      return questions;
    }

    // Collect all parent IDs (questions and answers)
    const parentQuestionIds: EntityId[] = [];
    const parentAnswerIds: EntityId[] = [];

    questions.forEach(question => {
      if (question.parent) {
        if (question.parent.type === ContentType.QUESTION) {
          parentQuestionIds.push(question.parent.id);
        } else if (question.parent.type === ContentType.ANSWER) {
          parentAnswerIds.push(question.parent.id);
        }
      } else if (question.ancestors && question.ancestors.length > 0) {
        // Try to get parent from ancestors (new structure)
        const parent = question.ancestors.find(a => a.depth === 0);
        if (parent) {
          if (parent.type === ContentType.QUESTION) {
            parentQuestionIds.push(parent.id);
          } else if (parent.type === ContentType.ANSWER) {
            parentAnswerIds.push(parent.id);
          }
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

    // Enrich questions with parent content info
    return questions.map(question => {
      let parentId: EntityId | undefined;
      let parentType: ContentType | undefined;

      // Try to get parent from ancestors (new structure)
      if (question.ancestors && question.ancestors.length > 0) {
        const parent = question.ancestors.find(a => a.depth === 0);
        if (parent) {
          parentId = parent.id;
          parentType = parent.type;
        }
      } else if (question.parent) {
        parentId = question.parent.id;
        parentType = question.parent.type;
      }

      if (!parentId || !parentType) {
        return question;
      }

      if (parentType === ContentType.QUESTION) {
        const parentQuestion = parentQuestionMap.get(String(parentId));
        if (parentQuestion) {
          return {
            ...question,
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
        const parentAnswer = parentAnswerMap.get(String(parentId));
        if (parentAnswer) {
          const questionId =
            typeof parentAnswer.question === 'object'
              ? (parentAnswer.question as any)._id?.toString()
              : parentAnswer.question?.toString();
          const answerQuestion = questionId
            ? parentAnswerQuestionMap.get(questionId)
            : null;

          return {
            ...question,
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

      return question;
    });
  }

  async searchQuestions(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'medium',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    excludeQuestionIds?: string[],
    language?: string
  ): Promise<{
    data: IQuestionModel[];
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
      const result = await this.searchClient.search<QuestionSearchDoc>(
        this.questionProjector.indexName,
        this.questionProjector.searchFields,
        searchTerm,
        {
          page,
          limit,
          searchMode,
          matchType,
          typoTolerance,
          smartSearch,
          smartOptions,
          excludeIds: excludeQuestionIds,
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
      const questions = result.hits.map(
        (doc): IQuestionModel => ({
          _id: doc._id as EntityId,
          contentType: ContentType.QUESTION,
          title: doc.title,
          content: doc.content,
          slug: doc.slug,
          category: doc.category,
          tags: doc.tags,
          createdAt: doc.createdAt,
          user: doc.user as EntityId,
          userInfo: doc.userInfo,
          likes: (doc.likes || []).map(id => id as EntityId),
          dislikes: (doc.dislikes || []).map(id => id as EntityId),
          answers: (doc.answers || []).map(id => id as EntityId),
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
          relatedContents: (doc.relatedContents || []).map(
            id => id as EntityId
          ),
          thumbnail:
            doc.thumbnailKey || doc.thumbnailUrl
              ? {
                  key: doc.thumbnailKey || doc.thumbnailUrl || '',
                  url: doc.thumbnailUrl,
                }
              : null,
        })
      );

      // Enrich questions with parent content info (same logic as getQuestionsWithParents)
      const enrichedQuestions =
        await this.enrichQuestionsWithParentInfo(questions);

      return {
        data: enrichedQuestions,
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
      this.logger.warn('Search failed, falling back to MongoDB', {
        error: error.message,
      });
    }

    // Fallback to MongoDB
    const allQuestions =
      await this.questionRepository.searchByTitle(searchTerm);
    const total = allQuestions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private buildQuestionThumbnailDescriptor(
    ownerId: EntityId,
    questionId?: EntityId
  ): ContentAssetDescriptor {
    const resolvedOwnerId = this.resolveEntityId(ownerId);
    const resolvedQuestionId = questionId
      ? this.resolveEntityId(questionId)
      : undefined;

    return {
      type: ContentAssetType.QuestionThumbnail,
      ownerId: resolvedOwnerId,
      entityId: resolvedQuestionId,
      visibility: ContentAssetVisibility.Public,
    };
  }

  private async buildThumbnail(
    key: string,
    descriptor: ContentAssetDescriptor
  ): Promise<IQuestionModel['thumbnail']> {
    // Use public URL for public thumbnails (presignedUrl: false)
    // This ensures permanent URLs that can be cached
    const url = await this.contentAssetService.getAssetUrl(descriptor, key, {
      presignedUrl: false,
    });
    return {
      key,
      url,
    };
  }

  private async deleteThumbnailIfExists(
    question: IQuestionModel
  ): Promise<void> {
    if (!question.thumbnail?.key) {
      return;
    }

    const descriptor = this.buildQuestionThumbnailDescriptor(
      question.user,
      question._id
    );
    await this.safeDeleteAsset(question.thumbnail.key, descriptor);
  }

  private async safeDeleteAsset(
    key: string,
    descriptor: ContentAssetDescriptor
  ): Promise<void> {
    try {
      await this.contentAssetService.deleteAsset({ descriptor, key });
    } catch (error) {
      this.logger.warn('Content asset delete failed', {
        key,
        error,
      });
    }
  }

  private resolveEntityId(value: EntityId | any): string | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object') {
      if ('toString' in value && typeof value.toString === 'function') {
        const str = value.toString();
        if (str !== '[object Object]') {
          return str;
        }
      }
      if ('_id' in value) {
        return String((value as { _id: any })._id);
      }
    }
    return String(value);
  }
}
