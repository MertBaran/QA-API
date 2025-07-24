// Role atama için request DTO
export interface AssignRoleRequestDTO {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

// Role kaldırma için request DTO
export interface RemoveRoleRequestDTO {
  userId: string;
  roleId: string;
}

// Role'e permission ekleme için request DTO
export interface AddPermissionsToRoleRequestDTO {
  roleId: string;
  permissionIds: string[];
}

// Role'den permission kaldırma için request DTO
export interface RemovePermissionsFromRoleRequestDTO {
  roleId: string;
  permissionIds: string[];
}

// User ID parametresi için DTO
export interface UserIdParamDTO {
  userId: string;
}

// Role ID parametresi için DTO
export interface RoleIdParamDTO {
  roleId: string;
}

// Permission ID parametresi için DTO
export interface PermissionIdParamDTO {
  permissionId: string;
} 