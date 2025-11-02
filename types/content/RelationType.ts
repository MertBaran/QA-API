/**
 * Content Relation Types
 * Tanımlı ilişki türleri
 */
export enum RelationType {
  REPLY_TO_QUESTION = 'reply_to_question', // Bir soruya yanıt olarak soru sorulması
  REPLY_TO_ANSWER = 'reply_to_answer', // Bir cevaba yanıt olarak soru sorulması
  FOLLOW_UP = 'follow_up', // Takip soruları
  CLARIFICATION = 'clarification', // Açıklama isteme
  RELATED = 'related', // İlgili sorular
}

/**
 * İlişki metadatası
 */
export interface RelationMetadata {
  type: RelationType;
  description?: string;
  weight?: number; // İlişki ağırlığı (0-1 arası)
}

/**
 * İçerik türleri
 */
export enum ContentType {
  QUESTION = 'question',
  ANSWER = 'answer',
}

