export const PERMISSIONS = {
  // Questions
  QUESTIONS_CREATE: 'questions:create',
  QUESTIONS_READ: 'questions:read',
  QUESTIONS_UPDATE: 'questions:update',
  QUESTIONS_DELETE: 'questions:delete',
  QUESTIONS_MODERATE: 'questions:moderate',

  // Answers
  ANSWERS_CREATE: 'answers:create',
  ANSWERS_READ: 'answers:read',
  ANSWERS_UPDATE: 'answers:update',
  ANSWERS_DELETE: 'answers:delete',

  // Users
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // System
  SYSTEM_ADMIN: 'system:admin',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Varsayılan roller
export const DEFAULT_ROLES = {
  USER: {
    name: 'user',
    description: 'Basic user permissions',
    permissions: [
      PERMISSIONS.QUESTIONS_CREATE,
      PERMISSIONS.QUESTIONS_READ,
      PERMISSIONS.ANSWERS_CREATE,
      PERMISSIONS.ANSWERS_READ,
    ],
  },
  MODERATOR: {
    name: 'moderator',
    description: 'Can moderate content',
    permissions: [
      PERMISSIONS.QUESTIONS_CREATE,
      PERMISSIONS.QUESTIONS_READ,
      PERMISSIONS.ANSWERS_CREATE,
      PERMISSIONS.ANSWERS_READ,
      PERMISSIONS.QUESTIONS_MODERATE,
      PERMISSIONS.ANSWERS_DELETE,
      PERMISSIONS.USERS_READ,
    ],
  },
  ADMIN: {
    name: 'admin',
    description: 'Full system access',
    permissions: [PERMISSIONS.SYSTEM_ADMIN],
  },
} as const;
