import { Request, Response, NextFunction } from "express";
import asyncErrorWrapper from "express-async-handler";
import { injectable, inject } from "tsyringe";
import { IAdminService } from "../services/contracts/IAdminService";
import { AdminConstants } from "./constants/ControllerMessages";
import { IdParamDTO } from "../types/dto/common/id-param.dto";
import type { SuccessResponseDTO } from "../types/dto/common/success-response.dto";
import type { IUserModel } from "../models/interfaces/IUserModel";
import { i18n } from "../types/i18n";

@injectable()
export class AdminController {
  constructor(@inject("AdminService") private adminService: IAdminService) {}

  blockUser = asyncErrorWrapper(
    async (
      req: Request<IdParamDTO>,
      res: Response<SuccessResponseDTO<IUserModel>>,
      _next: NextFunction
    ): Promise<void> => {
      const { id } = req.params as { id: string };
      const updatedUser = await this.adminService.blockUser(id);
      const message = await i18n(AdminConstants.BlockToggleSuccess, req.locale);
      res.status(200).json({
        success: true,
        message,
        data: updatedUser,
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
