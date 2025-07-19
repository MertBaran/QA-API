import crypto from 'crypto';

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
    return crypto.randomUUID();
  }

  isValidId(id: EntityId): boolean {
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

// Simplified Database ID factory that gets adapter from service container
export class DatabaseIdFactory {
  private static getAdapter(): IDatabaseIdAdapter {
    // Service container'dan adapter'ı al
    const { serviceContainer } = require('../services/container');
    return serviceContainer.getDatabaseAdapter().getIdAdapter();
  }

  static createId(): EntityId {
    return DatabaseIdFactory.getAdapter().createId();
  }

  static isValidId(id: EntityId): boolean {
    return DatabaseIdFactory.getAdapter().isValidId(id);
  }

  static toString(id: EntityId): string {
    return DatabaseIdFactory.getAdapter().toString(id);
  }

  static fromString(id: string): EntityId {
    return DatabaseIdFactory.getAdapter().fromString(id);
  }
} 