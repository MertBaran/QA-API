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
import { QuestionSearchDoc } from '../../infrastructure/search/SearchDocument';
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
            views: doc.views,
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
    const question = await this.questionRepository.deleteById(questionId);
    if (!question) {
      throw ApplicationError.notFoundError(
        QuestionServiceMessages.QuestionNotFound.en
      );
    }

    await this.deleteThumbnailIfExists(question);
    await this.cacheProvider.del('questions:all');

    // Delete from index
    await this.indexClient.sync(
      this.questionProjector.indexName,
      'delete',
      String(questionId)
    );

    return question;
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

  async getQuestionsByUser(userId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByUser(userId);
  }

  async getQuestionsByParent(parentId: EntityId): Promise<IQuestionModel[]> {
    return await this.questionRepository.findByParent(parentId);
  }

  async searchQuestions(searchTerm: string): Promise<IQuestionModel[]> {
    if (searchTerm.trim().length === 0) return [];
    try {
      const result = await this.searchClient.search<QuestionSearchDoc>(
        this.questionProjector.indexName,
        this.questionProjector.searchFields,
        searchTerm
      );
      // Elasticsearch'ten gelen SearchDocument'ları direkt Entity'lere dönüştür
      return result.hits.map(
        (doc): IQuestionModel => ({
          _id: doc._id as EntityId,
          contentType: ContentType.QUESTION,
          title: doc.title,
          content: doc.content,
          slug: doc.slug,
          category: doc.category,
          tags: doc.tags,
          views: doc.views,
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
    } catch (error: any) {
      this.logger.warn('Search failed, falling back to MongoDB', {
        error: error.message,
      });
    }

    // Fallback to MongoDB
    return await this.questionRepository.searchByTitle(searchTerm);
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
    const url = await this.contentAssetService.getAssetUrl(descriptor, key);
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
