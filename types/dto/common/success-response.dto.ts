export type EmptyObject = Record<string, never>;

export interface SuccessResponseDTO<T = EmptyObject> {
  success: true;
  message?: string;
  data?: T;
}
