import type { SuccessResponseDTO } from '../common/success-response.dto';
import type { IUserModel } from '../../../models/interfaces/IUserModel';

export interface AuthTokenResponseDTO extends SuccessResponseDTO<IUserModel> {
  access_token: string;
}
