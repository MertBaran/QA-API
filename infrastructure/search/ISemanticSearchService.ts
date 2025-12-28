/**
 * Semantic Search Service Interface - Anlamsal arama için
 * ELSER veya diğer semantic search stratejileri için soyut interface
 */
export interface ISemanticSearchService {
  /**
   * Query için embedding oluşturur
   * @param query Arama sorgusu
   * @param language Dil kodu
   * @returns Embedding vector
   */
  generateQueryEmbedding(query: string, language: string): Promise<number[]>;

  /**
   * Document için embedding oluşturur
   * @param text Document metni
   * @param language Dil kodu
   * @returns Embedding vector
   */
  generateDocumentEmbedding(text: string, language: string): Promise<number[]>;

  /**
   * Semantic search query oluşturur
   * @param queryEmbedding Query embedding vector
   * @param fieldName Vector field adı
   * @returns Elasticsearch query object
   */
  createSemanticQuery(queryEmbedding: number[], fieldName: string): any;
}
