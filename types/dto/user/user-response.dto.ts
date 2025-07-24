export interface UserResponseDTO {
  _id: string;
  name: string;
  email: string;
  roles: string[]; // Role ID'leri
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  profile_image: string;
  blocked: boolean;
  createdAt?: Date;
  language?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    webhook: boolean;
  };
}
