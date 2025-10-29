export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  meta?: any;
  pid?: number;
  hostname?: string;
}

export interface IElasticsearchLogShipper {
  shipLog(entry: LogEntry): Promise<void>;
  shipLogs(entries: LogEntry[]): Promise<void>;
  flush(): Promise<void>;
  isEnabled(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
}

