#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running WebSocket Monitoring Tests...\n');

// Test categories
const testCategories = [
  {
    name: 'Unit Tests',
    pattern: 'tests/unit/services/WebSocketMonitorService.test.ts',
    description: 'Testing WebSocketMonitorService functionality',
  },
  {
    name: 'Integration Tests',
    pattern: 'tests/integration/monitoring.test.ts',
    description: 'Testing monitoring endpoints',
  },
  {
    name: 'WebSocket Client Tests',
    pattern: 'tests/integration/websocket-client.test.ts',
    description: 'Testing WebSocket client communication',
  },
];

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function runTest(testFile) {
  try {
    console.log(
      `${colors.blue}${colors.bold}Running: ${testFile}${colors.reset}`
    );

    const result = execSync(
      `npx jest ${testFile} --verbose --detectOpenHandles`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );

    console.log(`${colors.green}✅ PASSED${colors.reset}\n`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`${colors.red}❌ FAILED${colors.reset}\n`);
    console.log(error.stdout || error.message);
    return { success: false, output: error.stdout || error.message };
  }
}

function runAllTests() {
  console.log(
    `${colors.bold}🚀 WebSocket Monitoring Test Suite${colors.reset}\n`
  );

  let passedTests = 0;
  let totalTests = testCategories.length;

  testCategories.forEach((category, index) => {
    console.log(
      `${colors.yellow}${index + 1}. ${category.name}${colors.reset}`
    );
    console.log(`   ${category.description}\n`);

    const result = runTest(category.pattern);
    if (result.success) {
      passedTests++;
    }

    console.log('─'.repeat(50) + '\n');
  });

  // Summary
  console.log(`${colors.bold}📊 Test Summary:${colors.reset}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(
    `   Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`
  );

  if (passedTests === totalTests) {
    console.log(
      `\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.red}${colors.bold}❌ Some tests failed!${colors.reset}`
    );
    process.exit(1);
  }
}

// Run tests
runAllTests();
