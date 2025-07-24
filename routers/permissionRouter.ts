import { Router } from 'express';
import { container } from 'tsyringe';
import { getAccessToRoute } from '../middlewares/authorization/authMiddleware';
import { requireAdmin } from '../middlewares/authorization/permissionMiddleware';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { PermissionController } from '../controllers/permissionController';

const router = Router();
const permissionController = new PermissionController(
  container.resolve('IUserRoleService'),
  container.resolve('IRoleService'),
  container.resolve('IUserService')
);
const validator = container.resolve<IValidationProvider>('IValidationProvider');
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

// Tüm endpoint'ler admin yetkisi gerektirir
router.use(getAccessToRoute, requireAdmin);
router.use(
  auditMiddleware.createMiddleware('PERMISSION_MANAGEMENT', {
    tags: ['admin', 'permissions'],
  })
);

// Kullanıcıya role ata
router.post(
  '/assign-role',
  validator.validateBody({
    type: 'object',
    required: ['userId', 'roleId'],
    properties: {
      userId: { type: 'string' },
      roleId: { type: 'string' },
      assignedBy: { type: 'string' },
    },
  }),
  auditMiddleware.createMiddleware('ROLE_ASSIGNMENT'),
  permissionController.assignRoleToUser
);

// Kullanıcıdan role kaldır
router.delete(
  '/remove-role',
  validator.validateBody({
    type: 'object',
    required: ['userId', 'roleId'],
    properties: {
      userId: { type: 'string' },
      roleId: { type: 'string' },
    },
  }),
  auditMiddleware.createMiddleware('ROLE_REMOVAL'),
  permissionController.removeRoleFromUser
);

// Kullanıcının mevcut role'lerini getir
router.get(
  '/user-roles/:userId',
  validator.validateParams({
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  }),
  permissionController.getUserRoles as any
);

// Tüm role'leri listele
router.get('/roles', permissionController.getAllRoles);

// Tüm permission'ları listele
router.get('/permissions', permissionController.getAllPermissions);

// Role'e permission ekle
router.post(
  '/role-permissions',
  validator.validateBody({
    type: 'object',
    required: ['roleId', 'permissionIds'],
    properties: {
      roleId: { type: 'string' },
      permissionIds: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  }),
  auditMiddleware.createMiddleware('ROLE_PERMISSION_UPDATE'),
  permissionController.addPermissionsToRole
);

// Role'den permission kaldır
router.delete(
  '/role-permissions',
  validator.validateBody({
    type: 'object',
    required: ['roleId', 'permissionIds'],
    properties: {
      roleId: { type: 'string' },
      permissionIds: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  }),
  auditMiddleware.createMiddleware('ROLE_PERMISSION_REMOVAL'),
  permissionController.removePermissionsFromRole
);

// Kullanıcının permission'larını getir
router.get(
  '/user-permissions/:userId',
  validator.validateParams({
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' },
    },
  }),
  permissionController.getUserPermissions as any
);

export default router;
