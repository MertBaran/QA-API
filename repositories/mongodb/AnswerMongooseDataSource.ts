import { injectable } from 'tsyringe';
import { IEntityModel } from '../interfaces/IEntityModel';
import { IAnswerModel } from '../../models/interfaces/IAnswerModel';
import { ContentType } from '../../types/content/RelationType';
import {
  ParentReference,
  AncestorReference,
} from '../../types/content/IContent';
import { IDataSource } from '../interfaces/IDataSource';
import { IAnswerMongo } from '../../models/mongodb/AnswerMongoModel';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class AnswerMongooseDataSource implements IDataSource<IAnswerModel> {
  private model: IEntityModel<IAnswerMongo>;

  constructor() {
    // Import dynamically to avoid circular dependency
    const AnswerMongo =
      require('../../models/mongodb/AnswerMongoModel').default;
    this.model = AnswerMongo;
  }

  private toEntity(mongoDoc: any): IAnswerModel {
    // User bilgisini kontrol et - populate edilmiş mi?
    const userInfo =
      mongoDoc.user && typeof mongoDoc.user === 'object'
        ? {
            _id: mongoDoc.user._id.toString(),
            name: mongoDoc.user.name,
            email: mongoDoc.user.email,
            profile_image: mongoDoc.user.profile_image,
          }
        : {
            _id: mongoDoc.user.toString(),
            name: 'Anonim',
            email: '',
            profile_image: '',
          };

    const questionDoc = mongoDoc.question;
    const questionId =
      questionDoc && questionDoc._id
        ? questionDoc._id.toString()
        : questionDoc
          ? questionDoc.toString()
          : '';
    const questionInfo =
      questionDoc && questionDoc.title
        ? {
            _id: questionId,
            title: questionDoc.title,
            slug: questionDoc.slug,
          }
        : undefined;

    return {
      _id: mongoDoc._id.toString(),
      contentType: ContentType.ANSWER,
      content: mongoDoc.content,
      user: userInfo._id,
      userInfo,
      question: questionId,
      questionInfo,
      likes: Array.isArray(mongoDoc.likes)
        ? mongoDoc.likes.map((like: any) =>
            like && like._id ? like._id.toString() : like.toString()
          )
        : [],
      dislikes: Array.isArray(mongoDoc.dislikes)
        ? mongoDoc.dislikes.map((dislike: any) =>
            dislike && dislike._id ? dislike._id.toString() : dislike.toString()
          )
        : [],
      isAccepted: mongoDoc.isAccepted ?? false,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
      parent:
        mongoDoc.parent && mongoDoc.parent.id && mongoDoc.parent.type
          ? ({
              id: String(mongoDoc.parent.id),
              type: mongoDoc.parent.type as ContentType,
            } as ParentReference)
          : undefined,
      ancestors: mongoDoc.ancestors
        ? (mongoDoc.ancestors.map((ancestor: any) => ({
            id: String(ancestor.id),
            type: ancestor.type as ContentType,
            depth: ancestor.depth,
          })) as AncestorReference[])
        : undefined,
      relatedContents: Array.isArray(mongoDoc.relatedContents)
        ? mongoDoc.relatedContents.map((content: any) =>
            content && content._id ? content._id.toString() : content.toString()
          )
        : [],
    };
  }

  async create(data: Partial<IAnswerModel>): Promise<IAnswerModel> {
    // Omit _id to avoid type conflict
    const { _id, ...rest } = data;
    const result = await this.model.create(rest as Partial<IAnswerMongo>);
    // Populate user info for immediate use
    const populatedResult = await (this.model as any)
      .findById(result._id)
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug');
    return this.toEntity(populatedResult);
  }

  async findById(id: string): Promise<IAnswerModel> {
    const result = await (this.model as any)
      .findById(id)
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug');
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.ANSWER.NOT_FOUND.en
      );
    }
    const entity = this.toEntity(result);
    return entity;
  }

  async findAll(): Promise<IAnswerModel[]> {
    const results = await this.model
      .find()
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug');
    const entities = results.map((doc: any) => this.toEntity(doc));
    return entities;
  }

  async updateById(
    id: string,
    data: Partial<IAnswerModel>
  ): Promise<IAnswerModel> {
    // Omit _id to avoid type conflict
    const { _id, ...rest } = data;
    const result = await this.model.findByIdAndUpdate(
      id,
      rest as Partial<IAnswerMongo>,
      { new: true }
    );
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.ANSWER.UPDATE_BY_ID_NOT_FOUND.en
      );
    }
    // Populate user info for immediate use
    const populatedResult = await (this.model as any)
      .findById(result._id)
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug');
    const entity = this.toEntity(populatedResult);
    return entity;
  }

  async deleteById(id: string): Promise<IAnswerModel> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.ANSWER.DELETE_BY_ID_NOT_FOUND.en
      );
    }
    return this.toEntity(result);
  }

  async findByField(
    field: keyof IAnswerModel,
    value: any
  ): Promise<IAnswerModel[]> {
    const results = await this.model
      .find({ [field]: value })
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug')
      .sort({ createdAt: -1 }); // Sort by createdAt descending (newest first)
    return results.map((doc: any) => this.toEntity(doc));
  }

  async findByFields(fields: Partial<IAnswerModel>): Promise<IAnswerModel[]> {
    const results = await this.model
      .find(fields)
      .populate('user', 'name email profile_image')
      .populate('question', 'title slug');
    return results.map((doc: any) => this.toEntity(doc));
  }

  async countAll(): Promise<number> {
    return this.model.countDocuments();
  }

  async deleteAll(): Promise<any> {
    return this.model.deleteMany({});
  }
}
