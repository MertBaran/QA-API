import { Client, estypes } from '@elastic/elasticsearch';
import { IElasticsearchClient } from '../../../infrastructure/elasticsearch/IElasticsearchClient';
import { SearchResult } from '../../../infrastructure/search/ISearchClient';

/**
 * Fake Elasticsearch Client for unit tests
 */
export class FakeElasticsearchClient implements IElasticsearchClient {
  private indices: Map<string, boolean> = new Map();
  private documents: Map<string, Map<string, any>> = new Map(); // indexName -> docId -> document
  private searchResults: Map<string, SearchResult<any>> = new Map(); // query -> result
  private client: Client;

  constructor() {
    // Create a minimal mock client
    this.client = {
      indices: {
        exists: jest.fn().mockImplementation(async ({ index }: { index: string }) => {
          return this.indices.has(index);
        }),
        create: jest.fn().mockImplementation(async ({ index }: { index: string }) => {
          this.indices.set(index, true);
          this.documents.set(index, new Map());
          return { acknowledged: true, index };
        }),
        delete: jest.fn().mockImplementation(async ({ index }: { index: string }) => {
          this.indices.delete(index);
          this.documents.delete(index);
          return { acknowledged: true };
        }),
      },
      search: jest.fn().mockImplementation(async ({ index, from = 0, size = 10, query }: any) => {
        const indexDocs = this.documents.get(index) || new Map();
        const allDocs = Array.from(indexDocs.values());
        
        // Simple query matching (for testing purposes)
        let filteredDocs = allDocs;
        if (query && query.bool) {
          // Handle exclude IDs first (must_not clauses)
          const excludeIds: string[] = [];
          if (query.bool.must) {
            // Extract exclude IDs from must clauses
            query.bool.must.forEach((clause: any) => {
              if (clause.bool && clause.bool.must_not) {
                if (clause.bool.must_not.terms && clause.bool.must_not.terms._id) {
                  excludeIds.push(...clause.bool.must_not.terms._id.map((id: any) => String(id)));
                }
              }
            });
            
            // Filter out excluded IDs first
            if (excludeIds.length > 0) {
              filteredDocs = allDocs.filter((doc: any) => {
                const docId = String(doc._id || '');
                return !excludeIds.includes(docId);
              });
            }
            
            // Apply other must clauses (excluding the exclude IDs clause)
            const otherMustClauses = query.bool.must.filter((clause: any) => 
              !(clause.bool && clause.bool.must_not && clause.bool.must_not.terms && clause.bool.must_not.terms._id)
            );
            if (otherMustClauses.length > 0) {
              filteredDocs = this.applyMustClauses(filteredDocs, otherMustClauses);
            }
          }
          if (query.bool.should && query.bool.minimum_should_match) {
            filteredDocs = this.applyShouldClauses(filteredDocs, query.bool.should, query.bool.minimum_should_match);
          }
        }

        const paginatedDocs = filteredDocs.slice(from, from + size);
        const total = filteredDocs.length;

        return {
          hits: {
            hits: paginatedDocs.map((doc: any) => ({
              _id: doc._id || String(Math.random()),
              _source: doc,
              _score: 1.0,
            })),
            total: {
              value: total,
              relation: 'eq' as const,
            },
          },
        };
      }),
      index: jest.fn().mockImplementation(async ({ index, id, document }: any) => {
        if (!this.documents.has(index)) {
          this.documents.set(index, new Map());
        }
        const indexDocs = this.documents.get(index)!;
        indexDocs.set(id, { ...document, _id: id });
        return { _id: id, result: 'created' };
      }),
      update: jest.fn().mockImplementation(async ({ index, id, doc }: any) => {
        const indexDocs = this.documents.get(index);
        if (indexDocs && indexDocs.has(id)) {
          const existing = indexDocs.get(id);
          indexDocs.set(id, { ...existing, ...doc });
          return { _id: id, result: 'updated' };
        }
        throw new Error('Document not found');
      }),
      delete: jest.fn().mockImplementation(async ({ index, id }: any) => {
        const indexDocs = this.documents.get(index);
        if (indexDocs) {
          indexDocs.delete(id);
          return { _id: id, result: 'deleted' };
        }
        return { _id: id, result: 'not_found' };
      }),
      transport: {
        request: jest.fn().mockImplementation(async ({ method, path, body }: any) => {
          if (method === 'PUT' && path.startsWith('/')) {
            const indexName = path.substring(1);
            this.indices.set(indexName, true);
            if (!this.documents.has(indexName)) {
              this.documents.set(indexName, new Map());
            }
            return { acknowledged: true, index: indexName };
          }
          return { acknowledged: true };
        }),
      },
    } as any;
  }

  getClient(): Client {
    return this.client;
  }

  async isConnected(): Promise<boolean> {
    return true;
  }

  async healthCheck(): Promise<{ status: string; message?: string }> {
    return { status: 'green', message: 'Fake client is healthy' };
  }

  async close(): Promise<void> {
    // Cleanup
    this.indices.clear();
    this.documents.clear();
    this.searchResults.clear();
  }

  // Helper methods for test setup
  setIndexExists(indexName: string, exists: boolean): void {
    if (exists) {
      this.indices.set(indexName, true);
      if (!this.documents.has(indexName)) {
        this.documents.set(indexName, new Map());
      }
    } else {
      this.indices.delete(indexName);
    }
  }

  addDocument(indexName: string, id: string, document: any): void {
    if (!this.documents.has(indexName)) {
      this.documents.set(indexName, new Map());
    }
    this.documents.get(indexName)!.set(id, { ...document, _id: id });
  }

  getDocument(indexName: string, id: string): any {
    return this.documents.get(indexName)?.get(id);
  }

  clearIndex(indexName: string): void {
    this.documents.get(indexName)?.clear();
  }

  // Simple query matching helpers
  private applyMustClauses(docs: any[], clauses: any[]): any[] {
    return docs.filter(doc => {
      return clauses.every(clause => {
        if (clause.match_all) return true;
        if (clause.match) {
          const field = Object.keys(clause.match)[0];
          const query = clause.match[field].query;
          const fieldValue = this.getNestedValue(doc, field);
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(query.toLowerCase());
          }
        }
        if (clause.bool) {
          if (clause.bool.must_not) {
            // Handle both array and object forms of must_not
            const mustNotClauses = Array.isArray(clause.bool.must_not) 
              ? clause.bool.must_not 
              : [clause.bool.must_not];
            return !this.applyMustNotClauses([doc], mustNotClauses).length;
          }
        }
        return true;
      });
    });
  }

  private applyShouldClauses(docs: any[], clauses: any[], minimumShouldMatch: number): any[] {
    return docs.filter(doc => {
      let matchCount = 0;
      clauses.forEach(clause => {
        if (clause.match) {
          const field = Object.keys(clause.match)[0];
          const query = clause.match[field].query;
          const fieldValue = this.getNestedValue(doc, field);
          if (typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(query.toLowerCase())) {
            matchCount++;
          }
        }
      });
      return matchCount >= minimumShouldMatch;
    });
  }

  private applyMustNotClauses(docs: any[], clauses: any[]): any[] {
    return docs.filter(doc => {
      return clauses.every(clause => {
        if (clause.terms) {
          const field = Object.keys(clause.terms)[0];
          const values = clause.terms[field];
          const fieldValue = this.getNestedValue(doc, field);
          // Handle _id field specially
          if (field === '_id') {
            return !values.includes(String(fieldValue));
          }
          return !values.includes(fieldValue);
        }
        return true;
      });
    });
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    return value;
  }
}
