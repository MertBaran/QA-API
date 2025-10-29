export type IndexOperation = 'index' | 'update' | 'delete';

export interface SyncPayload<TDoc = unknown> {
  document: TDoc | string; // string for delete operations
  indexName: string;
  operation: IndexOperation;
}

/**
 * Index Client - SearchDocument'ları index'ler
 * Entity'leri değil, SearchDocument'ları kullanır
 */
export interface IIndexClient {
  /**
   * SearchDocument'ı index'le
   * @param indexName Index adı
   * @param operation Index işlemi (index/update/delete)
   * @param document SearchDocument veya ID (delete için)
   */
  sync<TDoc = unknown>(
    indexName: string,
    operation: IndexOperation,
    document: TDoc | string
  ): Promise<void>;

  /**
   * Payload ile sync
   */
  syncWithPayload<TDoc = unknown>(payload: SyncPayload<TDoc>): Promise<void>;

  /**
   * Toplu sync
   */
  bulkSync<TDoc = unknown>(payloads: SyncPayload<TDoc>[]): Promise<void>;
}
