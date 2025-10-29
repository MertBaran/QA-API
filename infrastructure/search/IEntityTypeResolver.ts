import { EntityType } from './EntityType';
import { ISearchableEntity } from './ISearchableEntity';

/**
 * Entity Type Resolver - ISearchableEntity'den EntityType çözer
 * Business katmanı spesifik EntityType'ları bilmez, sadece model instance'ından EntityType çeker
 */
export interface IEntityTypeResolver {
  /**
   * Model instance'ından EntityType çözer (ISearchableEntity marker'ı kullanarak)
   * @param entity ISearchableEntity instance
   * @returns EntityType instance
   */
  resolveFromEntity<T extends ISearchableEntity>(entity: T): EntityType<T>;

  /**
   * Model interface name'inden EntityType çözer
   * @param modelInterface Model interface adı ('IQuestionModel', 'IAnswerModel' vs.)
   * @returns EntityType instance
   */
  resolve<T = unknown>(modelInterface: string): EntityType<T>;

  /**
   * Tüm register edilmiş EntityType'ları döner
   * @returns Tüm EntityType instance'larının listesi
   */
  getAllEntityTypes(): EntityType[];
}
