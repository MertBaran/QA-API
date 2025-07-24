import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { container } from 'tsyringe';
import CustomError from '../../helpers/error/CustomError';
import { AuthMiddlewareMessages } from '../constants/MiddlewareMessages';
import { IUserRoleService } from '../../services/contracts/IUserRoleService';
import { IRoleService } from '../../services/contracts/IRoleService';
import { IPermissionService } from '../../services/contracts/IPermissionService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
  };
}

// Kullanıcının permission'larını al
async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoleService =
      container.resolve<IUserRoleService>('IUserRoleService');
    const roleService = container.resolve<IRoleService>('IRoleService');
    const permissionService =
      container.resolve<IPermissionService>('IPermissionService');

    // UserRole tablosundan kullanıcının aktif role'lerini al
    let userRoles = await userRoleService.getUserActiveRoles(userId);

    if (userRoles.length === 0) {
      return [];
    }

    // Tüm role'lerin permission'larını al
    const roleIds = userRoles.map(userRole => userRole.roleId);

    const roles = await Promise.all(
      roleIds.map((roleId: string) => roleService.findById(roleId))
    );

    // Aktif role'lerin permission ID'lerini topla
    const permissionIds: string[] = [];
    roles.forEach(role => {
      if (role && role.isActive && role.permissions) {
        role.permissions.forEach((permission: any) => {
          // Permission string ise direkt ekle, obje ise _id'sini al
          if (typeof permission === 'string') {
            permissionIds.push(permission);
          } else if (permission && permission._id) {
            permissionIds.push(permission._id.toString());
          }
        });
      }
    });

    // Permission'ları al
    const permissions = await Promise.all(
      permissionIds.map((permissionId: string) =>
        permissionService.findById(permissionId)
      )
    );

    // Aktif permission'ların name'lerini döndür
    const activePermissions = permissions
      .filter(permission => permission && permission.isActive)
      .map(permission => permission!.name);

    return activePermissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// Belirli bir permission gerektiren middleware
export const requirePermission = (permission: string) => {
  return asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
      }

      const userPermissions = await getUserPermissions(req.user.id);

      if (!userPermissions.includes(permission)) {
        return next(new CustomError('Insufficient permissions', 403));
      }

      next();
    }
  );
};

// Birden fazla permission'dan birini gerektiren middleware
export const requireAnyPermission = (permissions: string[]) => {
  return asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
      }

      const userPermissions = await getUserPermissions(req.user.id);

      const hasAnyPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return next(new CustomError('Insufficient permissions', 403));
      }

      next();
    }
  );
};

// Tüm permission'ları gerektiren middleware
export const requireAllPermissions = (permissions: string[]) => {
  return asyncErrorWrapper(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new CustomError(AuthMiddlewareMessages.Unauthorized, 401));
      }

      const userPermissions = await getUserPermissions(req.user.id);

      const hasAllPermissions = permissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return next(new CustomError('Insufficient permissions', 403));
      }

      next();
    }
  );
};

// Admin permission kontrolü (eski getAdminAccess yerine)
export const requireAdmin = requirePermission('system:admin');
