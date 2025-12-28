import { ISynonymService } from '../../../infrastructure/search/ISynonymService';

/**
 * Fake Synonym Service for unit tests
 */
export class FakeSynonymService implements ISynonymService {
  private synonyms: Map<string, Map<string, string[]>> = new Map(); // language -> word -> synonyms[]

  constructor() {
    // Setup some default synonyms for testing
    this.setupDefaultSynonyms();
  }

  async getSynonyms(word: string, language: string): Promise<string[]> {
    const langMap = this.synonyms.get(language);
    if (!langMap) {
      return [];
    }
    return langMap.get(word.toLowerCase()) || [];
  }

  async getAllSynonyms(words: string[], language: string): Promise<string[]> {
    const allSynonyms: string[] = [];
    for (const word of words) {
      const wordSynonyms = await this.getSynonyms(word, language);
      allSynonyms.push(...wordSynonyms);
    }
    return Array.from(new Set(allSynonyms)); // Remove duplicates
  }

  // Test helper methods
  addSynonym(word: string, synonym: string, language: string = 'tr'): void {
    if (!this.synonyms.has(language)) {
      this.synonyms.set(language, new Map());
    }
    const langMap = this.synonyms.get(language)!;
    const wordLower = word.toLowerCase();
    if (!langMap.has(wordLower)) {
      langMap.set(wordLower, []);
    }
    const synonyms = langMap.get(wordLower)!;
    if (!synonyms.includes(synonym.toLowerCase())) {
      synonyms.push(synonym.toLowerCase());
    }
  }

  clearSynonyms(language?: string): void {
    if (language) {
      this.synonyms.delete(language);
    } else {
      this.synonyms.clear();
    }
  }

  private setupDefaultSynonyms(): void {
    // Turkish synonyms
    this.addSynonym('test', 'deneme', 'tr');
    this.addSynonym('test', 'sınav', 'tr');
    this.addSynonym('hello', 'merhaba', 'tr');
    this.addSynonym('hello', 'selam', 'tr');
    this.addSynonym('programlama', 'kodlama', 'tr');
    this.addSynonym('programlama', 'yazılım', 'tr');

    // English synonyms
    this.addSynonym('test', 'exam', 'en');
    this.addSynonym('test', 'quiz', 'en');
    this.addSynonym('hello', 'hi', 'en');
    this.addSynonym('hello', 'greetings', 'en');
  }
}
