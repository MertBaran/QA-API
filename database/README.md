# Database Migration & Seeding System

Bu proje için profesyonel bir database migration ve seeding sistemi kurulmuştur.

## 📁 Yapı

```
database/
├── interfaces/
│   ├── MigrationInterface.ts
│   ├── SeedInterface.ts
│   ├── IMigrationStrategy.ts
│   └── ISeedStrategy.ts
├── strategies/
│   ├── MongoDBMigrationStrategy.ts
│   ├── PostgreSQLMigrationStrategy.ts
│   ├── MongoDBSeedStrategy.ts
│   └── PostgreSQLSeedStrategy.ts
├── factories/
│   └── DatabaseStrategyFactory.ts
├── migrations/
│   ├── mongodb/
│   │   ├── 001_create_permissions_table.ts
│   │   ├── 002_create_roles_table.ts
│   │   └── 003_create_user_roles_table.ts
│   └── postgresql/
│       └── 001_create_permissions_table.ts
├── seeds/
│   ├── mongodb/
│   │   ├── PermissionSeed.ts
│   │   └── RoleSeed.ts
│   └── postgresql/
│       └── PermissionSeed.ts
├── seeders/
│   └── SeederManager.ts
├── migrations/
│   └── MigrationManager.ts
└── README.md
```

## 🚀 Kullanım

### Temel Komutlar

```bash
# Database'i tamamen kur (migration + seed)
npm run db:setup

# Sadece migration'ları çalıştır
npm run db:migrate

# Sadece seed'leri çalıştır
npm run db:seed

# Migration'ları geri al
npm run db:rollback

# Seed'leri geri al
npm run db:rollback-seeds

# Database durumunu göster
npm run db:status

# Kullanıcıya admin rolü ata
npm run db:admin <email>
```

### Örnek Kullanım

```bash
# 1. Database'i kur
npm run db:setup

# 2. Durumu kontrol et
npm run db:status

# 3. Admin rolü ata
npm run db:admin mertbarandev@gmail.com
```

## 📋 Migration'lar

### 001_create_permissions_table

- Permission tablosunu hazırlar
- Mevcut `PermissionMongoModel` schema'sını kullanır
- Index'ler: name (unique), resource+action, isActive

### 002_create_roles_table

- Role tablosunu hazırlar
- Mevcut `RoleMongoModel` schema'sını kullanır
- Role-permission ilişkisi
- Index'ler: name (unique), isActive, isSystem

### 003_create_user_roles_table

- User-Role many-to-many ilişkisi
- Mevcut `UserRoleMongoModel` schema'sını kullanır
- Index'ler: userId+roleId (unique), userId+isActive, roleId+isActive

## 🌱 Seed'ler

### MongoDB Seeds

#### PermissionSeed

Temel permission'ları oluşturur:

- `questions:create`, `questions:read`, `questions:update`, `questions:delete`, `questions:moderate`
- `answers:create`, `answers:read`, `answers:update`, `answers:delete`
- `users:read`, `users:update`, `users:delete`, `users:manage_roles`
- `system:admin`

#### RoleSeed

Temel rolleri oluşturur:

- **user**: Temel kullanıcı yetkileri
- **moderator**: İçerik moderasyon yetkileri
- **admin**: Tam sistem yetkileri

### PostgreSQL Seeds

#### PermissionSeed

PostgreSQL için permission seed'i (henüz implement edilmedi)

## 🔧 Geliştirme

### Yeni Migration Ekleme

1. `database/migrations/` klasöründe yeni dosya oluştur
2. `MigrationInterface`'i implement et
3. `MigrationManager`'a ekle

```typescript
// 004_add_new_table.ts
export class AddNewTable004 implements MigrationInterface {
  version = '004';
  description = 'Add new table';

  async up(connection: mongoose.Connection): Promise<void> {
    // Migration logic
  }

  async down(connection: mongoose.Connection): Promise<void> {
    // Rollback logic
  }
}
```

### Yeni Seed Ekleme

1. `database/seeds/<database-type>/` klasöründe yeni dosya oluştur
2. `SeedInterface`'i implement et
3. `SeederManager`'a ekle

```typescript
// mongodb/NewSeed.ts
export class NewSeed implements SeedInterface {
  name = 'NewSeed';
  description = 'Seed new data';

  async run(databaseAdapter: IDatabaseAdapter): Promise<any> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB seed for non-MongoDB adapter');
      return new Map();
    }
    // MongoDB-specific seed logic
  }

  async rollback(databaseAdapter: IDatabaseAdapter): Promise<void> {
    if (!(databaseAdapter instanceof MongoDBAdapter)) {
      console.log('⏭️ Skipping MongoDB seed rollback for non-MongoDB adapter');
      return;
    }
    // MongoDB-specific rollback logic
  }
}
```

## ⚠️ Önemli Notlar

- Migration'lar sıralı çalışır (001, 002, 003...)
- Seed'ler bağımlılık sırasına göre çalışır
- Rollback işlemleri ters sırada yapılır
- **Strategy Pattern**: Database-specific strategy'ler ile `if` check'leri kaldırıldı
- **Factory Pattern**: `DatabaseStrategyFactory` ile uygun strategy otomatik seçilir
- **Dependency Injection**: `tsyringe` container ile strategy'ler register edilir
- **Environment Detection**: Mevcut sistemin `EnvironmentProvider` ve `BootstrapService`'ini kullanır
- **Database Adapter**: Sistemin `IDatabaseAdapter` interface'ini kullanır
- **Configuration**: `ConfigurationManager` ve environment-specific config dosyalarını kullanır
- **Database Agnostic**: Migration'lar ve seed'ler database adapter'a göre çalışır
- MongoDB ve PostgreSQL desteklenir

## 🐛 Troubleshooting

### Migration Hatası

```bash
# Migration'ları geri al ve tekrar dene
npm run db:rollback
npm run db:migrate
```

### Seed Hatası

```bash
# Seed'leri geri al ve tekrar dene
npm run db:rollback-seeds
npm run db:seed
```

### Database Bağlantı Hatası

- `config.env` dosyasında `MONGO_URI` kontrol et
- MongoDB Atlas bağlantısını kontrol et
- Network erişimini kontrol et
