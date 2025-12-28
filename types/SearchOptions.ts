/**
 * Search Options Query Parameters - Arama seçenekleri için query parametreleri
 */
export interface SearchOptionsQueryParams {
  searchMode?: string;
  matchType?: string;
  typoTolerance?: string;
  smartSearch?: string;
  smartLinguistic?: string;
  smartSemantic?: string;
  language?: string; // Dil kodu (tr, en, de, vb.)
}

/**
 * Search Options - Arama seçenekleri
 */
export class SearchOptions {
  searchMode: 'phrase' | 'all_words' | 'any_word';
  matchType: 'fuzzy' | 'exact'; // smart kaldırıldı, ayrı checkbox olacak
  typoTolerance?: 'low' | 'medium' | 'high'; // Typo hatası tolerans seviyesi (sadece fuzzy modunda aktif)
  smartSearch?: boolean; // Akıllı arama açık/kapalı (checkbox)
  smartLinguistic?: boolean;
  smartSemantic?: boolean;
  language?: string; // Dil kodu (tr, en, de, vb.)

  constructor(
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance?: 'low' | 'medium' | 'high',
    smartSearch?: boolean,
    smartLinguistic?: boolean,
    smartSemantic?: boolean,
    language?: string
  ) {
    this.searchMode = searchMode;
    this.matchType = matchType;
    this.typoTolerance = typoTolerance;
    this.smartSearch = smartSearch;
    this.smartLinguistic = smartLinguistic;
    this.smartSemantic = smartSemantic;
    this.language = language;
  }

  /**
   * Query parametrelerinden SearchOptions oluşturur
   * Express query parametreleri string | string[] | undefined olabilir, bu yüzden string'e dönüştürülür
   */
  static fromQuery(query: {
    searchMode?: string | string[];
    matchType?: string | string[];
    typoTolerance?: string | string[];
    smartSearch?: string | string[];
    smartLinguistic?: string | string[];
    smartSemantic?: string | string[];
    language?: string | string[];
  }): SearchOptions {
    // Express query parametreleri array olabilir, ilk elemanı al
    const getString = (
      value: string | string[] | undefined
    ): string | undefined => {
      if (Array.isArray(value)) return value[0];
      return value;
    };

    const matchType = (getString(query.matchType) as 'fuzzy' | 'exact') || 'fuzzy';
    const smartSearch = getString(query.smartSearch) === 'true';

    return new SearchOptions(
      (getString(query.searchMode) as 'phrase' | 'all_words' | 'any_word') ||
        'any_word',
      matchType,
      getString(query.typoTolerance) as 'low' | 'medium' | 'high' | undefined,
      smartSearch,
      smartSearch ? (getString(query.smartLinguistic) === 'true') : undefined,
      smartSearch ? (getString(query.smartSemantic) === 'true') : undefined,
      getString(query.language)
    );
  }

  /**
   * Smart options objesini oluşturur (smartSearch === true ise)
   */
  toSmartOptions(): { linguistic?: boolean; semantic?: boolean } | undefined {
    if (!this.smartSearch) {
      return undefined;
    }
    return {
      linguistic: this.smartLinguistic || false,
      semantic: this.smartSemantic || false,
    };
  }
}
