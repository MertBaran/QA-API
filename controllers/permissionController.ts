import { Request, Response } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { IUserRoleService } from '../services/contracts/IUserRoleService';
import { IRoleService } from '../services/contracts/IRoleService';
import { IUserService } from '../services/contracts/IUserService';
import CustomError from '../helpers/error/CustomError';
import { PermissionConstants } from './constants/ControllerMessages';
import {
  AssignRoleRequestDTO,
  RemoveRoleRequestDTO,
  AddPermissionsToRoleRequestDTO,
  RemovePermissionsFromRoleRequestDTO,
  UserIdParamDTO,
} from '../types/dto/permission/permission-request.dto';
import {
  AssignRoleResponseDTO,
  RemoveRoleResponseDTO,
  UserRolesResponseDTO,
  AllRolesResponseDTO,
  AllPermissionsResponseDTO,
  AddPermissionsToRoleResponseDTO,
  RemovePermissionsFromRoleResponseDTO,
  UserPermissionsResponseDTO,
} from '../types/dto/permission/permission-response.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
  body: any;
  params: any;
}

export class PermissionController {
  constructor(
    private userRoleService: IUserRoleService,
    private roleService: IRoleService,
    private userService: IUserService
  ) {}

  // Kullanıcıya role ata
  assignRoleToUser = async (
    req: AuthenticatedRequest & { body: AssignRoleRequestDTO },
    res: Response<AssignRoleResponseDTO>
  ) => {
    const { userId, roleId, assignedBy } = req.body;
    const adminUserId = req.user?.id;

    // Kullanıcının var olup olmadığını kontrol et
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new CustomError(PermissionConstants.UserNotFound.en, 404);
    }

    // Role'ün var olup olmadığını kontrol et
    const role = await this.roleService.findById(roleId);
    if (!role) {
      throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
    }

    // Role'ün aktif olup olmadığını kontrol et
    if (!role.isActive) {
      throw new CustomError(PermissionConstants.RoleNotActive.en, 400);
    }

    // Kullanıcıya role ata
    const userRole = await this.userRoleService.assignRoleToUser(
      userId,
      roleId,
      assignedBy || adminUserId || ''
    );

    res.status(201).json({
      success: true,
      message: PermissionConstants.RoleAssignedSuccess.en,
      data: {
        userRole: {
          id: userRole._id,
          userId: userRole.userId,
          roleId: userRole.roleId,
          isActive: userRole.isActive,
          assignedBy: userRole.assignedBy || '',
          assignedAt: userRole.assignedAt,
        },
      },
    });
  };

  // Kullanıcıdan role kaldır
  removeRoleFromUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest & { body: RemoveRoleRequestDTO },
      res: Response<RemoveRoleResponseDTO>
    ): Promise<void> => {
      const { userId, roleId } = req.body;

      // Kullanıcının var olup olmadığını kontrol et
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new CustomError(PermissionConstants.UserNotFound.en, 404);
      }

      // Role'ün var olup olmadığını kontrol et
      const role = await this.roleService.findById(roleId);
      if (!role) {
        throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
      }

      // Kullanıcıdan role'ü kaldır
      const removedUserRole = await this.userRoleService.removeRoleFromUser(
        userId,
        roleId
      );

      if (!removedUserRole) {
        throw new CustomError(PermissionConstants.UserDoesNotHaveRole.en, 404);
      }

      res.status(200).json({
        success: true,
        message: PermissionConstants.RoleRemovedSuccess.en,
        data: {
          removedUserRole: {
            id: removedUserRole._id,
            userId: removedUserRole.userId,
            roleId: removedUserRole.roleId,
          },
        },
      });
    }
  );

  // Kullanıcının mevcut role'lerini getir
  getUserRoles = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest & { params: UserIdParamDTO },
      res: Response<UserRolesResponseDTO>
    ): Promise<void> => {
      const { userId } = req.params;

      // Kullanıcının var olup olmadığını kontrol et
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new CustomError(PermissionConstants.UserNotFound.en, 404);
      }

      // Kullanıcının tüm role'lerini al
      const userRoles = await this.userRoleService.getUserRoles(userId);

      // Role detaylarını al
      const rolesWithDetails = await Promise.all(
        userRoles.map(async userRole => {
          const role = await this.roleService.findById(userRole.roleId);
          return {
            userRoleId: userRole._id,
            roleId: userRole.roleId,
            roleName: role?.name || 'Unknown Role',
            roleDescription: role?.description || '',
            isActive: userRole.isActive,
            assignedBy: userRole.assignedBy || '',
            assignedAt: userRole.assignedAt,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          userName: user.name,
          userEmail: user.email,
          roles: rolesWithDetails,
        },
      });
    }
  );

  // Tüm role'leri listele
  getAllRoles = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<AllRolesResponseDTO>
    ): Promise<void> => {
      const roles = await this.roleService.findAll();

      const rolesWithPermissions = await Promise.all(
        roles.map(async role => {
          const permissions = await Promise.all(
            (role.permissions || []).map(async (permissionId: any) => {
              const permission = await this.roleService.getPermissionById(
                typeof permissionId === 'string'
                  ? permissionId
                  : permissionId._id
              );
              return permission
                ? {
                    id: permission._id,
                    name: permission.name,
                    description: permission.description,
                    resource: permission.resource,
                    action: permission.action,
                  }
                : null;
            })
          );

          return {
            id: role._id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            permissions: permissions.filter(p => p !== null),
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          roles: rolesWithPermissions,
        },
      });
    }
  );

  // Tüm permission'ları listele
  getAllPermissions = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response<AllPermissionsResponseDTO>
    ): Promise<void> => {
      const permissions = await this.roleService.getAllPermissions();

      res.status(200).json({
        success: true,
        data: {
          permissions: permissions.map(permission => ({
            id: permission._id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            category: permission.category,
            isActive: permission.isActive,
          })),
        },
      });
    }
  );

  // Role'e permission ekle
  addPermissionsToRole = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest & { body: AddPermissionsToRoleRequestDTO },
      res: Response<AddPermissionsToRoleResponseDTO>
    ): Promise<void> => {
      const { roleId, permissionIds } = req.body;

      // Role'ün var olup olmadığını kontrol et
      const role = await this.roleService.findById(roleId);
      if (!role) {
        throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
      }

      // Permission'ların var olup olmadığını kontrol et
      const permissions = await Promise.all(
        permissionIds.map((permissionId: string) =>
          this.roleService.getPermissionById(permissionId)
        )
      );

      const invalidPermissions = permissions.filter(p => !p);
      if (invalidPermissions.length > 0) {
        throw new CustomError(
          PermissionConstants.SomePermissionsNotFound.en,
          404
        );
      }

      // Role'e permission'ları ekle
      const updatedRole = await this.roleService.addPermissionsToRole(
        roleId,
        permissionIds
      );

      if (!updatedRole) {
        throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
      }

      res.status(200).json({
        success: true,
        message: PermissionConstants.PermissionsAddedToRoleSuccess.en,
        data: {
          role: {
            id: updatedRole._id,
            name: updatedRole.name,
            permissionsCount: updatedRole.permissions?.length || 0,
          },
        },
      });
    }
  );

  // Role'den permission kaldır
  removePermissionsFromRole = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest & { body: RemovePermissionsFromRoleRequestDTO },
      res: Response<RemovePermissionsFromRoleResponseDTO>
    ): Promise<void> => {
      const { roleId, permissionIds } = req.body;

      // Role'ün var olup olmadığını kontrol et
      const role = await this.roleService.findById(roleId);
      if (!role) {
        throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
      }

      // Role'den permission'ları kaldır
      const updatedRole = await this.roleService.removePermissionsFromRole(
        roleId,
        permissionIds
      );

      if (!updatedRole) {
        throw new CustomError(PermissionConstants.RoleNotFound.en, 404);
      }

      res.status(200).json({
        success: true,
        message: PermissionConstants.PermissionsRemovedFromRoleSuccess.en,
        data: {
          role: {
            id: updatedRole._id,
            name: updatedRole.name,
            permissionsCount: updatedRole.permissions?.length || 0,
          },
        },
      });
    }
  );

  // Kullanıcının permission'larını getir
  getUserPermissions = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest & { params: UserIdParamDTO },
      res: Response<UserPermissionsResponseDTO>
    ): Promise<void> => {
      const { userId } = req.params;

      // Kullanıcının var olup olmadığını kontrol et
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new CustomError(PermissionConstants.UserNotFound.en, 404);
      }

      // Kullanıcının aktif role'lerini al
      const userRoles = await this.userRoleService.getUserActiveRoles(userId);

      // Role'lerin permission'larını topla
      const allPermissions = new Set<string>();

      for (const userRole of userRoles) {
        const role = await this.roleService.findById(userRole.roleId);
        if (role && role.isActive && role.permissions) {
          role.permissions.forEach((permissionId: any) => {
            const permissionIdStr =
              typeof permissionId === 'string'
                ? permissionId
                : permissionId._id;
            allPermissions.add(permissionIdStr);
          });
        }
      }

      // Permission detaylarını al
      const permissions = await Promise.all(
        Array.from(allPermissions).map(async permissionId => {
          const permission =
            await this.roleService.getPermissionById(permissionId);
          return permission
            ? {
                id: permission._id,
                name: permission.name,
                description: permission.description,
                resource: permission.resource,
                action: permission.action,
                category: permission.category,
              }
            : null;
        })
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          userName: user.name,
          userEmail: user.email,
          permissions: permissions.filter(p => p !== null),
        },
      });
    }
  );
}
