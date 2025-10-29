/**
 * Searchable Entity Marker Interface
 * Model interface'leri bu interface'i extend ederek searchable olduklarını belirtir
 *
 * Örnek:
 * export interface IQuestionModel extends ISearchableEntity {
 *   _id: string;
 *   title: string;
 *   ...
 * }
 */
export interface ISearchableEntity {
  // Marker property - bu interface'i extend eden entity'ler searchable'dır
  // Runtime'da kullanılmaz, sadece type-check için
}

/**
 * Entity Type Metadata - Model interface bazlı metadata tanımı
 */
export interface EntityTypeMetadata<T = any> {
  // Model interface adı ('IQuestionModel', 'IAnswerModel' vs.)
  readonly modelInterface: string;

  // Elasticsearch index adı
  readonly indexName: string;

  // Entity ID'sini extract eden fonksiyon
  getId(entity: T | string): string;

  // Entity'yi searchable format'a dönüştüren fonksiyon
  extractSearchableContent(entity: T): Record<string, any>;

  // Arama yapılacak alanlar listesi
  readonly searchFields: string[];
}
