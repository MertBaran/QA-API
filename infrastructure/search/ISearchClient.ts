export interface SearchFilters {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface SmartSearchOptions {
  linguistic?: boolean; // Synonym ve dilsel özellikler
  semantic?: boolean; // ELSER veya diğer semantic search
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  searchMode?: 'phrase' | 'all_words' | 'any_word'; // 'auto' kaldırıldı, varsayılan 'any_word'
  matchType?: 'fuzzy' | 'exact'; // Eşleşme tipi (smart kaldırıldı, ayrı checkbox olacak)
  typoTolerance?: 'low' | 'medium' | 'high'; // Typo hatası tolerans seviyesi (sadece fuzzy modunda aktif)
  smartSearch?: boolean; // Akıllı arama açık/kapalı (checkbox)
  smartOptions?: SmartSearchOptions; // Smart search açıksa linguistic/semantic seçenekleri
  excludeIds?: string[]; // Exclude these IDs from search results
  language?: string; // Dil kodu (tr, en, de, vb.) - synonym ve semantic search için
}

export interface SearchResult<TDoc = unknown> {
  hits: TDoc[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  warnings?: {
    semanticSearchUnavailable?: boolean; // ELSER model deploy edilmemişse true
  };
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
