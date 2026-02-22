import { randomUUID } from 'crypto';

// Database-agnostic ID type
export type EntityId = string;

// Database adapter interface for ID operations
export interface IDatabaseIdAdapter {
  createId(): EntityId;
  isValidId(id: EntityId): boolean;
  toString(id: EntityId): string;
  fromString(id: string): EntityId;
}

// MongoDB implementation
export class MongoDBIdAdapter implements IDatabaseIdAdapter {
  createId(): EntityId {
    const { ObjectId } = require('mongoose').Types;
    return new ObjectId().toString();
  }

  isValidId(id: EntityId): boolean {
    const { ObjectId } = require('mongoose').Types;
    return ObjectId.isValid(id);
  }

  toString(id: EntityId): string {
    return id;
  }

  fromString(id: string): EntityId {
    return id;
  }
}

// PostgreSQL implementation (example)
export class PostgreSQLIdAdapter implements IDatabaseIdAdapter {
  createId(): EntityId {
    // PostgreSQL için UUID veya serial ID kullanılabilir
    return randomUUID();
  }

  isValidId(id: EntityId): boolean {
    // UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  toString(id: EntityId): string {
    return id;
  }

  fromString(id: string): EntityId {
    return id;
  }
}

// Utility functions
export const toEntityId = (id: EntityId): string => {
  return id;
};

export const fromString = (id: string): EntityId => {
  return id;
};

// Ortak ID validasyonu - container bağımsız, hem UUID hem MongoDB ObjectId destekler
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MONGO_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/** JWT'deki userId'nin mevcut DB formatına uyup uymadığını kontrol eder. Uymazsa token geçersiz (farklı DB'den). */
export function isIdValidForDatabase(id: string, databaseType: string): boolean {
  const isPostgres =
    databaseType.toLowerCase() === 'postgresql';
  return isPostgres ? UUID_REGEX.test(id) : MONGO_OBJECTID_REGEX.test(id);
}

export function isValidEntityId(val: unknown): val is string {
  if (typeof val !== 'string' || val.length === 0) return false;
  return UUID_REGEX.test(val) || MONGO_OBJECTID_REGEX.test(val);
}

// Database ID factory - createId container gerektirir; isValidId isValidEntityId kullanır
export class DatabaseIdFactory {
  private static getAdapter(): IDatabaseIdAdapter {
    const { container } = require('../services/container');
    const { TOKENS } = require('../services/TOKENS');
    const adapter = container.resolve(TOKENS.IDatabaseAdapter) as { getIdAdapter(): IDatabaseIdAdapter };
    return adapter.getIdAdapter();
  }

  static createId(): EntityId {
    return DatabaseIdFactory.getAdapter().createId();
  }

  static isValidId(id: EntityId): boolean {
    return isValidEntityId(id);
  }

  static toString(id: EntityId): string {
    return id;
  }

  static fromString(id: string): EntityId {
    return id;
  }
}
