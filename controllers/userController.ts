import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IAdminService } from '../services/contracts/IAdminService';
import { IUserService } from '../services/contracts/IUserService';
import { IUserRoleService } from '../services/contracts/IUserRoleService';
import { UserConstants } from './constants/ControllerMessages';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
// IUserModel kullanılmıyor, kaldırıldı
import type { UserResponseDTO } from '../types/dto/user/user-response.dto';
import type { IdParamDTO } from '../types/dto/common/id-param.dto';
import { ApplicationError } from '../infrastructure/error/ApplicationError';

@injectable()
export class UserController {
  constructor(
    @inject('IAdminService') private adminService: IAdminService,
    @inject('IUserService') private userService: IUserService,
    @inject('IUserRoleService') private userRoleService: IUserRoleService
  ) {}

  getSingleUser = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO>>,
      next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const user = await this.adminService.getSingleUser(id);

      // UserRole tablosundan role'leri çek
      const userRoles = await this.userRoleService.getUserActiveRoles(user._id);
      const roleIds = userRoles.map(userRole => userRole.roleId);

      // Güvenli response - password ve diğer hassas bilgileri çıkar
      const safeUser: UserResponseDTO = {
        _id: user._id,
        name: user.name,
        email: user.email,
        roles: roleIds,
        title: user.title,
        about: user.about,
        place: user.place,
        website: user.website,
        profile_image: user.profile_image,
        blocked: user.blocked,
        createdAt: user.createdAt,
        language: user.language,
        notificationPreferences: user.notificationPreferences,
      };

      res.status(200).json({ success: true, data: safeUser });
    }
  );

  getAllUsers = asyncErrorWrapper(
    async (
      _req: Request,
      res: Response<SuccessResponseDTO<UserResponseDTO[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const users = await this.adminService.getAllUsers();

      // Her user için role'leri çek
      const safeUsers: UserResponseDTO[] = await Promise.all(
        users.map(async user => {
          const userRoles = await this.userRoleService.getUserActiveRoles(
            user._id
          );
          const roleIds = userRoles.map(userRole => userRole.roleId);

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            roles: roleIds,
            title: user.title,
            about: user.about,
            place: user.place,
            website: user.website,
            profile_image: user.profile_image,
            blocked: user.blocked,
            createdAt: user.createdAt,
            language: user.language,
            notificationPreferences: user.notificationPreferences,
          };
        })
      );

      res.status(200).json({ success: true, data: safeUsers });
    }
  );

  getPublicUserProfile = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<Partial<UserResponseDTO>>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const user = await this.userService.findById(id);

      // Public profile için sadece gerekli bilgileri döndür
      const publicProfile: Partial<UserResponseDTO> = {
        _id: user._id,
        name: user.name,
        email: user.email, // Public profile'da email de gösterilebilir
        title: user.title,
        about: user.about,
        place: user.place,
        website: user.website,
        profile_image: user.profile_image,
        createdAt: user.createdAt,
        language: user.language,
      };

      res.status(200).json({ success: true, data: publicProfile });
    }
  );
}
