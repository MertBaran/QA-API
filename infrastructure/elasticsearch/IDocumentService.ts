/**
 * Generic Document Service Interface - Somut entity bilmez
 * Elasticsearch document işlemleri için generic interface
 */
export interface IDocumentService {
  indexDocument(
    indexName: string,
    id: string,
    document: Record<string, any>,
    pipeline?: string
  ): Promise<void>;

  updateDocument(
    indexName: string,
    id: string,
    document: Record<string, any>
  ): Promise<void>;

  deleteDocument(indexName: string, id: string): Promise<void>;

  createIndexIfNotExists(indexName: string, mapping: any): Promise<void>;
}
