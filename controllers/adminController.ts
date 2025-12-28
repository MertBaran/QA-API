import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IAdminService } from '../services/contracts/IAdminService';
import { ApplicationError } from '../infrastructure/error/ApplicationError';
import { asyncErrorWrapper } from '../infrastructure/error/asyncErrorWrapper';
import { AuthenticatedRequest } from '../types/auth';
import { ISemanticSearchService } from '../infrastructure/search/ISemanticSearchService';

export class AdminController {
  private adminService: IAdminService;
  private semanticSearchService?: ISemanticSearchService;

  constructor() {
    this.adminService = container.resolve<IAdminService>('IAdminService');
    try {
      this.semanticSearchService = container.resolve<ISemanticSearchService>(
        'ISemanticSearchService'
      );
    } catch (error) {
      // Semantic search service optional
    }
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

      const result = await this.adminService.getUsersForAdmin(
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

      const updatedUser = await this.adminService.updateUserByAdmin(
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

      await this.adminService.deleteUserByAdmin(userId as string);

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

      const updatedUser = await this.adminService.toggleUserBlock(
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

      const updatedUser = await this.adminService.updateUserRoles(
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

      const stats = await this.adminService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    }
  );

  // ELSER model durumunu kontrol et
  checkElserModelStatus = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      if (
        !this.semanticSearchService ||
        !('isModelDeployed' in this.semanticSearchService)
      ) {
        res.status(200).json({
          success: true,
          data: {
            deployed: false,
            message: 'Semantic search service not available',
          },
        });
        return;
      }

      const elserService = this.semanticSearchService as any;
      const isDeployed = await elserService.isModelDeployed();

      res.status(200).json({
        success: true,
        data: {
          deployed: isDeployed,
          modelId: '.elser_model_2',
          message: isDeployed
            ? 'ELSER model is deployed and ready for semantic search'
            : 'ELSER model is not deployed. Please download and deploy it first.',
        },
      });
    }
  );

  // ELSER model'ini deploy et
  deployElserModel = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      if (
        !this.semanticSearchService ||
        !('deployModel' in this.semanticSearchService)
      ) {
        throw ApplicationError.businessError(
          'Semantic search service not available',
          400
        );
      }

      const elserService = this.semanticSearchService as any;

      try {
        await elserService.deployModel();
        res.status(200).json({
          success: true,
          message: 'ELSER model deployed successfully',
          data: {
            modelId: '.elser_model_2',
            deployed: true,
          },
        });
      } catch (error: any) {
        if (
          error.message?.includes('not found') ||
          error.message?.includes('download')
        ) {
          res.status(400).json({
            success: false,
            message: 'ELSER model not found. Please download it first.',
            error: error.message,
            hint: 'Download the model using: POST http://localhost:9200/_ml/trained_models/.elser_model_2/_download',
          });
        } else {
          throw error;
        }
      }
    }
  );

  // ELSER model'ini indir
  downloadElserModel = asyncErrorWrapper(
    async (
      req: AuthenticatedRequest,
      res: Response,
      _next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        throw ApplicationError.authenticationError('User not authenticated');
      }

      if (
        !this.semanticSearchService ||
        !('downloadModel' in this.semanticSearchService)
      ) {
        throw ApplicationError.businessError(
          'Semantic search service not available',
          400
        );
      }

      const elserService = this.semanticSearchService as any;

      try {
        await elserService.downloadModel();
        res.status(200).json({
          success: true,
          message: 'ELSER model download initiated successfully',
          data: {
            modelId: '.elser_model_2',
            note: 'Model download may take several minutes. Check status with GET /api/admin/elser/status',
          },
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          message: 'Failed to download ELSER model',
          error: error.message,
          hint: 'You can download manually using: curl -X POST "http://localhost:9200/_ml/trained_models/.elser_model_2/_download"',
        });
      }
    }
  );
}
