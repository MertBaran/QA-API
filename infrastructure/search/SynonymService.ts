import { injectable, inject } from 'tsyringe';
import { ISynonymService } from './ISynonymService';
import { ILoggerProvider } from '../logging/ILoggerProvider';

/**
 * Synonym Service Implementation
 * Şu an için basit bir implementation - gelecekte veritabanı veya API'den synonym'ler çekilebilir
 */
@injectable()
export class SynonymService implements ISynonymService {
  constructor(
    @inject('ILoggerProvider')
    private logger: ILoggerProvider
  ) {}

  /**
   * Verilen kelime için eş anlamlıları döner
   * Şu an için boş array döner - gelecekte implement edilebilir
   */
  async getSynonyms(word: string, language: string): Promise<string[]> {
    // TODO: Veritabanı veya API'den synonym'leri çek
    // Şu an için boş array döner
    this.logger.debug('Synonym lookup requested', { word, language });
    return [];
  }

  /**
   * Verilen kelimeler için tüm eş anlamlıları döner
   */
  async getAllSynonyms(words: string[], language: string): Promise<string[]> {
    // TODO: Her kelime için synonym'leri çek ve birleştir
    // Şu an için boş array döner
    this.logger.debug('Synonym lookup requested for multiple words', {
      words,
      language,
    });
    return [];
  }
}
