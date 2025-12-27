import { injectable } from 'tsyringe';
import { IAnswerModel } from '../../../models/interfaces/IAnswerModel';
import { IProjector } from '../IProjector';
import { AnswerSearchDoc } from '../SearchDocument';
import { container } from 'tsyringe';

/**
 * Answer Entity'den AnswerSearchDoc'a projection yapar
 */
@injectable()
export class AnswerProjector
  implements IProjector<IAnswerModel, AnswerSearchDoc>
{
  readonly indexName = 'answers';
  readonly searchFields = ['content'];

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

  project(entity: IAnswerModel): AnswerSearchDoc {
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
      content: entity.content,
      questionId: String(entity.question),
      userId: String(entity.user),
      userInfo: entity.userInfo,
      likes: entity.likes.map(id => String(id)),
      dislikes: entity.dislikes.map(id => String(id)),
      isAccepted: entity.isAccepted,
      createdAt: entity.createdAt || new Date(),
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
