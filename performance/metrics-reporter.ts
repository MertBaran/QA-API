import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface TestMetrics {
  testName: string;
  duration: string;
  iterations: number;
  vus: number;
  http_req_duration: {
    avg: number;
    med: number;
    p95: number;
    p99: number;
  };
  http_req_rate: number;
  http_req_failed: number;
  http_req_total: number;
  http_req_failed_rate: number;
  i18n_metrics?: {
    language_tests: number;
    cache_efficiency: number;
    multilingual_requests: number;
  };
  endpoints: {
    [key: string]: {
      count: number;
      avg_duration: number;
      failed_count: number;
      success_rate: number;
    };
  };
}

class MetricsReporter {
  private resultsDir: string;
  private reportsDir: string;

  constructor() {
    this.resultsDir = path.join(__dirname, "results");
    this.reportsDir = path.join(__dirname, "reports");

    // Create directories if they don't exist
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runTestWithMetrics(
    testFile: string,
    testName: string
  ): Promise<TestMetrics> {
    console.log(`🚀 Running ${testName} with detailed metrics...`);

    const safeTestName = testName.replace(/\s+/g, "-");
    const outputFile = path.join(
      this.resultsDir,
      `${safeTestName}-${Date.now()}.json`
    );

    try {
      // Run k6 test with JSON output
      const command = `k6 run --out json=${outputFile} --compatibility-mode=base performance/tests/${testFile}`;
      console.log(`Executing: ${command}`);

      execSync(command, {
        stdio: "pipe",
        cwd: path.join(__dirname, ".."),
      });

      // Parse and analyze results
      const metrics = await this.parseResults(outputFile, testName);
      await this.generateReport(metrics);

      return metrics;
    } catch (error) {
      console.error(`❌ Error running test: ${error}`);
      throw error;
    }
  }

  private async parseResults(
    outputFile: string,
    testName: string
  ): Promise<TestMetrics> {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Results file not found: ${outputFile}`);
    }

    const rawData = fs.readFileSync(outputFile, "utf8");
    const lines = rawData.trim().split("\n");

    const metrics: TestMetrics = {
      testName,
      duration: "",
      iterations: 0,
      vus: 0,
      http_req_duration: { avg: 0, med: 0, p95: 0, p99: 0 },
      http_req_rate: 0,
      http_req_failed: 0,
      http_req_total: 0,
      http_req_failed_rate: 0,
      endpoints: {},
    };

    // Initialize i18n metrics for i18n tests
    if (
      testName.toLowerCase().includes("i18n") ||
      testName.toLowerCase().includes("cache")
    ) {
      metrics.i18n_metrics = {
        language_tests: 0,
        cache_efficiency: 0,
        multilingual_requests: 0,
      };
    }

    let currentMetric = "";

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        if (data.type === "Metric") {
          const metricName = data.data.name || data.metric;
          const value = data.data.value;

          switch (metricName) {
            case "http_req_duration":
              if (data.data.tags?.stat === "avg")
                metrics.http_req_duration.avg = value;
              if (data.data.tags?.stat === "med")
                metrics.http_req_duration.med = value;
              if (data.data.tags?.stat === "p(95)")
                metrics.http_req_duration.p95 = value;
              if (data.data.tags?.stat === "p(99)")
                metrics.http_req_duration.p99 = value;
              break;
            case "http_req_rate":
              metrics.http_req_rate = value;
              break;
            case "http_req_failed":
              metrics.http_req_failed = value;
              break;
            case "http_reqs":
              metrics.http_req_total = value;
              break;
            case "http_req_failed_rate":
              metrics.http_req_failed_rate = value;
              break;
            case "iterations":
              metrics.iterations = value;
              break;
            case "vus":
              metrics.vus = value;
              break;
            case "duration":
              metrics.duration = this.formatDuration(value);
              break;
          }
        } else if (data.type === "Point") {
          const metricName = data.metric;
          const value = data.data.value;

          switch (metricName) {
            case "http_req_duration":
              if (data.data.tags?.stat === "avg")
                metrics.http_req_duration.avg = value;
              if (data.data.tags?.stat === "med")
                metrics.http_req_duration.med = value;
              if (data.data.tags?.stat === "p(95)")
                metrics.http_req_duration.p95 = value;
              if (data.data.tags?.stat === "p(99)")
                metrics.http_req_duration.p99 = value;
              break;
            case "http_req_rate":
              metrics.http_req_rate = value;
              break;
            case "http_req_failed":
              metrics.http_req_failed = value;
              break;
            case "http_reqs":
              metrics.http_req_total = value;
              break;
            case "http_req_failed_rate":
              metrics.http_req_failed_rate = value;
              break;
            case "iterations":
              metrics.iterations = value;
              break;
            case "vus":
              metrics.vus = value;
              break;
            case "duration":
              metrics.duration = this.formatDuration(value);
              break;
          }

          // Track i18n specific metrics
          if (metrics.i18n_metrics && data.data.tags) {
            const tags = data.data.tags;

            // Count multilingual requests
            if (
              tags.name &&
              (tags.name.includes("logout") ||
                tags.name.includes("forgot password"))
            ) {
              const langPattern = /\((en|tr|de)\)/;
              if (langPattern.test(tags.name)) {
                metrics.i18n_metrics.multilingual_requests++;
              }
            }

            // Count language test operations
            if (tags.name && tags.name.includes("message correct for")) {
              metrics.i18n_metrics.language_tests++;
            }

            // Track rapid language switches
            if (tags.name && tags.name.includes("rapid switch")) {
              metrics.i18n_metrics.cache_efficiency++;
            }
          }

          // Track endpoint-specific metrics
          if (data.data.tags?.name) {
            const endpointName = data.data.tags.name;
            if (!metrics.endpoints[endpointName]) {
              metrics.endpoints[endpointName] = {
                count: 0,
                avg_duration: 0,
                failed_count: 0,
                success_rate: 0,
              };
            }

            metrics.endpoints[endpointName].count++;
            if (
              metricName === "http_req_duration" &&
              data.data.tags?.stat === "avg"
            ) {
              metrics.endpoints[endpointName].avg_duration = value;
            }
            if (metricName === "http_req_failed" && value > 0) {
              metrics.endpoints[endpointName].failed_count++;
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }

    // Calculate success rates for endpoints
    Object.keys(metrics.endpoints).forEach((endpoint) => {
      const ep = metrics.endpoints[endpoint];
      if (ep) {
        ep.success_rate =
          ep.count > 0 ? ((ep.count - ep.failed_count) / ep.count) * 100 : 0;
      }
    });

    // Calculate i18n cache efficiency
    if (metrics.i18n_metrics) {
      const totalI18nOps =
        metrics.i18n_metrics.language_tests +
        metrics.i18n_metrics.multilingual_requests;
      metrics.i18n_metrics.cache_efficiency =
        totalI18nOps > 0
          ? (metrics.i18n_metrics.cache_efficiency / totalI18nOps) * 100
          : 0;
    }

    return metrics;
  }

  private formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  private async generateReport(metrics: TestMetrics): Promise<void> {
    const reportFile = path.join(
      this.reportsDir,
      `${metrics.testName}-report-${Date.now()}.md`
    );

    const report = this.generateMarkdownReport(metrics);
    fs.writeFileSync(reportFile, report);

    console.log(`📊 Report generated: ${reportFile}`);
    console.log("\n" + report);
  }

  private generateMarkdownReport(metrics: TestMetrics): string {
    const failureRate = ((metrics.http_req_failed_rate || 0) * 100).toFixed(2);
    const successRate = (100 - parseFloat(failureRate)).toFixed(2);

    let report = `# Performance Test Report: ${metrics.testName}

## Test Summary
- **Duration**: ${metrics.duration}
- **Total Iterations**: ${metrics.iterations.toLocaleString()}
- **Peak Virtual Users**: ${metrics.vus}
- **Total HTTP Requests**: ${metrics.http_req_total.toLocaleString()}
- **Success Rate**: ${successRate}%
- **Failure Rate**: ${failureRate}%
- **Request Rate**: ${metrics.http_req_rate.toFixed(2)} req/s

## Response Time Metrics
- **Average**: ${metrics.http_req_duration.avg.toFixed(2)}ms
- **Median**: ${metrics.http_req_duration.med.toFixed(2)}ms
- **95th Percentile**: ${metrics.http_req_duration.p95.toFixed(2)}ms
- **99th Percentile**: ${metrics.http_req_duration.p99.toFixed(2)}ms

`;

    // Add i18n specific metrics if available
    if (metrics.i18n_metrics) {
      report += `## i18n Cache Performance
- **Multilingual Requests**: ${metrics.i18n_metrics.multilingual_requests}
- **Language Test Operations**: ${metrics.i18n_metrics.language_tests}
- **Cache Efficiency**: ${metrics.i18n_metrics.cache_efficiency.toFixed(2)}%
- **Language Switch Performance**: ${
        metrics.i18n_metrics.cache_efficiency > 90
          ? "✅ Excellent"
          : metrics.i18n_metrics.cache_efficiency > 70
          ? "⚠️ Good"
          : "❌ Needs Improvement"
      }

### i18n Performance Insights
`;

      if (metrics.i18n_metrics.cache_efficiency > 90) {
        report += `- ✅ **Cache Hit Rate**: Excellent cache performance indicates efficient i18n string caching
- ✅ **Language Switching**: Fast language switches suggest Redis cache is working optimally
- ✅ **Memory Fallback**: System handles cache failures gracefully\n\n`;
      } else if (metrics.i18n_metrics.cache_efficiency > 70) {
        report += `- ⚠️ **Cache Performance**: Good but could be optimized for better efficiency
- ⚠️ **Language Switching**: Moderate performance, consider cache warming strategies
- ✅ **System Stability**: Handles multilingual requests reliably\n\n`;
      } else {
        report += `- ❌ **Cache Bottleneck**: Low efficiency suggests cache misses or slow Redis operations
- ❌ **Language Performance**: High latency in language switching, investigate cache configuration
- ⚠️ **Scaling Concern**: May not scale well with high multilingual traffic\n\n`;
      }
    }

    // Add endpoint breakdown
    if (Object.keys(metrics.endpoints).length > 0) {
      report += `## Endpoint Performance\n\n`;
      report += `| Endpoint | Requests | Avg Duration | Success Rate |\n`;
      report += `|----------|----------|--------------|-------------|\n`;

      Object.entries(metrics.endpoints)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10) // Top 10 endpoints
        .forEach(([name, data]) => {
          report += `| ${name.slice(0, 40)}${name.length > 40 ? "..." : ""} | ${
            data.count
          } | ${data.avg_duration.toFixed(2)}ms | ${data.success_rate.toFixed(
            1
          )}% |\n`;
        });

      report += "\n";
    }

    // Performance assessment
    report += `## Performance Assessment\n\n`;

    const avgResponseTime = metrics.http_req_duration.avg;
    const p95ResponseTime = metrics.http_req_duration.p95;
    const errorRate = parseFloat(failureRate);

    let performanceScore = 100;
    let issues: string[] = [];
    let recommendations: string[] = [];

    // Response time assessment
    if (avgResponseTime > 2000) {
      performanceScore -= 30;
      issues.push("High average response time");
      recommendations.push("Optimize database queries and API logic");
    } else if (avgResponseTime > 1000) {
      performanceScore -= 15;
      issues.push("Moderate response time");
      recommendations.push(
        "Consider caching strategies for frequently accessed data"
      );
    }

    if (p95ResponseTime > 5000) {
      performanceScore -= 25;
      issues.push("Very high 95th percentile response time");
      recommendations.push("Investigate and optimize slowest operations");
    } else if (p95ResponseTime > 3000) {
      performanceScore -= 10;
      issues.push("High 95th percentile response time");
      recommendations.push("Profile slow endpoints and optimize performance");
    }

    // Error rate assessment
    if (errorRate > 10) {
      performanceScore -= 30;
      issues.push("High error rate");
      recommendations.push("Fix application errors and improve error handling");
    } else if (errorRate > 5) {
      performanceScore -= 15;
      issues.push("Moderate error rate");
      recommendations.push("Investigate and resolve intermittent errors");
    }

    // i18n specific assessment
    if (metrics.i18n_metrics) {
      if (metrics.i18n_metrics.cache_efficiency < 70) {
        performanceScore -= 20;
        issues.push("Poor i18n cache performance");
        recommendations.push(
          "Optimize Redis cache configuration and implement cache warming"
        );
        recommendations.push(
          "Consider increasing cache TTL for static translations"
        );
      }

      if (
        metrics.i18n_metrics.multilingual_requests > 0 &&
        metrics.i18n_metrics.language_tests === 0
      ) {
        issues.push("Multilingual responses not properly tested");
        recommendations.push(
          "Ensure i18n response validation is working correctly"
        );
      }
    }

    // Final score and grade
    let grade: string;
    if (performanceScore >= 90) grade = "🟢 A (Excellent)";
    else if (performanceScore >= 80) grade = "🟡 B (Good)";
    else if (performanceScore >= 70) grade = "🟠 C (Fair)";
    else if (performanceScore >= 60) grade = "🔴 D (Poor)";
    else grade = "⚫ F (Critical)";

    report += `**Overall Performance Score**: ${performanceScore.toFixed(
      0
    )}/100 - ${grade}\n\n`;

    if (issues.length > 0) {
      report += `### Issues Identified\n`;
      issues.forEach((issue) => (report += `- ❌ ${issue}\n`));
      report += "\n";
    }

    if (recommendations.length > 0) {
      report += `### Recommendations\n`;
      recommendations.forEach((rec) => (report += `- 💡 ${rec}\n`));
      report += "\n";
    }

    if (performanceScore >= 90) {
      report += `### 🎉 Excellent Performance!\nYour API is performing exceptionally well under load. Continue monitoring and maintain current optimization practices.\n\n`;
    }

    report += `---\n*Report generated on ${new Date().toISOString()}*`;

    return report;
  }

  async runAllTests(): Promise<void> {
    const tests = [
      { file: "quick-test.ts", name: "Quick Test" },
      { file: "basic-load-test.ts", name: "Basic Load Test" },
      { file: "i18n-cache-test.ts", name: "i18n Cache Performance Test" },
      { file: "stress-test.ts", name: "Stress Test" },
      { file: "spike-test.ts", name: "Spike Test" },
    ];

    console.log("🧪 Running all performance tests with detailed metrics...\n");

    for (const test of tests) {
      try {
        await this.runTestWithMetrics(test.file, test.name);
        console.log("\n" + "=".repeat(50) + "\n");
      } catch (error) {
        console.error(`❌ Failed to run ${test.name}: ${error}`);
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const reporter = new MetricsReporter();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log(
      "  npm run metrics:all                    # Run all tests with metrics"
    );
    console.log("  npm run metrics:quick                  # Run quick test");
    console.log(
      "  npm run metrics:basic                  # Run basic load test"
    );
    console.log(
      "  npm run metrics:i18n                   # Run i18n cache test"
    );
    console.log("  npm run metrics:stress                 # Run stress test");
    console.log("  npm run metrics:spike                  # Run spike test");
    process.exit(1);
  }

  const command = args[0];

  switch (command) {
    case "all":
      reporter.runAllTests();
      break;
    case "quick":
      reporter.runTestWithMetrics("quick-test.ts", "Quick Test");
      break;
    case "basic":
      reporter.runTestWithMetrics("basic-load-test.ts", "Basic Load Test");
      break;
    case "i18n":
      reporter.runTestWithMetrics(
        "i18n-cache-test.ts",
        "i18n Cache Performance Test"
      );
      break;
    case "stress":
      reporter.runTestWithMetrics("stress-test.ts", "Stress Test");
      break;
    case "spike":
      reporter.runTestWithMetrics("spike-test.ts", "Spike Test");
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

export default MetricsReporter;
