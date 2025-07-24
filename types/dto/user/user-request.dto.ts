// User oluşturma için request DTO
export interface CreateUserRequestDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId?: string;
  language?: string;
}

// User güncelleme için request DTO
export interface UpdateUserRequestDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  language?: string;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    webhook?: boolean;
  };
}

// User profil resmi güncelleme için request DTO
export interface UpdateUserProfileImageRequestDTO {
  profileImage: string;
}

// User şifre sıfırlama için request DTO
export interface ResetPasswordRequestDTO {
  token: string;
  newPassword: string;
}

// User şifre unutma için request DTO
export interface ForgotPasswordRequestDTO {
  email: string;
  locale?: string;
}

// User giriş için request DTO
export interface LoginUserRequestDTO {
  email: string;
  password: string;
}

// Google ile giriş için request DTO
export interface GoogleLoginRequestDTO {
  token: string;
}

// User ID parametresi için DTO
export interface UserIdParamDTO {
  userId: string;
}
