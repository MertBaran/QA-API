export interface SearchFilters {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<TDoc = unknown> {
  hits: TDoc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search Client - SearchDocument'ları arar
 * Entity'leri değil, SearchDocument'ları döner
 */
export interface ISearchClient {
  /**
   * SearchDocument'ları arar
   * @param indexName Index adı
   * @param searchFields Arama yapılacak field'lar
   * @param query Arama sorgusu
   * @param options Arama seçenekleri
   */
  search<TDoc = unknown>(
    indexName: string,
    searchFields: string[],
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult<TDoc>>;

  /**
   * Index'i register et (self-registering projectors için)
   * @param indexName Index adı
   * @param searchFields Arama yapılacak field'lar
   */
  registerIndex(indexName: string, searchFields: string[]): void;

  /**
   * Tüm register edilmiş index'leri initialize et
   */
  initializeRegisteredIndexes(): Promise<void>;

  /**
   * Health check
   */
  isHealthy(): Promise<boolean>;
}
