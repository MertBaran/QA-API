import { IContentRelationModel } from '../../models/interfaces/IContentRelationModel';
import { EntityId } from '../../types/database';
import { ContentType } from '../../types/content/RelationType';
import { IDataSource } from './IDataSource';

export interface IContentRelationDataSource extends IDataSource<IContentRelationModel> {
  findBySourceIds(
    contentType: ContentType,
    contentIds: EntityId[]
  ): Promise<IContentRelationModel[]>;
}
