import { ISemanticSearchService } from '../../../infrastructure/search/ISemanticSearchService';

/**
 * Fake Semantic Search Service for unit tests
 * Simulates ELSER semantic search behavior
 */
export class FakeSemanticSearchService implements ISemanticSearchService {
  private modelDeployed: boolean = false;
  private embeddings: Map<string, number[]> = new Map(); // text -> embedding

  constructor(modelDeployed: boolean = false) {
    this.modelDeployed = modelDeployed;
  }

  async generateQueryEmbedding(query: string, language: string): Promise<number[]> {
    // Generate a fake embedding vector (sparse vector simulation)
    if (!this.embeddings.has(query)) {
      // Create a simple sparse vector (mostly zeros, some random values)
      const embedding = new Array(384).fill(0);
      for (let i = 0; i < 10; i++) {
        embedding[Math.floor(Math.random() * 384)] = Math.random();
      }
      this.embeddings.set(query, embedding);
    }
    return this.embeddings.get(query)!;
  }

  async generateDocumentEmbedding(text: string, language: string): Promise<number[]> {
    return this.generateQueryEmbedding(text, language);
  }

  createSemanticQuery(queryEmbedding: number[], fieldName: string): any {
    return {
      text_expansion: {
        [fieldName]: {
          model_text: 'query', // In real ELSER, this would be the query text
          model_id: '.elser_model_2',
        },
      },
      boost: 1.0,
    };
  }

  // ELSER-specific methods (for testing)
  async isModelDeployed(): Promise<boolean> {
    return this.modelDeployed;
  }

  createSemanticQueryWithText(queryText: string, fieldName: string, boost: number = 1.0): any {
    return {
      text_expansion: {
        [fieldName]: {
          model_text: queryText,
          model_id: '.elser_model_2',
        },
      },
      boost,
    };
  }

  // Test helper methods
  setModelDeployed(deployed: boolean): void {
    this.modelDeployed = deployed;
  }

  clearEmbeddings(): void {
    this.embeddings.clear();
  }
}
