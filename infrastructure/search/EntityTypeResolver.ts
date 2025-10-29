import { injectable, inject } from 'tsyringe';
import { EntityType } from './EntityType';
import { IEntityTypeResolver } from './IEntityTypeResolver';
import { ISearchableEntity } from './ISearchableEntity';

// Interface tanımı burada
export interface IEntityTypeRegistry {
  registerFromMetadata<T>(metadata: any): void;
  register<T>(modelInterface: string, entityType: EntityType<T>): void;
  get<T>(modelInterface: string): EntityType<T> | null;
  getAll(): EntityType[];
}

/**
 * Entity Type Resolver Implementation
 * ISearchableEntity'den veya model interface name'den EntityType çözer
 */
@injectable()
export class EntityTypeResolver implements IEntityTypeResolver {
  // Entity instance'ından EntityType resolve etmek için constructor name kullan
  private readonly entityTypeMap = new Map<Function | string, string>();

  constructor(
    @inject('IEntityTypeRegistry')
    private entityTypeRegistry: IEntityTypeRegistry
  ) {
    // Runtime'da entity constructor name'lerini model interface name'lerine map et
    // Bu mapping EntityType tanımlanırken yapılabilir
    this.initializeEntityTypeMap();
  }

  private initializeEntityTypeMap(): void {
    // Bu method runtime'da entity constructor'larını EntityType'larla eşleştirir
    // Şimdilik registry'deki tüm EntityType'ları kullan
    // Gerçek implementasyonda entity instance'larının constructor'ları ile eşleşme yapılacak
  }

  resolveFromEntity<T extends ISearchableEntity>(entity: T): EntityType<T> {
    // Entity'nin static getEntityTypeMetadata method'unu kullan
    const constructor = entity.constructor as any;
    if (
      constructor &&
      typeof constructor.getEntityTypeMetadata === 'function'
    ) {
      const metadata = constructor.getEntityTypeMetadata();
      if (metadata) {
        const entityType = this.entityTypeRegistry.get<T>(
          metadata.modelInterface
        ) as EntityType<T>;
        if (!entityType) {
          throw new Error(
            `EntityType not found for model interface: ${metadata.modelInterface}`
          );
        }
        return entityType;
      }
    }

    // Fallback: Constructor name'den model interface name'e map et
    const constructorName = entity.constructor?.name || '';
    const modelInterface = this.getModelInterfaceName(constructorName);

    if (!modelInterface) {
      throw new Error(
        `Model interface not found for entity: ${constructorName}`
      );
    }

    const entityType = this.entityTypeRegistry.get<T>(
      modelInterface
    ) as EntityType<T>;
    if (!entityType) {
      throw new Error(
        `EntityType not found for model interface: ${modelInterface}`
      );
    }
    return entityType;
  }

  private getModelInterfaceName(constructorName: string): string | null {
    // Constructor name'den model interface name'e mapping
    // Bu mapping'i EntityType tanımlarken yapabiliriz veya convention kullanabiliriz
    const mapping: Record<string, string> = {
      Question: 'IQuestionModel',
      Answer: 'IAnswerModel',
      // MongoDB model'lerinden gelen isimler
      IQuestionMongo: 'IQuestionModel',
      IAnswerMongo: 'IAnswerModel',
    };

    return mapping[constructorName] || null;
  }

  resolve<T = unknown>(modelInterface: string): EntityType<T> {
    const entityType = this.entityTypeRegistry.get<T>(
      modelInterface
    ) as EntityType<T>;
    if (!entityType) {
      throw new Error(
        `EntityType not found for model interface: ${modelInterface}`
      );
    }
    return entityType;
  }

  getAllEntityTypes(): EntityType[] {
    return this.entityTypeRegistry.getAll();
  }
}
