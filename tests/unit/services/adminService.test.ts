import "reflect-metadata";
import { AdminManager } from "../../../services/managers/AdminManager";
import { UserRepository } from "../../../repositories/UserRepository";
import { FakeUserDataSource } from "../../mocks/datasource/FakeUserDataSource";

describe("AdminService Unit Tests", () => {
  let adminService: AdminManager;
  let userRepository: UserRepository;
  let fakeUserDataSource: FakeUserDataSource;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
    adminService = new AdminManager(userRepository);
  });

  it("should create and get all users", async () => {
    await fakeUserDataSource.create({
      name: "User1",
      email: "u1@a.com",
      password: "x",
      role: "user",
      profile_image: "",
      blocked: false,
    });
    await fakeUserDataSource.create({
      name: "User2",
      email: "u2@a.com",
      password: "x",
      role: "user",
      profile_image: "",
      blocked: false,
    });
    const users = await adminService.getAllUsers();
    expect(users.length).toBe(2);
    expect(users.map((u: any) => u.name)).toContain("User1");
    expect(users.map((u: any) => u.name)).toContain("User2");
  });

  it("should get single user", async () => {
    const user = await fakeUserDataSource.create({
      name: "User3",
      email: "u3@a.com",
      password: "x",
      role: "user",
      profile_image: "",
      blocked: false,
    });
    const found = await adminService.getSingleUser(user._id);
    expect(found).toBeDefined();
    expect(found?._id).toBe(user._id);
  });

  it("should block and unblock user", async () => {
    const user = await fakeUserDataSource.create({
      name: "User4",
      email: "u4@a.com",
      password: "x",
      role: "user",
      profile_image: "",
      blocked: false,
    });
    const blocked = await adminService.blockUser(user._id);
    expect(blocked?.blocked).toBe(true);
    const unblocked = await adminService.blockUser(user._id);
    expect(unblocked?.blocked).toBe(false);
  });

  it("should delete user", async () => {
    const user = await fakeUserDataSource.create({
      name: "User5",
      email: "u5@a.com",
      password: "x",
      role: "user",
      profile_image: "",
      blocked: false,
    });

    // deleteUser returns void, so just check it doesn't throw
    await expect(adminService.deleteUser(user._id)).resolves.not.toThrow();

    // Verify user is actually deleted - getSingleUser should return null
    const found = await adminService.getSingleUser(user._id);
    expect(found).toBeNull();
  });

  it("should throw error when deleting non-existent user", async () => {
    // deleteUser throws CustomError for non-existent users
    await expect(adminService.deleteUser("nonexistentid")).rejects.toThrow(
      "User not found"
    );
  });
});
