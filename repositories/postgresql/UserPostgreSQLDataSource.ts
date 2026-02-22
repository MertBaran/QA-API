import { injectable } from 'tsyringe';
import { Prisma } from '.prisma/client';
import { IUserModel } from '../../models/interfaces/IUserModel';
import { NotificationPreferences } from '../../models/interfaces/IUserModel';
import { IDataSource } from '../interfaces/IDataSource';
import { getPrismaClient } from './PrismaClientSingleton';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { RepositoryConstants } from '../constants/RepositoryMessages';
import bcrypt from 'bcryptjs';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  title: string | null;
  about: string | null;
  place: string | null;
  website: string | null;
  profile_image: string;
  blocked: boolean;
  lastPasswordChange: Date | null;
  isGoogleUser: boolean;
  phoneNumber: string | null;
  webhookUrl: string | null;
  notificationPreferences: NotificationPreferences | Prisma.JsonValue | null;
  language: string;
  background_asset_key: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
  passwordChangeCode: string | null;
  passwordChangeCodeExpire: Date | null;
  passwordChangeVerificationToken: string | null;
  passwordChangeVerificationTokenExpire: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserWithFollows = UserRow & {
  following?: { followingId: string }[];
  followers?: { followerId: string }[];
};

@injectable()
export class UserPostgreSQLDataSource implements IDataSource<IUserModel> {
  private get prisma() {
    return getPrismaClient();
  }

  private toEntity(
    row: UserWithFollows,
    followingIds?: string[],
    followersIds?: string[]
  ): IUserModel {
    const following = followingIds ?? row.following?.map((f) => f.followingId) ?? [];
    const followers = followersIds ?? row.followers?.map((f) => f.followerId) ?? [];
    return {
      _id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      title: row.title ?? undefined,
      about: row.about ?? undefined,
      place: row.place ?? undefined,
      website: row.website ?? undefined,
      profile_image: row.profile_image,
      blocked: row.blocked,
      resetPasswordToken: row.resetPasswordToken ?? undefined,
      resetPasswordExpire: row.resetPasswordExpire ?? undefined,
      passwordChangeCode: row.passwordChangeCode ?? undefined,
      passwordChangeCodeExpire: row.passwordChangeCodeExpire ?? undefined,
      passwordChangeVerificationToken: row.passwordChangeVerificationToken ?? undefined,
      passwordChangeVerificationTokenExpire: row.passwordChangeVerificationTokenExpire ?? undefined,
      lastPasswordChange: row.lastPasswordChange ?? undefined,
      isGoogleUser: row.isGoogleUser,
      createdAt: row.createdAt,
      phoneNumber: row.phoneNumber ?? undefined,
      webhookUrl: row.webhookUrl ?? undefined,
      notificationPreferences: (row.notificationPreferences as NotificationPreferences) ?? undefined,
      language: (row.language as IUserModel['language']) ?? 'en',
      following,
      followers,
      background_asset_key: row.background_asset_key ?? undefined,
    };
  }

  async create(data: Partial<IUserModel>): Promise<IUserModel> {
    const { _id, following, followers, ...rest } = data;
    if (!rest.password) {
      throw ApplicationError.validationError('Password is required');
    }
    // Mongo tarafında password genelde model hook'u ile hash'leniyor. PostgreSQL'de bunu manuel yapıyoruz.
    // Eğer zaten bcrypt hash ise (ör. resetPassword flow'u), tekrar hashleme.
    const passwordToStore =
      typeof rest.password === 'string' && rest.password.startsWith('$2')
        ? rest.password
        : await bcrypt.hash(rest.password, await bcrypt.genSalt(10));
    const created = await this.prisma.user.create({
      data: {
        name: rest.name!,
        email: rest.email!,
        password: passwordToStore,
        title: rest.title ?? null,
        about: rest.about ?? null,
        place: rest.place ?? null,
        website: rest.website ?? null,
        profile_image: rest.profile_image ?? 'default.jpg',
        blocked: rest.blocked ?? false,
        lastPasswordChange: rest.lastPasswordChange ?? null,
        isGoogleUser: rest.isGoogleUser ?? false,
        phoneNumber: rest.phoneNumber ?? null,
        webhookUrl: rest.webhookUrl ?? null,
        notificationPreferences:
          rest.notificationPreferences != null
            ? (rest.notificationPreferences as unknown as Prisma.InputJsonValue)
            : undefined,
        language: rest.language ?? 'en',
        background_asset_key: rest.background_asset_key ?? null,
      },
    });
    return this.toEntity(
      created as UserWithFollows,
      [],
      []
    );
  }

  async findById(id: string): Promise<IUserModel> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.USER.NOT_FOUND.en
      );
    }
    return this.toEntity(row as UserWithFollows);
  }

  async findAll(): Promise<IUserModel[]> {
    const rows = await this.prisma.user.findMany({
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return rows.map((r) => this.toEntity(r as UserWithFollows));
  }

  async updateById(id: string, data: Partial<IUserModel>): Promise<IUserModel> {
    const { _id, following, followers, ...rest } = data;

    if (following !== undefined) {
      await this.prisma.userFollow.deleteMany({ where: { followerId: id } });
      if (following.length > 0) {
        await this.prisma.userFollow.createMany({
          data: following.map((followingId) => ({
            followerId: id,
            followingId: String(followingId),
          })),
          skipDuplicates: true,
        });
      }
    }
    if (followers !== undefined) {
      await this.prisma.userFollow.deleteMany({ where: { followingId: id } });
      if (followers.length > 0) {
        await this.prisma.userFollow.createMany({
          data: followers.map((followerId) => ({
            followerId: String(followerId),
            followingId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updateData: Prisma.UserUncheckedUpdateInput = {
      ...(rest.name != null && { name: rest.name }),
      ...(rest.email != null && { email: rest.email }),
      ...(rest.password != null && {
        password:
          typeof rest.password === 'string' && rest.password.startsWith('$2')
            ? rest.password
            : await bcrypt.hash(rest.password, await bcrypt.genSalt(10)),
      }),
      ...(rest.title != null && { title: rest.title }),
      ...(rest.about != null && { about: rest.about }),
      ...(rest.place != null && { place: rest.place }),
      ...(rest.website != null && { website: rest.website }),
      ...(rest.profile_image != null && { profile_image: rest.profile_image }),
      ...(rest.blocked != null && { blocked: rest.blocked }),
      ...(rest.lastPasswordChange != null && { lastPasswordChange: rest.lastPasswordChange }),
      ...(rest.isGoogleUser != null && { isGoogleUser: rest.isGoogleUser }),
      ...(rest.phoneNumber != null && { phoneNumber: rest.phoneNumber }),
      ...(rest.webhookUrl != null && { webhookUrl: rest.webhookUrl }),
      ...(rest.notificationPreferences != null && {
        notificationPreferences: rest.notificationPreferences as unknown as Prisma.InputJsonValue,
      }),
      ...(rest.language != null && { language: rest.language }),
      ...(rest.background_asset_key != null && { background_asset_key: rest.background_asset_key }),
      ...(rest.resetPasswordToken !== undefined && {
        resetPasswordToken: rest.resetPasswordToken ?? null,
      }),
      ...(rest.resetPasswordExpire !== undefined && {
        resetPasswordExpire: rest.resetPasswordExpire ?? null,
      }),
      ...(rest.passwordChangeCode !== undefined && {
        passwordChangeCode: rest.passwordChangeCode ?? null,
      }),
      ...(rest.passwordChangeCodeExpire !== undefined && {
        passwordChangeCodeExpire: rest.passwordChangeCodeExpire ?? null,
      }),
      ...(rest.passwordChangeVerificationToken !== undefined && {
        passwordChangeVerificationToken: rest.passwordChangeVerificationToken ?? null,
      }),
      ...(rest.passwordChangeVerificationTokenExpire !== undefined && {
        passwordChangeVerificationTokenExpire: rest.passwordChangeVerificationTokenExpire ?? null,
      }),
    };

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return this.toEntity(updated as UserWithFollows);
  }

  async deleteById(id: string): Promise<IUserModel> {
    const row = await this.prisma.user.delete({
      where: { id },
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return this.toEntity(row as UserWithFollows);
  }

  async findByField(
    field: keyof IUserModel,
    value: string | number | boolean
  ): Promise<IUserModel[]> {
    const where: Prisma.UserWhereInput = {};
    if (field === '_id') where.id = String(value);
    else if (field === 'name') where.name = String(value);
    else if (field === 'email') where.email = String(value);
    else if (field === 'title') where.title = String(value);
    else if (field === 'about') where.about = String(value);
    else if (field === 'place') where.place = String(value);
    else if (field === 'website') where.website = String(value);
    else if (field === 'profile_image') where.profile_image = String(value);
    else if (field === 'blocked') where.blocked = Boolean(value);
    else if (field === 'isGoogleUser') where.isGoogleUser = Boolean(value);
    else if (field === 'phoneNumber') where.phoneNumber = String(value);
    else if (field === 'webhookUrl') where.webhookUrl = String(value);
    else if (field === 'language') where.language = String(value);
    const rows = await this.prisma.user.findMany({
      where,
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return rows.map((r) => this.toEntity(r as UserWithFollows));
  }

  async findByFields(fields: Partial<IUserModel>): Promise<IUserModel[]> {
    const where: Prisma.UserWhereInput = {};
    if (fields._id != null) where.id = String(fields._id);
    if (fields.name != null) where.name = fields.name;
    if (fields.email != null) where.email = fields.email;
    if (fields.blocked != null) where.blocked = fields.blocked;
    if (fields.isGoogleUser != null) where.isGoogleUser = fields.isGoogleUser;
    const rows = await this.prisma.user.findMany({
      where,
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return rows.map((r) => this.toEntity(r as UserWithFollows));
  }

  async findByEmail(email: string): Promise<IUserModel> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(row as UserWithFollows);
  }

  async findByEmailWithPassword(email: string): Promise<IUserModel> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    if (!row) {
      throw ApplicationError.notFoundError(
        RepositoryConstants.BASE.FIND_BY_FIELD_VALUE_ERROR.en
      );
    }
    return this.toEntity(row as UserWithFollows);
  }

  async findActive(): Promise<IUserModel[]> {
    const rows = await this.prisma.user.findMany({
      where: { blocked: false },
      include: {
        following: { select: { followingId: true } },
        followers: { select: { followerId: true } },
      },
    });
    return rows.map((r) => this.toEntity(r as UserWithFollows));
  }

  async countAll(): Promise<number> {
    return this.prisma.user.count();
  }

  async deleteAll(): Promise<number> {
    const result = await this.prisma.user.deleteMany({});
    return result.count;
  }
}
