#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  name: string;
  script: string;
  description: string;
  estimatedDuration: string;
}

const tests: TestConfig[] = [
  {
    name: 'qa-system-quick-test',
    script: './tests/qa-system-quick-test.ts',
    description:
      'Quick test with 5 users for 2 minutes - Basic functionality check',
    estimatedDuration: '2 minutes',
  },
  {
    name: 'qa-system-load-test',
    script: './tests/qa-system-load-test.ts',
    description:
      'Load test with up to 25 users for 18 minutes - Comprehensive load testing',
    estimatedDuration: '18 minutes',
  },
  {
    name: 'qa-system-spike-test',
    script: './tests/qa-system-spike-test.ts',
    description:
      'Spike test with sudden load increase to 50 users - Tests system resilience',
    estimatedDuration: '6 minutes',
  },
  {
    name: 'qa-system-stress-test',
    script: './tests/qa-system-stress-test.ts',
    description:
      'Stress test up to 100 users for 42 minutes - Tests system breaking points',
    estimatedDuration: '42 minutes',
  },
];

class TestRunner {
  private resultsDir = path.join(__dirname, 'results');

  constructor() {
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    console.log('🚀 QA System Performance Test Runner');
    console.log('====================================\n');
  }

  private generateResultFileName(testName: string): string {
    const timestamp = Date.now();
    return `${testName}-${timestamp}.json`;
  }

  private async runTest(testConfig: TestConfig): Promise<boolean> {
    const resultFileName = this.generateResultFileName(testConfig.name);
    const resultPath = path.join(this.resultsDir, resultFileName);

    console.log(`📊 Running: ${testConfig.name}`);
    console.log(`📝 Description: ${testConfig.description}`);
    console.log(`⏱️  Estimated Duration: ${testConfig.estimatedDuration}`);
    console.log(`📄 Results will be saved to: ${resultFileName}`);
    console.log(`🔄 Starting test...\n`);

    try {
      const command = `k6 run --out json=${resultPath} ${testConfig.script}`;
      console.log(`Command: ${command}\n`);

      const startTime = Date.now();

      execSync(command, {
        stdio: 'inherit',
        cwd: __dirname,
      });

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log(`\n✅ Test completed successfully!`);
      console.log(
        `⏱️  Actual Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`
      );
      console.log(`📊 Results saved to: ${resultFileName}\n`);

      // Show quick summary
      this.showQuickSummary(resultPath);

      return true;
    } catch (_e) {
      console.log('Error running test:', testConfig.name);
      return false;
    }
  }

  private showQuickSummary(resultPath: string): void {
    try {
      if (!fs.existsSync(resultPath)) {
        console.log('⚠️  Result file not found for summary');
        return;
      }

      const rawData = fs.readFileSync(resultPath, 'utf8');
      const lines = rawData.trim().split('\n');

      let totalRequests = 0;
      let failedRequests = 0;
      const responseTimes: number[] = [];
      let authSuccess = 0;
      let authTotal = 0;

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.metric === 'http_reqs' && data.type === 'Point') {
            totalRequests++;
            if (
              data.data.tags.status &&
              parseInt(data.data.tags.status) >= 400
            ) {
              failedRequests++;
            }
          }

          if (data.metric === 'http_req_duration' && data.type === 'Point') {
            responseTimes.push(data.data.value);
          }

          if (data.metric === 'auth_success' && data.type === 'Point') {
            authTotal++;
            if (data.data.value === 1) {
              authSuccess++;
            }
          }
        } catch (_e) {
          // Skip invalid JSON lines
        }
      }

      console.log('📈 Quick Summary:');
      console.log(`   Total Requests: ${totalRequests}`);
      console.log(
        `   Failed Requests: ${failedRequests} (${
          totalRequests > 0
            ? ((failedRequests / totalRequests) * 100).toFixed(2)
            : 0
        }%)`
      );
      console.log(
        `   Success Rate: ${
          totalRequests > 0
            ? (
                ((totalRequests - failedRequests) / totalRequests) *
                100
              ).toFixed(2)
            : 0
        }%`
      );

      if (responseTimes.length > 0) {
        responseTimes.sort((a, b) => a - b);
        const avg =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const p95Index = Math.floor(responseTimes.length * 0.95);
        console.log(`   Avg Response Time: ${avg.toFixed(2)}ms`);
        console.log(
          `   P95 Response Time: ${
            responseTimes[p95Index] ? responseTimes[p95Index].toFixed(2) : 'N/A'
          }ms`
        );
      }

      if (authTotal > 0) {
        console.log(
          `   Auth Success Rate: ${((authSuccess / authTotal) * 100).toFixed(
            2
          )}%`
        );
      }

      console.log('');
    } catch (_error) {
      console.log('⚠️  Could not generate summary:', _error);
    }
  }

  private listAvailableTests(): void {
    console.log('📋 Available Tests:');
    tests.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.name}`);
      console.log(`   ${test.description}`);
      console.log(`   Duration: ${test.estimatedDuration}`);
    });
    console.log('');
  }

  private async runAllTests(): Promise<void> {
    console.log('🔄 Running all tests sequentially...\n');

    let successCount = 0;
    const totalCount = tests.length;

    for (const test of tests) {
      const success = await this.runTest(test);
      if (success) {
        successCount++;
      }

      // Wait between tests
      if (test !== tests[tests.length - 1]) {
        console.log('⏳ Waiting 30 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    console.log('🏁 All Tests Completed!');
    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);

    if (successCount === totalCount) {
      console.log('🎉 All tests passed successfully!');
    }
  }

  private async runSpecificTest(testName: string): Promise<void> {
    const test = tests.find(t => t.name === testName);

    if (!test) {
      console.error(`❌ Test "${testName}" not found!`);
      console.log('Available tests:');
      tests.forEach(t => console.log(`  - ${t.name}`));
      return;
    }

    await this.runTest(test);
  }

  private checkPrerequisites(): boolean {
    console.log('🔍 Checking prerequisites...');

    try {
      execSync('k6 version', { stdio: 'pipe' });
      console.log('✅ K6 is installed');
    } catch (_error) {
      console.error('❌ K6 is not installed. Please install K6 first:');
      console.log('   https://k6.io/docs/getting-started/installation/');
      return false;
    }

    // Check if API is running
    try {
      execSync('curl -s http://localhost:3000/api/questions', {
        stdio: 'pipe',
      });
      console.log('✅ QA API is running on localhost:3000');
    } catch (_error) {
      console.error('❌ QA API is not running on localhost:3000');
      console.log('   Please start your QA API server first with:');
      console.log('   npm run perf:env');
      return false;
    }

    // Safety warning
    console.log('\n🛡️  SAFETY CHECK:');
    console.log('   Make sure you started API with: npm run perf:env');
    console.log(
      '   This ensures tests use TEST database (question-answer-test)'
    );
    console.log('   NEVER run performance tests against production!');

    console.log('\n✅ All prerequisites met\n');
    return true;
  }

  public async run(): Promise<void> {
    const args = process.argv.slice(2);

    if (!this.checkPrerequisites()) {
      process.exit(1);
    }

    if (args.length === 0) {
      this.listAvailableTests();
      console.log('Usage:');
      console.log('  npm run perf:test                    # Show this help');
      console.log('  npm run perf:test all                # Run all tests');
      console.log('  npm run perf:quick                   # Run quick test');
      console.log('  npm run perf:load                    # Run load test');
      console.log('  npm run perf:spike                   # Run spike test');
      console.log('  npm run perf:stress                  # Run stress test');
      return;
    }

    const command = args[0];

    switch (command) {
      case 'all':
        await this.runAllTests();
        break;
      case 'quick':
        await this.runSpecificTest('qa-system-quick-test');
        break;
      case 'load':
        await this.runSpecificTest('qa-system-load-test');
        break;
      case 'spike':
        await this.runSpecificTest('qa-system-spike-test');
        break;
      case 'stress':
        await this.runSpecificTest('qa-system-stress-test');
        break;
      default:
        if (command) {
          await this.runSpecificTest(command);
        } else {
          console.log('❌ No command provided');
        }
        break;
    }
  }
}

// Run the test runner
const runner = new TestRunner();
runner.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
