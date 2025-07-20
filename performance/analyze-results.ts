#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

class ResultsAnalyzer {
  private resultsDir = path.join(__dirname, 'results');

  constructor() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log('❌ No results directory found. Run tests first.');
      process.exit(1);
    }
  }

  private analyzeFile(filePath: string): void {
    try {
      const fileName = path.basename(filePath, '.json');
      const rawData = fs.readFileSync(filePath, 'utf8');
      const lines = rawData.trim().split('\n');
      const stats = fs.statSync(filePath);

      let totalRequests = 0;
      let failedRequests = 0;
      const responseTimes: number[] = [];
      let authSuccess = 0;
      let authTotal = 0;
      let questionSuccess = 0;
      let questionTotal = 0;
      let answerSuccess = 0;
      let answerTotal = 0;
      let maxUsers = 0;

      const endpointStats: {
        [key: string]: { total: number; failed: number; times: number[] };
      } = {};

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === 'Point') {
            const metricName = data.metric;
            const value = data.data.value;
            const tags = data.data.tags || {};

            switch (metricName) {
              case 'http_reqs':
                totalRequests++;
                if (tags.status && parseInt(tags.status) >= 400) {
                  failedRequests++;
                }

                if (tags.name && tags.method) {
                  const endpoint = `${tags.method} ${this.extractPath(
                    tags.name
                  )}`;
                  if (!endpointStats[endpoint]) {
                    endpointStats[endpoint] = {
                      total: 0,
                      failed: 0,
                      times: [],
                    };
                  }
                  endpointStats[endpoint].total++;
                  if (tags.status && parseInt(tags.status) >= 400) {
                    endpointStats[endpoint].failed++;
                  }
                }
                break;

              case 'http_req_duration':
                responseTimes.push(value);
                if (tags.name && tags.method) {
                  const endpoint = `${tags.method} ${this.extractPath(
                    tags.name
                  )}`;
                  if (endpointStats[endpoint]) {
                    endpointStats[endpoint].times.push(value);
                  }
                }
                break;

              case 'auth_success':
                authTotal++;
                if (value === 1) authSuccess++;
                break;

              case 'question_creation_success':
                questionTotal++;
                if (value === 1) questionSuccess++;
                break;

              case 'answer_creation_success':
                answerTotal++;
                if (value === 1) answerSuccess++;
                break;

              case 'vus_max':
                maxUsers = Math.max(maxUsers, value);
                break;
            }
          }
        } catch (_e) {
          // Skip invalid lines
        }
      }

      // Display results
      console.log(`📊 Test: ${fileName}`);
      console.log(`📅 Date: ${stats.mtime.toLocaleString()}`);
      console.log('');

      console.log('🚀 Overall Performance:');
      console.log(`   Total Requests: ${totalRequests.toLocaleString()}`);
      console.log(`   Failed Requests: ${failedRequests.toLocaleString()}`);
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
      console.log('');

      if (responseTimes.length > 0) {
        responseTimes.sort((a, b) => a - b);
        const avg =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
        const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];

        console.log('⏱️  Response Times:');
        console.log(`   Average: ${avg.toFixed(2)}ms`);
        console.log(`   P50 (Median): ${p50 ? p50.toFixed(2) : 'N/A'}ms`);
        console.log(`   P95: ${p95 ? p95.toFixed(2) : 'N/A'}ms`);
        console.log(`   Max: ${Math.max(...responseTimes).toFixed(2)}ms`);
        console.log(`   Min: ${Math.min(...responseTimes).toFixed(2)}ms`);
        console.log('');
      }

      if (maxUsers > 0) {
        console.log('👥 User Load:');
        console.log(`   Max Concurrent Users: ${maxUsers}`);
        console.log('');
      }

      if (authTotal > 0) {
        console.log('🔐 Authentication:');
        console.log(
          `   Success Rate: ${((authSuccess / authTotal) * 100).toFixed(
            2
          )}% (${authSuccess}/${authTotal})`
        );
        console.log('');
      }

      if (questionTotal > 0) {
        console.log('❓ Question Creation:');
        console.log(
          `   Success Rate: ${((questionSuccess / questionTotal) * 100).toFixed(
            2
          )}% (${questionSuccess}/${questionTotal})`
        );
        console.log('');
      }

      if (answerTotal > 0) {
        console.log('💬 Answer Creation:');
        console.log(
          `   Success Rate: ${((answerSuccess / answerTotal) * 100).toFixed(
            2
          )}% (${answerSuccess}/${answerTotal})`
        );
        console.log('');
      }

      // Top endpoints
      const sortedEndpoints = Object.keys(endpointStats)
        .sort((a, b) => {
          const statsA = endpointStats[a];
          const statsB = endpointStats[b];
          if (!statsA || !statsB) return 0;
          return statsB.total - statsA.total;
        })
        .slice(0, 8);

      if (sortedEndpoints.length > 0) {
        console.log('🌐 Top Endpoints:');
        sortedEndpoints.forEach(endpoint => {
          const stats = endpointStats[endpoint];
          if (!stats) return;

          const successRate =
            ((stats.total - stats.failed) / stats.total) * 100;
          const avgTime =
            stats.times.length > 0
              ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
              : 0;

          console.log(`   ${endpoint}:`);
          console.log(`     Requests: ${stats.total.toLocaleString()}`);
          console.log(`     Success Rate: ${successRate.toFixed(2)}%`);
          console.log(`     Avg Response: ${avgTime.toFixed(2)}ms`);
        });
        console.log('');
      }
    } catch (_e) {
      console.log('Error reading file:', filePath);
    }
  }

  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/\/[0-9a-f]{24}/g, '/:id');
    } catch {
      return url;
    }
  }

  public listResults(): void {
    const files = fs
      .readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(this.resultsDir, a));
        const statB = fs.statSync(path.join(this.resultsDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

    if (files.length === 0) {
      console.log('❌ No test results found. Run tests first.');
      return;
    }

    console.log('📋 Available Test Results:\n');

    files.forEach((file, index) => {
      const filePath = path.join(this.resultsDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);

      console.log(`${index + 1}. ${file}`);
      console.log(`   Size: ${size} KB`);
      console.log(`   Date: ${stats.mtime.toLocaleString()}`);
      console.log('');
    });
  }

  public analyzeLatest(count: number = 3): void {
    const files = fs
      .readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(this.resultsDir, a));
        const statB = fs.statSync(path.join(this.resultsDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

    if (files.length === 0) {
      console.log('❌ No test results found.');
      return;
    }

    console.log(`📈 Latest ${Math.min(count, files.length)} Test Results:\n`);

    files.slice(0, count).forEach((file, index) => {
      console.log(`${'='.repeat(80)}`);
      console.log(`📊 RESULT ${index + 1}/${Math.min(count, files.length)}`);
      console.log(`${'='.repeat(80)}`);

      const filePath = path.join(this.resultsDir, file);
      this.analyzeFile(filePath);
      console.log('');
    });
  }

  public run(): void {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('🚀 QA Performance Results Analyzer');
      console.log('==================================\n');
      console.log('Usage:');
      console.log(
        '  npm run analyze                     # Show this help + list results'
      );
      console.log('  npm run analyze list                # List all results');
      console.log(
        '  npm run analyze latest              # Analyze latest 3 results'
      );
      console.log(
        '  npm run analyze latest 5            # Analyze latest 5 results'
      );
      console.log('');
      this.listResults();
      return;
    }

    const command = args[0];

    switch (command) {
      case 'list':
        this.listResults();
        break;
      case 'latest': {
        const count = args[1] ? parseInt(args[1]) : 3;
        this.analyzeLatest(count);
        break;
      }
      default:
        console.log(`❌ Unknown command: ${command}`);
        this.run();
        break;
    }
  }
}

// Run the analyzer
const analyzer = new ResultsAnalyzer();
analyzer.run();
