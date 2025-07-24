export enum AuthMiddlewareMessages {
  Unauthorized = 'You are not authorized to access this route',
  NoAccessToken = 'No access token provided',
  JwtSecretMissing = 'JWT secret key is not set',
  OnlyAdmins = 'Only admins can access this route',
  OwnerOnly = 'Only owner can handle this operation',
  TokenExpired = 'Token expired due to password change',
}

export enum ValidationMiddlewareMessages {
  InvalidId = 'please provide a valid id',
  UnexpectedSyntax = 'Unexpected Syntax',
  InvalidCredentials = 'Please provide a valid email or password',
  DuplicateKey = 'Duplicate Key Found : Check Your Input',
}

export enum DatabaseMiddlewareMessages {
  UserNotFound = 'User not found with this id',
  QuestionNotFound = 'Question not found with this id',
  AnswerNotFound = 'There is no answer with this id associated with question id',
}

export enum UploadMiddlewareMessages {
  InvalidFileType = 'Only jpeg, jpg and png images are allowed!',
}
