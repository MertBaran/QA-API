import 'reflect-metadata';
import { UserRepository } from '../../../repositories/UserRepository';
import { FakeUserDataSource } from '../../mocks/datasource/FakeUserDataSource';

describe('UserRepository Unit Tests', () => {
  let userRepository: UserRepository;
  let fakeUserDataSource: FakeUserDataSource;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
  });

  it('should create and find user by id', async () => {
    const user = await userRepository.create({
      name: 'RepoUser',
      email: 'repo@a.com',
      password: 'x',
      role: 'user',
      profile_image: '',
      blocked: false,
    });
    const found = await userRepository.findById(user._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(user._id);
  });

  it('should find user by email', async () => {
    await userRepository.create({
      name: 'RepoUser2',
      email: 'repo2@a.com',
      password: 'x',
      role: 'user',
      profile_image: '',
      blocked: false,
    });
    const found = await userRepository.findByEmail('repo2@a.com');
    expect(found).toBeDefined();
    expect(found?.email).toBe('repo2@a.com');
  });

  it('should update user', async () => {
    const user = await userRepository.create({
      name: 'RepoUser3',
      email: 'repo3@a.com',
      password: 'x',
      role: 'user',
      profile_image: '',
      blocked: false,
    });
    const updated = await userRepository.updateById(user._id, {
      name: 'UpdatedRepoUser3',
    });
    expect(updated).toBeDefined();
    expect(updated?.name).toBe('UpdatedRepoUser3');
  });

  it('should delete user', async () => {
    const user = await userRepository.create({
      name: 'RepoUser4',
      email: 'repo4@a.com',
      password: 'x',
      role: 'user',
      profile_image: '',
      blocked: false,
    });
    const deleted = await userRepository.deleteById(user._id);
    expect(deleted).toBeDefined();
    const found = await userRepository.findById(user._id);
    expect(found).toBeNull();
  });
});
