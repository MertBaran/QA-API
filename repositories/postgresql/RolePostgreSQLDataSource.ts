import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IRoleDataSource } from '../interfaces/IRoleDataSource';
import { IRoleModel } from '../../models/interfaces/IRoleModel';
import { IPermissionModel } from '../../models/interfaces/IPermissionModel';
import { EntityId } from '../../types/database';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';

@injectable()
export class RolePostgreSQLDataSource implements IRoleDataSource {
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(
    row: {
      id: string;
      name: string;
      description: string;
      isSystem: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    permissionIds: string[] = []
  ): IRoleModel {
    return {
      _id: row.id as EntityId,
      name: row.name,
      description: row.description,
      permissions: permissionIds as EntityId[],
      isSystem: row.isSystem,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(data: Partial<IRoleModel>): Promise<IRoleModel> {
    const { _id, permissions, ...rest } = data;
    const created = await this.prisma.role.create({
      data: {
        name: rest.name!,
        description: rest.description!,
        isSystem: rest.isSystem ?? false,
        isActive: rest.isActive ?? true,
      },
    });
    const permIds = (permissions ?? []) as string[];
    if (permIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permIds.map(pid => ({
          roleId: created.id,
          permissionId: pid,
        })),
        skipDuplicates: true,
      });
    }
    return this.toEntity(created, permIds);
  }

  async findById(id: EntityId): Promise<IRoleModel> {
    const row = await this.prisma.role.findUnique({
      where: { id: String(id) },
      include: { permissions: { select: { permissionId: true } } },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_ID_ERROR.en
      );
    }
    const permIds = row.permissions.map((p: { permissionId: string }) => p.permissionId);
    return this.toEntity(row, permIds);
  }

  async findAll(): Promise<IRoleModel[]> {
    const rows = await this.prisma.role.findMany({
      include: { permissions: { select: { permissionId: true } } },
    });
    return rows.map((r: { id: string; name: string; description: string; isSystem: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; permissions: { permissionId: string }[] }) =>
      this.toEntity(r, r.permissions.map((p: { permissionId: string }) => p.permissionId))
    );
  }

  async updateById(
    id: EntityId,
    data: Partial<IRoleModel>
  ): Promise<IRoleModel> {
    const { _id, permissions, ...rest } = data;
    const updated = await this.prisma.role.update({
      where: { id: String(id) },
      data: {
        ...(rest.name != null && { name: rest.name }),
        ...(rest.description != null && { description: rest.description }),
        ...(rest.isSystem != null && { isSystem: rest.isSystem }),
        ...(rest.isActive != null && { isActive: rest.isActive }),
      },
      include: { permissions: { select: { permissionId: true } } },
    });
    const permIds = updated.permissions.map((p: { permissionId: string }) => p.permissionId);
    return this.toEntity(updated, permIds);
  }

  async deleteById(id: EntityId): Promise<IRoleModel> {
    const row = await this.prisma.role.delete({
      where: { id: String(id) },
      include: { permissions: { select: { permissionId: true } } },
    });
    return this.toEntity(row, row.permissions.map((p: { permissionId: string }) => p.permissionId));
  }

  async findByField(
    field: keyof IRoleModel,
    value: string | number | boolean
  ): Promise<IRoleModel[]> {
    const where: Prisma.RoleWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'name') where.name = String(value);
    else if (field === 'description') where.description = String(value);
    else if (field === 'isSystem') where.isSystem = Boolean(value);
    else if (field === 'isActive') where.isActive = Boolean(value);
    const rows = await this.prisma.role.findMany({
      where,
      include: { permissions: { select: { permissionId: true } } },
    });
    return rows.map((r: { id: string; name: string; description: string; isSystem: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; permissions: { permissionId: string }[] }) =>
      this.toEntity(r, r.permissions.map((p: { permissionId: string }) => p.permissionId))
    );
  }

  async findByFields(fields: Partial<IRoleModel>): Promise<IRoleModel[]> {
    const where: Prisma.RoleWhereInput = {};
    if (fields.name != null) where.name = fields.name;
    if (fields.isSystem != null) where.isSystem = fields.isSystem;
    if (fields.isActive != null) where.isActive = fields.isActive;
    const rows = await this.prisma.role.findMany({
      where,
      include: { permissions: { select: { permissionId: true } } },
    });
    return rows.map((r: { id: string; name: string; description: string; isSystem: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; permissions: { permissionId: string }[] }) =>
      this.toEntity(r, r.permissions.map((p: { permissionId: string }) => p.permissionId))
    );
  }

  async findByName(name: string): Promise<IRoleModel> {
    const row = await this.prisma.role.findUnique({
      where: { name },
      include: { permissions: { select: { permissionId: true } } },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(row, row.permissions.map((p: { permissionId: string }) => p.permissionId));
  }

  async findSystemRoles(): Promise<IRoleModel[]> {
    const rows = await this.prisma.role.findMany({
      where: { isSystem: true },
      include: { permissions: { select: { permissionId: true } } },
    });
    return rows.map((r: { id: string; name: string; description: string; isSystem: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; permissions: { permissionId: string }[] }) =>
      this.toEntity(r, r.permissions.map((p: { permissionId: string }) => p.permissionId))
    );
  }

  async findActive(): Promise<IRoleModel[]> {
    const rows = await this.prisma.role.findMany({
      where: { isActive: true },
      include: { permissions: { select: { permissionId: true } } },
    });
    return rows.map((r: { id: string; name: string; description: string; isSystem: boolean; isActive: boolean; createdAt: Date; updatedAt: Date; permissions: { permissionId: string }[] }) =>
      this.toEntity(r, r.permissions.map((p: { permissionId: string }) => p.permissionId))
    );
  }

  async assignPermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: String(roleId),
          permissionId: String(permissionId),
        },
      },
      create: { roleId: String(roleId), permissionId: String(permissionId) },
      update: {},
    });
    return this.findById(roleId);
  }

  async removePermission(
    roleId: EntityId,
    permissionId: EntityId
  ): Promise<IRoleModel> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: String(roleId),
        permissionId: String(permissionId),
      },
    });
    return this.findById(roleId);
  }

  async getPermissionById(permissionId: EntityId): Promise<IPermissionModel | null> {
    const row = await this.prisma.permission.findUnique({
      where: { id: String(permissionId) },
    });
    return row ? this.toPermissionEntity(row) : null;
  }

  async getAllPermissions(): Promise<IPermissionModel[]> {
    const rows = await this.prisma.permission.findMany({
      where: { isActive: true },
    });
    return rows.map((r) => this.toPermissionEntity(r));
  }

  private toPermissionEntity(row: {
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
      category: row.category as IPermissionModel['category'],
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async addPermissionsToRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map(pid => ({
        roleId: String(roleId),
        permissionId: String(pid),
      })),
      skipDuplicates: true,
    });
    return this.findById(roleId);
  }

  async removePermissionsFromRole(
    roleId: EntityId,
    permissionIds: EntityId[]
  ): Promise<IRoleModel> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: String(roleId),
        permissionId: { in: permissionIds.map(String) },
      },
    });
    return this.findById(roleId);
  }

  async countAll(): Promise<number> {
    return this.prisma.role.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.role.deleteMany({});
    return result.count;
  }
}
