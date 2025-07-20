import type { SuccessResponseDTO } from '../common/success-response.dto';
import type { IAnswerModel } from '../../../models/interfaces/IAnswerModel';

export interface EditAnswerResponseDTO
  extends SuccessResponseDTO<IAnswerModel> {
  old_content: string;
}
