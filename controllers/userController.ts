import { Request, Response, NextFunction } from "express";
import asyncErrorWrapper from "express-async-handler";
import { injectable, inject } from "tsyringe";
import { IAdminService } from "../services/contracts/IAdminService";
import { UserConstants } from "./constants/ControllerMessages";
import type { SuccessResponseDTO } from "../types/dto/common/success-response.dto";
import type { IUserModel } from "../models/interfaces/IUserModel";
import type { IdParamDTO } from "../types/dto/common/id-param.dto";
import CustomError from "../helpers/error/CustomError";

@injectable()
export class UserController {
  constructor(@inject("AdminService") private adminService: IAdminService) {}

  getSingleUser = asyncErrorWrapper(async (req: Request<IdParamDTO>, res: Response<SuccessResponseDTO<IUserModel>>, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const user = await this.adminService.getSingleUser(id);
    if (!user) {
      return next(new CustomError(UserConstants.UserNotFound.en, 404));
    }
    res.status(200).json({ success: true, data: user });
  });

  getAllUsers = asyncErrorWrapper(async (_req: Request, res: Response<SuccessResponseDTO<IUserModel[]>>, _next: NextFunction): Promise<void> => {
    const users = await this.adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  });
}

