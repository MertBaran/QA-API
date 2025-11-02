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
    };
  }
}
