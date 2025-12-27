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
  dislikes: string[];
  answers: string[];
  relatedContents?: string[];
  thumbnailUrl?: string;
  // Hierarchical fields
  parent?: {
    id: string;
    type: string;
  };
  ancestorsIds?: string[];
  ancestorsTypes?: string[];
  rootId?: string;
  depth?: number;
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
  dislikes: string[];
  isAccepted: boolean;
  createdAt: Date;
  // Hierarchical fields
  parent?: {
    id: string;
    type: string;
  };
  ancestorsIds?: string[];
  ancestorsTypes?: string[];
  rootId?: string;
  depth?: number;
}
