export interface UploadImageResponseDTO {
  success: boolean;
  message: string;
  data: {
    profile_image: string;
  };
}
