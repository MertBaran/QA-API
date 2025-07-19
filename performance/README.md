# ⚡ Performance Testing with k6

**Comprehensive API performance testing with multi-language support and caching analysis**

## 🚀 Quick Start

```bash
# Setup test data
npm run perf:setup

# Run all tests
npm run perf:all

# View detailed metrics
npm run view:latest
```

## 📊 Test Scenarios

| Test           | Duration | Users     | Purpose                            |
| -------------- | -------- | --------- | ---------------------------------- |
| **Basic Load** | 9min     | 0→10→0    | Normal load behavior               |
| **i18n Cache** | 4.5min   | 5→30→0    | Multi-language & cache performance |
| **Stress**     | 13min    | 0→100→0   | High load limits                   |
| **Spike**      | 4.5min   | 10→100→10 | Sudden traffic spikes              |

## 🌍 i18n Performance Features

- **3 Languages**: EN, TR, DE support
- **Redis Caching**: Hit/miss ratio analysis
- **Language Switching**: Response time testing
- **Accept-Language**: Header parsing performance

## 🎯 Performance Thresholds

| Metric          | Target | Critical |
| --------------- | ------ | -------- |
| 95th Percentile | <2s    | <5s      |
| Error Rate      | <10%   | <20%     |
| Cache Hit Rate  | >90%   | >70%     |

## 📈 Key Metrics

### Response Performance

- **http_req_duration**: Request timing (p95, p99)
- **http_req_rate**: Requests per second
- **http_req_failed**: Error percentage

### i18n Specific

- **cache_efficiency**: Redis hit ratio
- **language_switch_time**: Language change speed
- **multilingual_requests**: Multi-language request count

## 🔧 Commands

```bash
# Individual tests
npm run perf:basic     # Load test
npm run perf:i18n      # i18n performance
npm run perf:stress    # Stress test
npm run perf:spike     # Spike test

# Detailed analysis
npm run metrics:all    # All tests with metrics
npm run view:compare   # Compare results
```

## 📋 Prerequisites

- ✅ API server running (`npm start`)
- ✅ Redis instance active
- ✅ Test users created (`npm run perf:setup`)

---

_Results are stored in `performance/results/` as JSON and `performance/reports/` as Markdown_
