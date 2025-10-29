export const RepositoryConstants = {
  // Base Repository Messages
  BASE: {
    FIND_BY_FIELD_VALUE_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.findByFieldValue',
      en: 'Database error in BaseRepository.findByFieldValue',
      de: 'Datenbankfehler in BaseRepository.findByFieldValue',
    },
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.create',
      en: 'Database error in BaseRepository.create',
      de: 'Datenbankfehler in BaseRepository.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.findById',
      en: 'Database error in BaseRepository.findById',
      de: 'Datenbankfehler in BaseRepository.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.findAll',
      en: 'Database error in BaseRepository.findAll',
      de: 'Datenbankfehler in BaseRepository.findAll',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.updateById',
      en: 'Database error in BaseRepository.updateById',
      de: 'Datenbankfehler in BaseRepository.updateById',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.deleteById',
      en: 'Database error in BaseRepository.deleteById',
      de: 'Datenbankfehler in BaseRepository.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.countAll',
      en: 'Database error in BaseRepository.countAll',
      de: 'Datenbankfehler in BaseRepository.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: BaseRepository.deleteAll',
      en: 'Database error in BaseRepository.deleteAll',
      de: 'Datenbankfehler in BaseRepository.deleteAll',
    },
  },

  // User Repository Messages
  USER: {
    NOT_FOUND: {
      tr: 'Kullanıcı bulunamadı',
      en: 'User not found',
      de: 'Benutzer nicht gefunden',
    },
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.create',
      en: 'Database error in UserMongooseDataSource.create',
      de: 'Datenbankfehler in UserMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.findById',
      en: 'Database error in UserMongooseDataSource.findById',
      de: 'Datenbankfehler in UserMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.findAll',
      en: 'Database error in UserMongooseDataSource.findAll',
      de: 'Datenbankfehler in UserMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_NOT_FOUND: {
      tr: 'Güncellenecek kullanıcı bulunamadı',
      en: 'User not found for update',
      de: 'Benutzer zum Aktualisieren nicht gefunden',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.updateById',
      en: 'Database error in UserMongooseDataSource.updateById',
      de: 'Datenbankfehler in UserMongooseDataSource.updateById',
    },
    DELETE_BY_ID_NOT_FOUND: {
      tr: 'Silinecek kullanıcı bulunamadı',
      en: 'User not found for delete',
      de: 'Benutzer zum Löschen nicht gefunden',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.deleteById',
      en: 'Database error in UserMongooseDataSource.deleteById',
      de: 'Datenbankfehler in UserMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.countAll',
      en: 'Database error in UserMongooseDataSource.countAll',
      de: 'Datenbankfehler in UserMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.deleteAll',
      en: 'Database error in UserMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in UserMongooseDataSource.deleteAll',
    },
    FIND_BY_EMAIL_WITH_PASSWORD_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.findByEmailWithPassword',
      en: 'Database error in UserMongooseDataSource.findByEmailWithPassword',
      de: 'Datenbankfehler in UserMongooseDataSource.findByEmailWithPassword',
    },
    FIND_ACTIVE_ERROR: {
      tr: 'Veritabanı hatası: UserMongooseDataSource.findActive',
      en: 'Database error in UserMongooseDataSource.findActive',
      de: 'Datenbankfehler in UserMongooseDataSource.findActive',
    },
  },

  // Question Repository Messages
  QUESTION: {
    NOT_FOUND: {
      tr: 'Soru bulunamadı',
      en: 'Question not found',
      de: 'Frage nicht gefunden',
    },
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.create',
      en: 'Database error in QuestionMongooseDataSource.create',
      de: 'Datenbankfehler in QuestionMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.findById',
      en: 'Database error in QuestionMongooseDataSource.findById',
      de: 'Datenbankfehler in QuestionMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.findAll',
      en: 'Database error in QuestionMongooseDataSource.findAll',
      de: 'Datenbankfehler in QuestionMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_NOT_FOUND: {
      tr: 'Güncellenecek soru bulunamadı',
      en: 'Question not found for update',
      de: 'Frage zum Aktualisieren nicht gefunden',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.updateById',
      en: 'Database error in QuestionMongooseDataSource.updateById',
      de: 'Datenbankfehler in QuestionMongooseDataSource.updateById',
    },
    DELETE_BY_ID_NOT_FOUND: {
      tr: 'Silinecek soru bulunamadı',
      en: 'Question not found for delete',
      de: 'Frage zum Löschen nicht gefunden',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.deleteById',
      en: 'Database error in QuestionMongooseDataSource.deleteById',
      de: 'Datenbankfehler in QuestionMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.countAll',
      en: 'Database error in QuestionMongooseDataSource.countAll',
      de: 'Datenbankfehler in QuestionMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: QuestionMongooseDataSource.deleteAll',
      en: 'Database error in QuestionMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in QuestionMongooseDataSource.deleteAll',
    },
  },

  // Answer Repository Messages
  ANSWER: {
    NOT_FOUND: {
      tr: 'Cevap bulunamadı',
      en: 'Answer not found',
      de: 'Antwort nicht gefunden',
    },
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.create',
      en: 'Database error in AnswerMongooseDataSource.create',
      de: 'Datenbankfehler in AnswerMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.findById',
      en: 'Database error in AnswerMongooseDataSource.findById',
      de: 'Datenbankfehler in AnswerMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.findAll',
      en: 'Database error in AnswerMongooseDataSource.findAll',
      de: 'Datenbankfehler in AnswerMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_NOT_FOUND: {
      tr: 'Güncellenecek cevap bulunamadı',
      en: 'Answer not found for update',
      de: 'Antwort zum Aktualisieren nicht gefunden',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.updateById',
      en: 'Database error in AnswerMongooseDataSource.updateById',
      de: 'Datenbankfehler in AnswerMongooseDataSource.updateById',
    },
    DELETE_BY_ID_NOT_FOUND: {
      tr: 'Silinecek cevap bulunamadı',
      en: 'Answer not found for delete',
      de: 'Antwort zum Löschen nicht gefunden',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.deleteById',
      en: 'Database error in AnswerMongooseDataSource.deleteById',
      de: 'Datenbankfehler in AnswerMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.countAll',
      en: 'Database error in AnswerMongooseDataSource.countAll',
      de: 'Datenbankfehler in AnswerMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.deleteAll',
      en: 'Database error in AnswerMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in AnswerMongooseDataSource.deleteAll',
    },
    ALREADY_LIKED_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.alreadyLiked',
      en: 'Database error in AnswerMongooseDataSource.alreadyLiked',
      de: 'Datenbankfehler in AnswerMongooseDataSource.alreadyLiked',
    },
    NOT_LIKED_ERROR: {
      tr: 'Veritabanı hatası: AnswerMongooseDataSource.notLiked',
      en: 'Database error in AnswerMongooseDataSource.notLiked',
      de: 'Datenbankfehler in AnswerMongooseDataSource.notLiked',
    },
  },

  // Role Repository Messages
  ROLE: {
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.create',
      en: 'Database error in RoleMongooseDataSource.create',
      de: 'Datenbankfehler in RoleMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.findById',
      en: 'Database error in RoleMongooseDataSource.findById',
      de: 'Datenbankfehler in RoleMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.findAll',
      en: 'Database error in RoleMongooseDataSource.findAll',
      de: 'Datenbankfehler in RoleMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.updateById',
      en: 'Database error in RoleMongooseDataSource.updateById',
      de: 'Datenbankfehler in RoleMongooseDataSource.updateById',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.deleteById',
      en: 'Database error in RoleMongooseDataSource.deleteById',
      de: 'Datenbankfehler in RoleMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.countAll',
      en: 'Database error in RoleMongooseDataSource.countAll',
      de: 'Datenbankfehler in RoleMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.deleteAll',
      en: 'Database error in RoleMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in RoleMongooseDataSource.deleteAll',
    },
    GET_PERMISSION_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.getPermissionById',
      en: 'Database error in RoleMongooseDataSource.getPermissionById',
      de: 'Datenbankfehler in RoleMongooseDataSource.getPermissionById',
    },
    GET_ALL_PERMISSIONS_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.getAllPermissions',
      en: 'Database error in RoleMongooseDataSource.getAllPermissions',
      de: 'Datenbankfehler in RoleMongooseDataSource.getAllPermissions',
    },
    ADD_PERMISSIONS_TO_ROLE_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.addPermissionsToRole',
      en: 'Database error in RoleMongooseDataSource.addPermissionsToRole',
      de: 'Datenbankfehler in RoleMongooseDataSource.addPermissionsToRole',
    },
    REMOVE_PERMISSIONS_FROM_ROLE_ERROR: {
      tr: 'Veritabanı hatası: RoleMongooseDataSource.removePermissionsFromRole',
      en: 'Database error in RoleMongooseDataSource.removePermissionsFromRole',
      de: 'Datenbankfehler in RoleMongooseDataSource.removePermissionsFromRole',
    },
  },

  // Permission Repository Messages
  PERMISSION: {
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.create',
      en: 'Database error in PermissionMongooseDataSource.create',
      de: 'Datenbankfehler in PermissionMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.findById',
      en: 'Database error in PermissionMongooseDataSource.findById',
      de: 'Datenbankfehler in PermissionMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.findAll',
      en: 'Database error in PermissionMongooseDataSource.findAll',
      de: 'Datenbankfehler in PermissionMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.updateById',
      en: 'Database error in PermissionMongooseDataSource.updateById',
      de: 'Datenbankfehler in PermissionMongooseDataSource.updateById',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.deleteById',
      en: 'Database error in PermissionMongooseDataSource.deleteById',
      de: 'Datenbankfehler in PermissionMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.countAll',
      en: 'Database error in PermissionMongooseDataSource.countAll',
      de: 'Datenbankfehler in PermissionMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: PermissionMongooseDataSource.deleteAll',
      en: 'Database error in PermissionMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in PermissionMongooseDataSource.deleteAll',
    },
  },

  // UserRole Repository Messages
  USER_ROLE: {
    NOT_FOUND_ERROR: {
      tr: 'Kullanıcı rolü bulunamadı',
      en: 'User role not found',
      de: 'Benutzerrolle nicht gefunden',
    },
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.create',
      en: 'Database error in UserRoleMongooseDataSource.create',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.findById',
      en: 'Database error in UserRoleMongooseDataSource.findById',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.findById',
    },
    FIND_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.findAll',
      en: 'Database error in UserRoleMongooseDataSource.findAll',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.findAll',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.updateById',
      en: 'Database error in UserRoleMongooseDataSource.updateById',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.updateById',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.deleteById',
      en: 'Database error in UserRoleMongooseDataSource.deleteById',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.countAll',
      en: 'Database error in UserRoleMongooseDataSource.countAll',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.deleteAll',
      en: 'Database error in UserRoleMongooseDataSource.deleteAll',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.deleteAll',
    },
    FIND_BY_USER_ID_ERROR: {
      tr: 'Veritabanı hatası: UserRoleMongooseDataSource.findByUserId',
      en: 'Database error in UserRoleMongooseDataSource.findByUserId',
      de: 'Datenbankfehler in UserRoleMongooseDataSource.findByUserId',
    },
  },
  NOTIFICATION: {
    NOTIFICATION_NOT_FOUND: {
      tr: 'Bildirim bulunamadı',
      en: 'Notification not found',
      de: 'Benachrichtigung nicht gefunden',
    },
  },
  NOTIFICATION_TEMPLATE: {
    TEMPLATE_NOT_FOUND: {
      tr: 'Template bulunamadı',
      en: 'Template not found',
      de: 'Template nicht gefunden',
    },
  },

  // Mongoose Model Adapter Messages
  MONGOOSE_ADAPTER: {
    CREATE_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.create',
      en: 'Database error in MongooseModelAdapter.create',
      de: 'Datenbankfehler in MongooseModelAdapter.create',
    },
    FIND_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.findById',
      en: 'Database error in MongooseModelAdapter.findById',
      de: 'Datenbankfehler in MongooseModelAdapter.findById',
    },
    FIND_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.find',
      en: 'Database error in MongooseModelAdapter.find',
      de: 'Datenbankfehler in MongooseModelAdapter.find',
    },
    UPDATE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.updateById',
      en: 'Database error in MongooseModelAdapter.updateById',
      de: 'Datenbankfehler in MongooseModelAdapter.updateById',
    },
    DELETE_BY_ID_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.deleteById',
      en: 'Database error in MongooseModelAdapter.deleteById',
      de: 'Datenbankfehler in MongooseModelAdapter.deleteById',
    },
    COUNT_ALL_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.countAll',
      en: 'Database error in MongooseModelAdapter.countAll',
      de: 'Datenbankfehler in MongooseModelAdapter.countAll',
    },
    DELETE_ALL_ERROR: {
      tr: 'Veritabanı hatası: MongooseModelAdapter.deleteAll',
      en: 'Database error in MongooseModelAdapter.deleteAll',
      de: 'Datenbankfehler in MongooseModelAdapter.deleteAll',
    },
  },

  // Database Adapter Messages
  DATABASE_ADAPTER: {
    MONGODB: {
      CONNECT_SUCCESS: {
        tr: '🔗 MongoDB başarıyla bağlandı, veritabanı: {dbName}',
        en: '🔗 MongoDB connected successfully to database: {dbName}',
        de: '🔗 MongoDB erfolgreich mit Datenbank verbunden: {dbName}',
      },
      CONNECT_FAILED: {
        tr: '❌ MongoDB bağlantısı başarısız',
        en: '❌ MongoDB connection failed',
        de: '❌ MongoDB-Verbindung fehlgeschlagen',
      },
      DISCONNECT_SUCCESS: {
        tr: 'MongoDB başarıyla bağlantısı kesildi',
        en: 'MongoDB disconnected successfully',
        de: 'MongoDB erfolgreich getrennt',
      },
      DISCONNECT_ERROR: {
        tr: 'Veritabanı hatası: MongoDBAdapter.disconnect',
        en: 'Database error in MongoDBAdapter.disconnect',
        de: 'Datenbankfehler in MongoDBAdapter.disconnect',
      },
    },
    POSTGRESQL: {
      CONNECT_SUCCESS: {
        tr: 'PostgreSQL başarıyla bağlandı',
        en: 'PostgreSQL connected successfully',
        de: 'PostgreSQL erfolgreich verbunden',
      },
      CONNECT_ERROR: {
        tr: 'Veritabanı hatası: PostgreSQLAdapter.connect',
        en: 'Database error in PostgreSQLAdapter.connect',
        de: 'Datenbankfehler in PostgreSQLAdapter.connect',
      },
      DISCONNECT_SUCCESS: {
        tr: 'PostgreSQL başarıyla bağlantısı kesildi',
        en: 'PostgreSQL disconnected successfully',
        de: 'PostgreSQL erfolgreich getrennt',
      },
      DISCONNECT_ERROR: {
        tr: 'Veritabanı hatası: PostgreSQLAdapter.disconnect',
        en: 'Database error in PostgreSQLAdapter.disconnect',
        de: 'Datenbankfehler in PostgreSQLAdapter.disconnect',
      },
    },
  },
};
