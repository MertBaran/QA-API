#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

class TestEnvironmentManager {
  private apiProcess: ChildProcess | null = null;
  private isShuttingDown = false;

  constructor() {
    // Handle cleanup on exit
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('exit', () => this.shutdown());
  }

  async startTestAPI(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting QA API in TEST mode...');
      console.log('📊 Database: question-answer-test (SAFE!)');
      console.log('🔒 Environment: TEST');

      // Set test environment and start API
      const apiPath = path.resolve(__dirname, '../APP.ts');

      this.apiProcess = spawn('npx', ['ts-node', apiPath], {
        env: {
          ...process.env,
          NODE_ENV: 'test', // Force test environment
          PORT: '3000',
        },
        stdio: 'pipe',
      });

      let started = false;

      this.apiProcess.stdout?.on('data', data => {
        const output = data.toString();
        console.log(output);

        // Check if server has started successfully
        if (
          output.includes('Server is running on port 3000 : test') &&
          !started
        ) {
          started = true;
          console.log('\n✅ QA API started successfully in TEST mode!');
          console.log('🛡️  Using TEST database: question-answer-test');
          console.log('🎯 Ready for performance testing!\n');
          resolve(true);
        }
      });

      this.apiProcess.stderr?.on('data', data => {
        const error = data.toString();
        console.error('API Error:', error);

        if (!started) {
          reject(new Error(`Failed to start API: ${error}`));
        }
      });

      this.apiProcess.on('exit', code => {
        if (!this.isShuttingDown) {
          console.log(`\n⚠️  API process exited with code: ${code}`);
          if (!started) {
            reject(
              new Error(`API process exited before starting (code: ${code})`)
            );
          }
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!started) {
          this.shutdown();
          reject(new Error('Timeout: API failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }

  async checkTestDatabase(): Promise<boolean> {
    console.log('🔍 Verifying TEST database connection...');

    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:3000/api/questions', {
        stdio: 'pipe',
      });
      console.log('✅ TEST database connection verified');
      return true;
    } catch (_error) {
      console.log('❌ Failed to connect to API');
      return false;
    }
  }

  async waitForShutdown(): Promise<void> {
    console.log('\n🎯 QA API is running in TEST mode');
    console.log('📊 Database: question-answer-test');
    console.log('🔒 Port: 3000');
    console.log('\n📝 You can now run performance tests:');
    console.log('   npm run perf:setup     # Setup test users');
    console.log('   npm run perf:quick     # Quick test');
    console.log('   npm run perf:load      # Load test');
    console.log('   npm run perf:spike     # Spike test');
    console.log('   npm run perf:stress    # Stress test');
    console.log('\n💡 Press Ctrl+C to stop the test environment\n');

    // Keep the process alive
    return new Promise(() => {
      // This promise never resolves, keeping the process alive
      // until manual shutdown via Ctrl+C
    });
  }

  shutdown(): void {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('\n🛑 Shutting down test environment...');

    if (this.apiProcess) {
      console.log('🔄 Stopping QA API...');
      this.apiProcess.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.apiProcess && !this.apiProcess.killed) {
          console.log('⚡ Force killing API process...');
          this.apiProcess.kill('SIGKILL');
        }
      }, 5000);
    }

    console.log('✅ Test environment stopped');
    console.log('🛡️  Production database is safe!');
  }

  async run(): Promise<void> {
    try {
      console.log('🔧 QA Performance Test Environment');
      console.log('===================================');
      console.log('🛡️  This ensures tests run against TEST database');
      console.log('⚠️  NEVER run performance tests against production!\n');

      // Start API in test mode
      await this.startTestAPI();

      // Verify database connection
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for full startup
      const dbOk = await this.checkTestDatabase();

      if (!dbOk) {
        throw new Error('Database verification failed');
      }

      // Keep environment running
      await this.waitForShutdown();
    } catch (_error) {
      console.log('Error starting test environment:', _error);
    }
  }
}

// No need for fetch - using curl instead

// Run the environment manager
const manager = new TestEnvironmentManager();
manager.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
