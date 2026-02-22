import { injectable } from 'tsyringe';
import { Prisma, type PermissionCategory } from '.prisma/client';
import { IPermissionDataSource } from '../interfaces/IPermissionDataSource';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class PermissionPostgreSQLDataSource implements IPermissionDataSource {
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(row: {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    category: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): IPermissionModel {
    return {
      _id: row.id as EntityId,
      name: row.name,
      description: row.description,
      resource: row.resource,
      action: row.action,
      category: row.category as 'content' | 'user' | 'system',
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(data: Partial<IPermissionModel>): Promise<IPermissionModel> {
    const { _id, ...rest } = data;
    const created = await this.prisma.permission.create({
      data: {
        name: rest.name!,
        description: rest.description!,
        resource: rest.resource!,
        action: rest.action!,
        category: (rest.category as 'content' | 'user' | 'system') ?? 'content',
        isActive: rest.isActive ?? true,
      },
    });
    return this.toEntity(created);
  }

  async findById(id: EntityId): Promise<IPermissionModel> {
    const row = await this.prisma.permission.findUnique({
      where: { id: String(id) },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(row);
  }

  async findAll(): Promise<IPermissionModel[]> {
    const rows = await this.prisma.permission.findMany();
    return rows.map(r => this.toEntity(r));
  }

  async updateById(
    id: EntityId,
    data: Partial<IPermissionModel>
  ): Promise<IPermissionModel> {
    const { _id, ...rest } = data;
    const updated = await this.prisma.permission.update({
      where: { id: String(id) },
      data: {
        ...(rest.name != null && { name: rest.name }),
        ...(rest.description != null && { description: rest.description }),
        ...(rest.resource != null && { resource: rest.resource }),
        ...(rest.action != null && { action: rest.action }),
        ...(rest.category != null && { category: rest.category as 'content' | 'user' | 'system' }),
        ...(rest.isActive != null && { isActive: rest.isActive }),
      },
    });
    return this.toEntity(updated);
  }

  async deleteById(id: EntityId): Promise<IPermissionModel> {
    const row = await this.prisma.permission.delete({
      where: { id: String(id) },
    });
    return this.toEntity(row);
  }

  async findByField(
    field: keyof IPermissionModel,
    value: string | number | boolean
  ): Promise<IPermissionModel[]> {
    const where: Prisma.PermissionWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'name') where.name = String(value);
    else if (field === 'description') where.description = String(value);
    else if (field === 'resource') where.resource = String(value);
    else if (field === 'action') where.action = String(value);
    else if (field === 'category') where.category = value as PermissionCategory;
    else if (field === 'isActive') where.isActive = Boolean(value);
    const rows = await this.prisma.permission.findMany({ where });
    return rows.map(r => this.toEntity(r));
  }

  async findByFields(fields: Partial<IPermissionModel>): Promise<IPermissionModel[]> {
    const where: Prisma.PermissionWhereInput = {};
    if (fields._id != null) where.id = String(fields._id);
    if (fields.name != null) where.name = fields.name;
    if (fields.resource != null) where.resource = fields.resource;
    if (fields.action != null) where.action = fields.action;
    if (fields.category != null) where.category = fields.category as PermissionCategory;
    if (fields.isActive != null) where.isActive = fields.isActive;
    const rows = await this.prisma.permission.findMany({ where });
    return rows.map(r => this.toEntity(r));
  }

  async findByName(name: string): Promise<IPermissionModel> {
    const row = await this.prisma.permission.findUnique({
      where: { name },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(row);
  }

  async findByResource(resource: string): Promise<IPermissionModel[]> {
    const rows = await this.prisma.permission.findMany({
      where: { resource },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findByCategory(category: string): Promise<IPermissionModel[]> {
    const rows = await this.prisma.permission.findMany({
      where: { category: category as 'content' | 'user' | 'system' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findActive(): Promise<IPermissionModel[]> {
    const rows = await this.prisma.permission.findMany({
      where: { isActive: true },
    });
    return rows.map(r => this.toEntity(r));
  }

  async countAll(): Promise<number> {
    return this.prisma.permission.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.permission.deleteMany({});
    return result.count;
  }
}
