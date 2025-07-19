import { IUserModel } from "../../models/interfaces/IUserModel";
import { EntityId } from "../../types/database";

export interface IAdminService {
  blockUser(userId: EntityId): Promise<IUserModel>;
  deleteUser(userId: EntityId): Promise<void>;
  getAllUsers(): Promise<IUserModel[]>;
  getSingleUser(userId: EntityId): Promise<IUserModel | null>;
} 