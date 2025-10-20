import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AdminManager } from '../services/managers/AdminManager';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { IExceptionTracker } from '../infrastructure/error/IExceptionTracker';
import { ApplicationError } from '../helpers/error/ApplicationError';
import { asyncErrorWrapper } from '../helpers/error/asyncErrorWrapper';
import { AuthenticatedRequest } from '../types/auth';

export class AdminController {
  private adminManager: AdminManager;
  private logger: ILoggerProvider;
  private exceptionTracker: IExceptionTracker;

  constructor() {
    this.adminManager = container.resolve<AdminManager>('IAdminService');
    this.logger = container.resolve<ILoggerProvider>('ILoggerProvider');
    this.exceptionTracker =
      container.resolve<IExceptionTracker>('IExceptionTracker');
  }

  // Kullanıcıları getir
  getUsers = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const {
        search,
        status,
        role,
        dateFrom,
        dateTo,
        isOnline,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = {
        search: search as string,
        status: status as string,
        role: role as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        isOnline: isOnline === 'true',
      };

      const result = await this.adminManager.getUsersForAdmin(
        filters,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  // Kullanıcı güncelle
  updateUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const { userId } = req.params;
      const userData = req.body;

      const updatedUser = await this.adminManager.updateUserByAdmin(
        userId as string,
        userData
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    }
  );

  // Kullanıcı sil
  deleteUser = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const { userId } = req.params;

      await this.adminManager.deleteUserByAdmin(userId as string);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    }
  );

  // Kullanıcı engelle/engel kaldır
  toggleUserBlock = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const { userId } = req.params;
      const { blocked } = req.body;

      const updatedUser = await this.adminManager.toggleUserBlock(
        userId as string,
        blocked
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    }
  );

  // Kullanıcı rollerini güncelle
  updateUserRoles = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const { userId } = req.params;
      const { roles } = req.body;

      const updatedUser = await this.adminManager.updateUserRoles(
        userId as string,
        roles
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    }
  );

  // Kullanıcı istatistikleri
  getUserStats = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      const stats = await this.adminManager.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    }
  );
}
