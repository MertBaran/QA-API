/**
 * Projector Interface - Entity'den SearchDocument'a mapping yapar
 * Application katmanında kullanılır, Infrastructure detaylarını bilmez
 */
export interface IProjector<TEntity, TDoc> {
  /**
   * Entity'yi SearchDocument'a project eder
   * @param entity Entity instance
   * @returns SearchDocument instance
   */
  project(entity: TEntity): TDoc;

  /**
   * SearchDocument için index adı
   */
  readonly indexName: string;

  /**
   * Arama yapılacak field'lar
   */
  readonly searchFields: string[];
}
