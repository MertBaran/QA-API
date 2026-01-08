import { Request, Response, NextFunction } from 'express';
import asyncErrorWrapper from 'express-async-handler';
import { injectable, inject } from 'tsyringe';
import { IAdminService } from '../services/contracts/IAdminService';
import { IUserService } from '../services/contracts/IUserService';
import { IUserRoleService } from '../services/contracts/IUserRoleService';
import { TOKENS } from '../services/TOKENS';
import { IContentAssetService } from '../infrastructure/storage/content/IContentAssetService';
import {
  ContentAssetDescriptor,
  ContentAssetType,
  ContentAssetVisibility,
} from '../infrastructure/storage/content/ContentAssetType';
import { UserConstants } from './constants/ControllerMessages';
import type { SuccessResponseDTO } from '../types/dto/common/success-response.dto';
// IUserModel kullanılmıyor, kaldırıldı
import type { UserResponseDTO } from '../types/dto/user/user-response.dto';
import type { IdParamDTO } from '../types/dto/common/id-param.dto';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import type { AuthenticatedRequest } from '../types/auth';

@injectable()
export class UserController {
  constructor(
    @inject('IAdminService') private adminService: IAdminService,
    @inject('IUserService') private userService: IUserService,
    @inject('IUserRoleService') private userRoleService: IUserRoleService,
    @inject(TOKENS.IContentAssetService)
    private contentAssetService: IContentAssetService
  ) {}

  getSingleUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO>>,
      next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const user = await this.adminService.getSingleUser(id);

      // UserRole tablosundan role'leri çek
      const userRoles = await this.userRoleService.getUserActiveRoles(user._id);
      const roleIds = userRoles.map(userRole => userRole.roleId);

      // Follow bilgilerini hesapla
      const followersCount = user.followers?.length || 0;
      const followingCount = user.following?.length || 0;
      const isFollowing = req.user
        ? user.followers?.some(
            followerId => followerId.toString() === req.user!.id.toString()
          ) || false
        : undefined;

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
        followersCount,
        followingCount,
        isFollowing,
        background_asset_key: user.background_asset_key,
        isGoogleUser: user.isGoogleUser,
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
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<Partial<UserResponseDTO>>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const user = await this.userService.findById(id);

      // Follow bilgilerini hesapla
      const followersCount = user.followers?.length || 0;
      const followingCount = user.following?.length || 0;
      const isFollowing = req.user
        ? user.followers?.some(
            followerId => followerId.toString() === req.user!.id.toString()
          ) || false
        : undefined;

      // Return the key directly, frontend will resolve it to a fresh presigned URL when needed
      // This avoids expire issues with presigned URLs
      const profileImageUrl = user.profile_image;

      // Public profile için sadece gerekli bilgileri döndür
      const publicProfile: Partial<UserResponseDTO> = {
        _id: user._id,
        name: user.name,
        email: user.email, // Public profile'da email de gösterilebilir
        title: user.title,
        about: user.about,
        place: user.place,
        website: user.website,
        profile_image: profileImageUrl,
        createdAt: user.createdAt,
        language: user.language,
        followersCount,
        followingCount,
        isFollowing,
        background_asset_key: user.background_asset_key,
        isGoogleUser: user.isGoogleUser,
      };

      res.status(200).json({ success: true, data: publicProfile });
    }
  );

  followUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<{ message: string }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const followerId = req.user!.id;

      await this.userService.followUser(id, followerId);

      res.status(200).json({
        success: true,
        data: { message: 'User followed successfully' },
      });
    }
  );

  unfollowUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest<IdParamDTO>,
      res: Response<SuccessResponseDTO<{ message: string }>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const followerId = req.user!.id;

      await this.userService.unfollowUser(id, followerId);

      res.status(200).json({
        success: true,
        data: { message: 'User unfollowed successfully' },
      });
    }
  );

  getFollowers = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const followers = await this.userService.getFollowers(id);

      // Her follower için role'leri çek
      const safeFollowers: UserResponseDTO[] = await Promise.all(
        followers.map(async user => {
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

      res.status(200).json({ success: true, data: safeFollowers });
    }
  );

  getFollowing = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<UserResponseDTO[]>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params;
      const following = await this.userService.getFollowing(id);

      // Her following için role'leri çek
      const safeFollowing: UserResponseDTO[] = await Promise.all(
        following.map(async user => {
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

      res.status(200).json({ success: true, data: safeFollowing });
    }
  );
}
