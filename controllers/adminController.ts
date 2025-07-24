import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IAdminService } from '../services/contracts/IAdminService';
import { IUserRoleService } from '../services/contracts/IUserRoleService';
import { AdminConstants } from './constants/ControllerMessages';
import { IdParamDTO } from '../types/dto/common/id-param.dto';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
// IUserModel kullanılmıyor, kaldırıldı
import type { UserResponseDTO } from '../types/dto/user/user-response.dto';
import { i18n } from '../types/i18n';

@injectable()
export class AdminController {
  constructor(
    @inject('IAdminService') private adminService: IAdminService,
    @inject('IUserRoleService') private userRoleService: IUserRoleService
  ) {}

  blockUser = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params as { id: string };
      const updatedUser = await this.adminService.blockUser(id);
      const message = await i18n(AdminConstants.BlockToggleSuccess, req.locale);

      // UserRole tablosundan role'leri çek
      const userRoles = await this.userRoleService.getUserActiveRoles(
        updatedUser._id
      );
      const roleIds = userRoles.map(userRole => userRole.roleId);

      // Güvenli response - password ve diğer hassas bilgileri çıkar
      const safeUser: UserResponseDTO = {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: roleIds,
        title: updatedUser.title,
        about: updatedUser.about,
        place: updatedUser.place,
        website: updatedUser.website,
        profile_image: updatedUser.profile_image,
        blocked: updatedUser.blocked,
        createdAt: updatedUser.createdAt,
        language: updatedUser.language,
        notificationPreferences: updatedUser.notificationPreferences,
      };

      res.status(200).json({
        success: true,
        message,
        data: safeUser,
      });
    }
  );

  deleteUser = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      await this.adminService.deleteUser(id);
      const message = await i18n(AdminConstants.DeleteSuccess, req.locale);
      res.status(200).json({
        success: true,
        message,
      });
    }
  );
}
