import { IDatabaseIdAdapter } from '../../types/database';

export interface IDatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getIdAdapter(): IDatabaseIdAdapter;
} 