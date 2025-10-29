/**
 * Search Document Types - Entity'lerden bağımsız arama dokümanları
 * Entity'leri "searchable" yapmak yerine ayrı SearchDocument tipleri kullanılır
 */

// Question Search Document
export interface QuestionSearchDoc {
  _id: string;
  title: string;
  content: string;
  slug: string;
  category?: string;
  tags?: string[];
  views?: number;
  createdAt: Date;
  user: string;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  likes: string[];
  answers: string[];
}

// Answer Search Document
export interface AnswerSearchDoc {
  _id: string;
  content: string;
  questionId: string;
  userId: string;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  likes: string[];
  isAccepted: boolean;
  createdAt: Date;
}
