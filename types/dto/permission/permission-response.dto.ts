// Role atama response DTO
export interface AssignRoleResponseDTO {
  success: boolean;
  message: string;
  data: {
    userRole: {
      id: string;
      userId: string;
      roleId: string;
      isActive: boolean;
      assignedBy: string;
      assignedAt: Date;
    };
  };
}

// Role kaldırma response DTO
export interface RemoveRoleResponseDTO {
  success: boolean;
  message: string;
  data: {
    removedUserRole: {
      id: string;
      userId: string;
      roleId: string;
    };
  };
}

// User role'leri response DTO
export interface UserRolesResponseDTO {
  success: boolean;
  data: {
    userId: string;
    userName: string;
    userEmail: string;
    roles: Array<{
      userRoleId: string;
      roleId: string;
      roleName: string;
      roleDescription: string;
      isActive: boolean;
      assignedBy: string;
      assignedAt: Date;
    }>;
  };
}

// Tüm role'ler response DTO
export interface AllRolesResponseDTO {
  success: boolean;
  data: {
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      permissions: Array<{
        id: string;
        name: string;
        description: string;
        resource: string;
        action: string;
      }>;
    }>;
  };
}

// Tüm permission'lar response DTO
export interface AllPermissionsResponseDTO {
  success: boolean;
  data: {
    permissions: Array<{
      id: string;
      name: string;
      description: string;
      resource: string;
      action: string;
      category: string;
      isActive: boolean;
    }>;
  };
}

// Role'e permission ekleme response DTO
export interface AddPermissionsToRoleResponseDTO {
  success: boolean;
  message: string;
  data: {
    role: {
      id: string;
      name: string;
      permissionsCount: number;
    };
  };
}

// Role'den permission kaldırma response DTO
export interface RemovePermissionsFromRoleResponseDTO {
  success: boolean;
  message: string;
  data: {
    role: {
      id: string;
      name: string;
      permissionsCount: number;
    };
  };
}

// User permission'ları response DTO
export interface UserPermissionsResponseDTO {
  success: boolean;
  data: {
    userId: string;
    userName: string;
    userEmail: string;
    permissions: Array<{
      id: string;
      name: string;
      description: string;
      resource: string;
      action: string;
      category: string;
    }>;
  };
}
