import * as fs from 'fs';
import * as path from 'path';

interface SimpleMetrics {
  testName: string;
  timestamp: string;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestRate: number;
}

class MetricsViewer {
  private resultsDir = path.join(__dirname, 'results');

  constructor() {
    if (!fs.existsSync(this.resultsDir)) {
      console.log('❌ No results directory found. Run tests first with metrics reporter.');
      process.exit(1);
    }
  }

  listResults(): void {
    const files = fs.readdirSync(this.resultsDir)
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

    console.log('📊 Available Test Results:\n');
    
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

  viewLatestResults(): void {
    const files = fs.readdirSync(this.resultsDir)
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

    console.log('📈 Latest Test Results:\n');

    files.slice(0, 3).forEach((file, index) => {
      console.log(`=== ${file} ===`);
      this.displaySimpleMetrics(path.join(this.resultsDir, file));
      console.log('');
    });
  }

  private displaySimpleMetrics(filePath: string): void {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const lines = rawData.trim().split('\n');
      
      const metrics: any = {
        http_req_total: 0,
        http_req_failed: 0,
        http_req_duration: { avg: 0, p95: 0 },
        http_req_rate: 0
      };

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'Metric') {
            const metricName = data.data.name || data.metric;
            const value = data.data.value;
            
            switch (metricName) {
              case 'http_req_total':
                metrics.http_req_total = value;
                break;
              case 'http_req_failed':
                metrics.http_req_failed = value;
                break;
              case 'http_req_duration':
                if (data.data.tags?.stat === 'avg') metrics.http_req_duration.avg = value;
                if (data.data.tags?.stat === 'p(95)') metrics.http_req_duration.p95 = value;
                break;
              case 'http_req_rate':
                metrics.http_req_rate = value;
                break;
            }
          } else if (data.type === 'Point') {
            const metricName = data.metric;
            const value = data.data.value;
            
            switch (metricName) {
              case 'http_req_total':
                metrics.http_req_total = value;
                break;
              case 'http_req_failed':
                metrics.http_req_failed = value;
                break;
              case 'http_req_duration':
                if (data.data.tags?.stat === 'avg') metrics.http_req_duration.avg = value;
                if (data.data.tags?.stat === 'p(95)') metrics.http_req_duration.p95 = value;
                break;
              case 'http_req_rate':
                metrics.http_req_rate = value;
                break;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      const successRate = metrics.http_req_total > 0 
        ? ((metrics.http_req_total - metrics.http_req_failed) / metrics.http_req_total * 100).toFixed(2)
        : '0.00';

      console.log(`Total Requests: ${metrics.http_req_total}`);
      console.log(`Failed Requests: ${metrics.http_req_failed}`);
      console.log(`Success Rate: ${successRate}%`);
      console.log(`Average Response Time: ${metrics.http_req_duration.avg.toFixed(2)}ms`);
      console.log(`95th Percentile: ${metrics.http_req_duration.p95.toFixed(2)}ms`);
      console.log(`Request Rate: ${metrics.http_req_rate.toFixed(2)} req/s`);

    } catch (error) {
      console.error(`❌ Error reading file ${filePath}: ${error}`);
    }
  }

  compareResults(): void {
    const files = fs.readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(this.resultsDir, a));
        const statB = fs.statSync(path.join(this.resultsDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

    if (files.length < 2) {
      console.log('❌ Need at least 2 test results to compare.');
      return;
    }

    console.log('📊 Comparing Latest Test Results:\n');

    const results: SimpleMetrics[] = [];

    files.slice(0, 5).forEach(file => {
      const metrics = this.extractSimpleMetrics(path.join(this.resultsDir, file));
      if (metrics) {
        results.push(metrics);
      }
    });

    if (results.length === 0) {
      console.log('❌ No valid results to compare.');
      return;
    }

    // Display comparison table
    console.log('Test Name'.padEnd(30) + 'Success Rate'.padEnd(15) + 'Avg Response'.padEnd(15) + 'Request Rate');
    console.log('-'.repeat(75));

    results.forEach(result => {
      const name = result.testName.length > 29 ? result.testName.substring(0, 26) + '...' : result.testName;
      console.log(
        name.padEnd(30) +
        `${result.successRate}%`.padEnd(15) +
        `${result.avgResponseTime}ms`.padEnd(15) +
        `${result.requestRate} req/s`
      );
    });

    console.log('\n📈 Performance Trends:');
    
    if (results.length >= 2) {
      const latest = results[0];
      const previous = results[1];
      
      if (latest && previous) {
        const successRateChange = latest.successRate - previous.successRate;
        const responseTimeChange = latest.avgResponseTime - previous.avgResponseTime;
        const requestRateChange = latest.requestRate - previous.requestRate;

        console.log(`Success Rate: ${successRateChange > 0 ? '📈' : '📉'} ${Math.abs(successRateChange).toFixed(2)}%`);
        console.log(`Response Time: ${responseTimeChange < 0 ? '📈' : '📉'} ${Math.abs(responseTimeChange).toFixed(2)}ms`);
        console.log(`Request Rate: ${requestRateChange > 0 ? '📈' : '📉'} ${Math.abs(requestRateChange).toFixed(2)} req/s`);
      }
    }
  }

  private extractSimpleMetrics(filePath: string): SimpleMetrics | null {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const lines = rawData.trim().split('\n');
      
      const metrics: any = {
        http_req_total: 0,
        http_req_failed: 0,
        http_req_duration: { avg: 0 },
        http_req_rate: 0
      };

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'Metric') {
            const metricName = data.data.name || data.metric;
            const value = data.data.value;
            
            switch (metricName) {
              case 'http_req_total':
                metrics.http_req_total = value;
                break;
              case 'http_req_failed':
                metrics.http_req_failed = value;
                break;
              case 'http_req_duration':
                if (data.data.tags?.stat === 'avg') metrics.http_req_duration.avg = value;
                break;
              case 'http_req_rate':
                metrics.http_req_rate = value;
                break;
            }
          } else if (data.type === 'Point') {
            const metricName = data.metric;
            const value = data.data.value;
            
            switch (metricName) {
              case 'http_req_total':
                metrics.http_req_total = value;
                break;
              case 'http_req_failed':
                metrics.http_req_failed = value;
                break;
              case 'http_req_duration':
                if (data.data.tags?.stat === 'avg') metrics.http_req_duration.avg = value;
                break;
              case 'http_req_rate':
                metrics.http_req_rate = value;
                break;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }

      const successRate = metrics.http_req_total > 0 
        ? ((metrics.http_req_total - metrics.http_req_failed) / metrics.http_req_total * 100)
        : 0;

      return {
        testName: path.basename(filePath, '.json'),
        timestamp: fs.statSync(filePath).mtime.toISOString(),
        totalRequests: metrics.http_req_total,
        failedRequests: metrics.http_req_failed,
        successRate,
        avgResponseTime: metrics.http_req_duration.avg,
        p95ResponseTime: 0, // Would need to parse p95 separately
        requestRate: metrics.http_req_rate
      };

    } catch (error) {
      console.error(`❌ Error reading file ${filePath}: ${error}`);
      return null;
    }
  }
}

// CLI usage
if (require.main === module) {
  const viewer = new MetricsViewer();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npm run view:list                    # List all test results');
    console.log('  npm run view:latest                  # View latest test results');
    console.log('  npm run view:compare                 # Compare test results');
    process.exit(1);
  }

  const command = args[0];
  
  switch (command) {
    case 'list':
      viewer.listResults();
      break;
    case 'latest':
      viewer.viewLatestResults();
      break;
    case 'compare':
      viewer.compareResults();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

export default MetricsViewer; 