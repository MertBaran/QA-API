import { injectable } from 'tsyringe';
import { IDataSource } from '../interfaces/IDataSource';
import { IContentRelationModel } from '../../models/interfaces/IContentRelationModel';
import { IContentRelationMongo } from '../../models/mongodb/ContentRelationMongoModel';
import { IEntityModel } from '../interfaces/IEntityModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import { ContentType } from '../../types/content/RelationType';

@injectable()
export class ContentRelationMongooseDataSource
  implements IDataSource<IContentRelationModel>
{
  private model: IEntityModel<IContentRelationMongo>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const ContentRelationMongo =
      require('../../models/mongodb/ContentRelationMongoModel').default;
    this.model = ContentRelationMongo;
  }

  private toEntity(mongoDoc: any): IContentRelationModel {
    return {
      _id: mongoDoc._id.toString(),
      sourceContentType: mongoDoc.sourceContentType as ContentType,
      sourceContentId: mongoDoc.sourceContentId.toString(),
      targetContentType: mongoDoc.targetContentType as ContentType,
      targetContentId: mongoDoc.targetContentId.toString(),
      relationType: mongoDoc.relationType as any,
      metadata: mongoDoc.metadata,
      createdAt: mongoDoc.createdAt,
      createdBy: mongoDoc.createdBy?.toString(),
    };
  }

  async create(
    data: Partial<IContentRelationModel>
  ): Promise<IContentRelationModel> {
    const { _id, ...rest } = data;
    const result = await this.model.create(
      rest as unknown as Partial<IContentRelationMongo>
    );
    return this.toEntity(result);
  }

  async findById(id: string): Promise<IContentRelationModel> {
    const result = await this.model.findById(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findAll(): Promise<IContentRelationModel[]> {
    const results = await this.model.find();
    return results.map((doc: any) => this.toEntity(doc));
  }

  async updateById(
    id: string,
    data: Partial<IContentRelationModel>
  ): Promise<IContentRelationModel> {
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(
      id,
      rest as Partial<IContentRelationMongo>,
      { new: true }
    );
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async deleteById(id: string): Promise<IContentRelationModel> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IContentRelationModel,
    value: any
  ): Promise<IContentRelationModel[]> {
    const results = await this.model.find({ [field]: value });
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(
    fields: Partial<IContentRelationModel>
  ): Promise<IContentRelationModel[]> {
    const results = await this.model.find(fields);
    return results.map((doc: any) => this.toEntity(doc));
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments();
  }

  async deleteAll(): Promise<number> {
    const result = await this.model.deleteMany({});
    return result.deletedCount || 0;
  }
}
