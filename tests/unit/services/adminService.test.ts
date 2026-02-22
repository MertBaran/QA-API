import 'reflect-metadata';
import { AdminManager } from '../../../services/managers/AdminManager';
import { UserRepository } from '../../../repositories/UserRepository';
import { FakeUserDataSource } from '../../mocks/datasources/FakeUserDataSource';
import { FakeUserRoleService } from '../../mocks/services/FakeUserRoleService';
import { FakeRoleService } from '../../mocks/services/FakeRoleService';

describe('AdminService Unit Tests', () => {
  let adminService: AdminManager;
  let userRepository: UserRepository;
  let fakeUserDataSource: FakeUserDataSource;
  let fakeUserRoleService: FakeUserRoleService;
  let fakeRoleService: FakeRoleService;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
    fakeUserRoleService = new FakeUserRoleService();
    fakeRoleService = new FakeRoleService();
    adminService = new AdminManager(userRepository, fakeUserRoleService, fakeRoleService);
  });

  it('should get users for admin', async () => {
    await fakeUserDataSource.create({
      name: 'User1',
      email: 'u1@a.com',
      password: 'x',
      profile_image: '',
      blocked: false,
    });
    await fakeUserDataSource.create({
      name: 'User2',
      email: 'u2@a.com',
      password: 'x',
      profile_image: '',
      blocked: false,
    });
    const result = await adminService.getUsersForAdmin({}, 1, 10);
    expect(result.users.length).toBe(2);
    expect(result.users.map((u: any) => u.name)).toContain('User1');
    expect(result.users.map((u: any) => u.name)).toContain('User2');
  });

  it('should toggle user block', async () => {
    const user = await fakeUserDataSource.create({
      name: 'User4',
      email: 'u4@a.com',
      password: 'x',
      profile_image: '',
      blocked: false,
    });
    const blocked = await adminService.toggleUserBlock(user._id, true);
    expect(blocked?.blocked).toBe(true);
    const unblocked = await adminService.toggleUserBlock(user._id, false);
    expect(unblocked?.blocked).toBe(false);
  });

  it('should delete user', async () => {
    const user = await fakeUserDataSource.create({
      name: 'User5',
      email: 'u5@a.com',
      password: 'x',
      profile_image: '',
      blocked: false,
    });

    // deleteUserByAdmin returns void, so just check it doesn't throw
    await expect(
      adminService.deleteUserByAdmin(user._id)
    ).resolves.not.toThrow();
  });

  it('should throw error when deleting non-existent user', async () => {
    // deleteUserByAdmin throws when BaseRepository.deleteById throws "Resource not found"
    await expect(
      adminService.deleteUserByAdmin('nonexistentid')
    ).rejects.toThrow('Resource not found');
  });
});
