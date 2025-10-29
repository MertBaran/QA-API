import { EntityTypeMetadata } from './ISearchableEntity';

export interface IEntityTypeRegistry {
  registerFromMetadata<T>(metadata: EntityTypeMetadata<T>): void;
  register<T>(modelInterface: string, entityType: EntityType<T>): void;
  get<T>(modelInterface: string): EntityType<T> | null;
  getAll(): EntityType[];
}

export class EntityType<T = any> {
  constructor(public readonly metadata: EntityTypeMetadata<T>) {}

  // Convenience getters
  get indexName(): string {
    return this.metadata.indexName;
  }

  get searchFields(): string[] {
    return this.metadata.searchFields;
  }

  getId(entity: T | string): string {
    return this.metadata.getId(entity);
  }

  extractSearchableContent(entity: T): Record<string, any> {
    return this.metadata.extractSearchableContent(entity);
  }
}

export class EntityTypeRegistry implements IEntityTypeRegistry {
  private static instance: IEntityTypeRegistry;
  private registry = new Map<string, EntityType>();

  static getInstance(): IEntityTypeRegistry {
    if (!this.instance) {
      this.instance = new EntityTypeRegistry();
    }
    return this.instance;
  }

  registerFromMetadata<T>(metadata: EntityTypeMetadata<T>): void {
    const entityType = new EntityType<T>(metadata);
    this.registry.set(metadata.modelInterface, entityType);
  }

  register<T>(modelInterface: string, entityType: EntityType<T>): void {
    this.registry.set(modelInterface, entityType);
  }

  get<T>(modelInterface: string): EntityType<T> | null {
    return (this.registry.get(modelInterface) as EntityType<T>) || null;
  }

  getAll(): EntityType[] {
    return Array.from(this.registry.values());
  }
}

// Backward compatibility - static methods delegate to instance
export class StaticEntityTypeRegistry {
  static registerFromMetadata<T>(metadata: EntityTypeMetadata<T>): void {
    EntityTypeRegistry.getInstance().registerFromMetadata(metadata);
  }

  static register<T>(modelInterface: string, entityType: EntityType<T>): void {
    EntityTypeRegistry.getInstance().register(modelInterface, entityType);
  }

  static get<T>(modelInterface: string): EntityType<T> | null {
    return EntityTypeRegistry.getInstance().get<T>(modelInterface);
  }

  static getAll(): EntityType[] {
    return EntityTypeRegistry.getInstance().getAll();
  }
}
