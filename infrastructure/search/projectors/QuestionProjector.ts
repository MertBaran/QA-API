import { injectable } from 'tsyringe';
import { IQuestionModel } from '../../../models/interfaces/IQuestionModel';
import { IProjector } from '../IProjector';
import { QuestionSearchDoc } from '../SearchDocument';
import { container } from 'tsyringe';

/**
 * Question Entity'den QuestionSearchDoc'a projection yapar
 */
@injectable()
export class QuestionProjector
  implements IProjector<IQuestionModel, QuestionSearchDoc>
{
  readonly indexName = 'questions';
  readonly searchFields = ['title', 'content', 'tags'];

  constructor() {
    // Self-register: Bu projector oluşturulduğunda index'ini register et
    this.registerIndex();
  }

  private registerIndex(): void {
    // SearchClient'ı resolve et ve index'i register et
    try {
      const searchClient = container.resolve<any>('ISearchClient');
      if (searchClient && typeof searchClient.registerIndex === 'function') {
        searchClient.registerIndex(this.indexName, this.searchFields);
      }
    } catch (error) {
      // Container henüz hazır değilse, bu normal
      // Index registration daha sonra yapılacak
    }
  }

  project(entity: IQuestionModel): QuestionSearchDoc {
    // Extract ancestor IDs and types from ancestors array
    const ancestorsIds = entity.ancestors?.map(a => String(a.id)) || [];
    const ancestorsTypes = entity.ancestors?.map(a => a.type) || [];
    const rootId =
      entity.ancestors && entity.ancestors.length > 0
        ? String(entity.ancestors[entity.ancestors.length - 1]?.id || '')
        : undefined;
    const depth = entity.ancestors?.length || 0;

    return {
      _id: String(entity._id),
      title: entity.title,
      content: entity.content,
      slug: entity.slug,
      category: entity.category,
      tags: entity.tags,
      createdAt: entity.createdAt,
      user: String(entity.user),
      userInfo: entity.userInfo,
      likes: entity.likes.map(id => String(id)),
      dislikes: entity.dislikes.map(id => String(id)),
      answers: entity.answers.map(id => String(id)),
      relatedContents: (entity.relatedContents || []).map(id => String(id)),
      thumbnailUrl: entity.thumbnail?.url,
      thumbnailKey: entity.thumbnail?.key,
      parent: entity.parent
        ? {
            id: String(entity.parent.id),
            type: entity.parent.type,
          }
        : undefined,
      ancestorsIds,
      ancestorsTypes,
      rootId,
      depth,
    };
  }
}
