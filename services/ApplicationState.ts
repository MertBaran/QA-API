export class ApplicationState {
  private static instance: ApplicationState;
  private _isReady = false;
  private _config: any = null;
  private _startTime = Date.now();

  private constructor() {}

  static getInstance(): ApplicationState {
    if (!ApplicationState.instance) {
      ApplicationState.instance = new ApplicationState();
    }
    return ApplicationState.instance;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  get config(): any {
    return this._config;
  }

  get startTime(): number {
    return this._startTime;
  }

  setReady(config: any): void {
    this._isReady = true;
    this._config = config;
  }

  getMemoryUsage() {
    const memory = process.memoryUsage();
    const used = Math.round(memory.heapUsed / 1024 / 1024); // MB
    const total = Math.round(memory.heapTotal / 1024 / 1024); // MB
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  }

  getUptime(): number {
    return Date.now() - this._startTime;
  }
}
