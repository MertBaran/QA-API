/**
 * Synonym Service Interface - Eş anlamlı kelimeler için
 */
export interface ISynonymService {
  /**
   * Verilen kelime için eş anlamlıları döner
   * @param word Kelime
   * @param language Dil kodu (tr, en, de, vb.)
   * @returns Eş anlamlı kelimeler listesi
   */
  getSynonyms(word: string, language: string): Promise<string[]>;

  /**
   * Verilen kelimeler için tüm eş anlamlıları döner
   * @param words Kelimeler listesi
   * @param language Dil kodu
   * @returns Eş anlamlı kelimeler listesi (birleştirilmiş)
   */
  getAllSynonyms(words: string[], language: string): Promise<string[]>;
}
