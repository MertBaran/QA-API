import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IUserRoleModel } from '../../models/interfaces/IUserRoleModel';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

type UserRoleRow = {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@injectable()
export class UserRolePostgreSQLDataSource implements IDataSource<IUserRoleModel> {
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(row: UserRoleRow): IUserRoleModel {
    return {
      _id: row.id,
      userId: row.userId,
      roleId: row.roleId,
      assignedAt: row.assignedAt,
      assignedBy: row.assignedBy ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(data: Partial<IUserRoleModel>): Promise<IUserRoleModel> {
    const { _id, ...rest } = data;
    const created = await this.prisma.userRole.create({
      data: {
        userId: rest.userId!,
        roleId: rest.roleId!,
        assignedBy: rest.assignedBy ?? null,
        expiresAt: rest.expiresAt ?? null,
        isActive: rest.isActive ?? true,
      },
    });
    return this.toEntity(created);
  }

  async findById(id: string): Promise<IUserRoleModel> {
    const row = await this.prisma.userRole.findUnique({
      where: { id },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    return this.toEntity(row);
  }

  async findAll(): Promise<IUserRoleModel[]> {
    const rows = await this.prisma.userRole.findMany();
    return rows.map((r: UserRoleRow) => this.toEntity(r));
  }

  async updateById(
    id: string,
    data: Partial<IUserRoleModel>
  ): Promise<IUserRoleModel> {
    const { _id, ...rest } = data;
    const updated = await this.prisma.userRole.update({
      where: { id },
      data: {
        ...(rest.userId != null && { userId: rest.userId }),
        ...(rest.roleId != null && { roleId: rest.roleId }),
        ...(rest.assignedBy != null && { assignedBy: rest.assignedBy }),
        ...(rest.expiresAt != null && { expiresAt: rest.expiresAt }),
        ...(rest.isActive != null && { isActive: rest.isActive }),
      },
    });
    return this.toEntity(updated);
  }

  async deleteById(id: string): Promise<IUserRoleModel> {
    const row = await this.prisma.userRole.delete({
      where: { id },
    });
    return this.toEntity(row);
  }

  async findByField(
    field: keyof IUserRoleModel,
    value: string | number | boolean | Date
  ): Promise<IUserRoleModel[]> {
    const where: Prisma.UserRoleWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'userId') where.userId = String(value);
    else if (field === 'roleId') where.roleId = String(value);
    else if (field === 'assignedAt') where.assignedAt = value instanceof Date ? value : new Date(String(value));
    else if (field === 'assignedBy') where.assignedBy = String(value);
    else if (field === 'expiresAt') where.expiresAt = value instanceof Date ? value : new Date(String(value));
    else if (field === 'isActive') where.isActive = Boolean(value);
    const rows = await this.prisma.userRole.findMany({ where });
    return rows.map((r: UserRoleRow) => this.toEntity(r));
  }

  async findByFields(fields: Partial<IUserRoleModel>): Promise<IUserRoleModel[]> {
    const where: Prisma.UserRoleWhereInput = {};
    if (fields._id != null) where.id = String(fields._id);
    if (fields.userId != null) where.userId = fields.userId;
    if (fields.roleId != null) where.roleId = fields.roleId;
    if (fields.isActive != null) where.isActive = fields.isActive;
    const rows = await this.prisma.userRole.findMany({ where });
    return rows.map((r: UserRoleRow) => this.toEntity(r));
  }

  async countAll(): Promise<number> {
    return this.prisma.userRole.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.userRole.deleteMany({});
    return result.count;
  }
}
