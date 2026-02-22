#!/usr/bin/env node

import http from 'k6/http';
import { sleep } from 'k6';

// Test configuration for setup
export const options = {
  vus: 1,
  iterations: 1,
  setupTimeout: '60s',
};

const BASE_URL = 'http://localhost:3000';

// All test users for different test scenarios
const testUsers = {
  quick: [
    {
      email: 'test1@example.com',
      password: 'Password1!',
      name: 'Test User 1',
    },
    {
      email: 'test2@example.com',
      password: 'Password1!',
      name: 'Test User 2',
    },
    {
      email: 'test3@example.com',
      password: 'Password1!',
      name: 'Test User 3',
    },
    {
      email: 'test4@example.com',
      password: 'Password1!',
      name: 'Test User 4',
    },
    {
      email: 'test5@example.com',
      password: 'Password1!',
      name: 'Test User 5',
    },
  ],
  load: [
    {
      email: 'load.test1@example.com',
      password: 'Password1!',
      name: 'Load Test User 1',
    },
    {
      email: 'load.test2@example.com',
      password: 'Password1!',
      name: 'Load Test User 2',
    },
    {
      email: 'load.test3@example.com',
      password: 'Password1!',
      name: 'Load Test User 3',
    },
    {
      email: 'load.test4@example.com',
      password: 'Password1!',
      name: 'Load Test User 4',
    },
    {
      email: 'load.test5@example.com',
      password: 'Password1!',
      name: 'Load Test User 5',
    },
    {
      email: 'load.test6@example.com',
      password: 'Password1!',
      name: 'Load Test User 6',
    },
    {
      email: 'load.test7@example.com',
      password: 'Password1!',
      name: 'Load Test User 7',
    },
    {
      email: 'load.test8@example.com',
      password: 'Password1!',
      name: 'Load Test User 8',
    },
  ],
  spike: [
    {
      email: 'spike.test1@example.com',
      password: 'Password1!',
      name: 'Spike Test User 1',
    },
    {
      email: 'spike.test2@example.com',
      password: 'Password1!',
      name: 'Spike Test User 2',
    },
    {
      email: 'spike.test3@example.com',
      password: 'Password1!',
      name: 'Spike Test User 3',
    },
    {
      email: 'spike.test4@example.com',
      password: 'Password1!',
      name: 'Spike Test User 4',
    },
    {
      email: 'spike.test5@example.com',
      password: 'Password1!',
      name: 'Spike Test User 5',
    },
    {
      email: 'spike.test6@example.com',
      password: 'Password1!',
      name: 'Spike Test User 6',
    },
    {
      email: 'spike.test7@example.com',
      password: 'Password1!',
      name: 'Spike Test User 7',
    },
    {
      email: 'spike.test8@example.com',
      password: 'Password1!',
      name: 'Spike Test User 8',
    },
  ],
  stress: [
    {
      email: 'stress.test1@example.com',
      password: 'Password1!',
      name: 'Stress Test User 1',
    },
    {
      email: 'stress.test2@example.com',
      password: 'Password1!',
      name: 'Stress Test User 2',
    },
    {
      email: 'stress.test3@example.com',
      password: 'Password1!',
      name: 'Stress Test User 3',
    },
    {
      email: 'stress.test4@example.com',
      password: 'Password1!',
      name: 'Stress Test User 4',
    },
    {
      email: 'stress.test5@example.com',
      password: 'Password1!',
      name: 'Stress Test User 5',
    },
    {
      email: 'stress.test6@example.com',
      password: 'Password1!',
      name: 'Stress Test User 6',
    },
    {
      email: 'stress.test7@example.com',
      password: 'Password1!',
      name: 'Stress Test User 7',
    },
    {
      email: 'stress.test8@example.com',
      password: 'Password1!',
      name: 'Stress Test User 8',
    },
    {
      email: 'stress.test9@example.com',
      password: 'Password1!',
      name: 'Stress Test User 9',
    },
    {
      email: 'stress.test10@example.com',
      password: 'Password1!',
      name: 'Stress Test User 10',
    },
  ],
};

// Function to register a single user
function registerUser(user: {
  email: string;
  password: string;
  name: string;
}): boolean {
  try {
    const response = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify(user),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      }
    );

    if (response.status === 200) {
      console.log(`✅ Successfully registered: ${user.email}`);
      return true;
    } else if (response.status === 400) {
      // User might already exist
      console.log(`ℹ️  User already exists: ${user.email}`);
      return true;
    } else {
      console.log(
        `❌ Failed to register ${user.email}: Status ${response.status}`
      );
      const errorBody = response.body
        ? response.body.substring(0, 200)
        : 'No response body';
      console.log(`   Error: ${errorBody}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error registering ${user.email}: ${error}`);
    return false;
  }
}

// Function to verify user can login
function verifyLogin(user: { email: string; password: string }): boolean {
  try {
    const response = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
      }
    );

    if (response.status === 200) {
      const responseData = response.json();
      const token =
        responseData.access_token || responseData.data?.access_token;
      if (token) {
        console.log(`✅ Login verified for: ${user.email}`);
        return true;
      } else {
        console.log(`❌ No token received for: ${user.email}`);
        return false;
      }
    } else {
      console.log(
        `❌ Login failed for ${user.email}: Status ${response.status}`
      );
      return false;
    }
  } catch (error) {
    console.log(`❌ Error verifying login for ${user.email}: ${error}`);
    return false;
  }
}

// Function to setup users for a specific test type
function setupUsersForTest(
  testType: string,
  users: Array<{ email: string; password: string; name: string }>
): void {
  console.log(`\n🔧 Setting up ${testType} test users...`);
  console.log(`📊 Total users to setup: ${users.length}`);

  let successCount = 0;
  let verificationSuccessCount = 0;

  // Register all users
  for (const user of users) {
    const registered = registerUser(user);
    if (registered) {
      successCount++;
    }
    sleep(0.5); // Small delay between registrations
  }

  console.log(`\n📈 Registration Summary for ${testType}:`);
  console.log(`   Successfully processed: ${successCount}/${users.length}`);

  // Verify logins for registered users
  console.log(`\n🔍 Verifying login capabilities...`);
  for (const user of users) {
    const loginWorks = verifyLogin(user);
    if (loginWorks) {
      verificationSuccessCount++;
    }
    sleep(0.3); // Small delay between verifications
  }

  console.log(`📈 Verification Summary for ${testType}:`);
  console.log(`   Login verified: ${verificationSuccessCount}/${users.length}`);

  if (verificationSuccessCount === users.length) {
    console.log(`✅ All ${testType} test users are ready!`);
  } else {
    console.log(`⚠️  Some ${testType} test users may have issues`);
  }
}

// Function to check API connectivity
function checkAPIConnectivity(): boolean {
  console.log('🔍 Checking API connectivity...');

  try {
    const response = http.get(`${BASE_URL}/api/questions`, { timeout: '10s' });

    if (response.status === 200) {
      console.log('✅ API is accessible');
      return true;
    } else {
      console.log(`❌ API returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to API: ${error}`);
    console.log('   Make sure QA API is running on http://localhost:3000');
    return false;
  }
}

// Function to create initial sample data
function createSampleData(): void {
  console.log('\n📝 Creating sample questions for testing...');

  // Use the first quick test user to create sample data
  const sampleUser = testUsers.quick[0];

  if (!sampleUser) {
    console.log('❌ No sample user available for data creation');
    return;
  }

  try {
    // Login first
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: sampleUser.email,
        password: sampleUser.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '10s',
      }
    );

    if (loginRes.status !== 200) {
      console.log('❌ Could not login to create sample data');
      return;
    }

    const responseData = loginRes.json();
    const token = responseData.access_token || responseData.data?.access_token;

    if (!token) {
      console.log('❌ No token received for sample data creation');
      return;
    }

    // Create sample questions
    const sampleQuestions = [
      {
        title: 'Welcome to QA System - Getting Started',
        content:
          'This is a sample question to help you get started with the QA system. How do you find the platform so far?',
      },
      {
        title: 'Performance Testing Best Practices',
        content:
          'What are the key metrics to monitor during API performance testing? Looking for insights on response times, throughput, and error rates.',
      },
      {
        title: 'Database Optimization Tips',
        content:
          'What strategies work best for optimizing MongoDB queries in high-traffic applications? Interested in indexing and aggregation pipeline optimization.',
      },
    ];

    let questionsCreated = 0;

    for (const question of sampleQuestions) {
      try {
        const questionRes = http.post(
          `${BASE_URL}/api/questions/ask`,
          JSON.stringify(question),
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            timeout: '15s',
          }
        );

        if (questionRes.status === 200) {
          questionsCreated++;
          console.log(
            `✅ Created sample question: ${question.title.substring(0, 50)}...`
          );
        } else {
          console.log(
            `❌ Failed to create question: ${question.title.substring(
              0,
              30
            )}...`
          );
        }
      } catch (error) {
        console.log(`❌ Error creating question: ${error}`);
      }

      sleep(1); // Delay between questions
    }

    console.log(
      `📈 Sample Data Summary: ${questionsCreated}/${sampleQuestions.length} questions created`
    );
  } catch (error) {
    console.log(`❌ Error in sample data creation: ${error}`);
  }
}

// Main setup function
export default function setup() {
  console.log('🚀 QA System Performance Test User Setup');
  console.log('========================================\n');

  // Check API connectivity first
  if (!checkAPIConnectivity()) {
    console.log('\n❌ Setup failed: Cannot connect to API');
    console.log('   Please ensure QA API is running on http://localhost:3000');
    return;
  }

  // Setup users for each test type
  setupUsersForTest('Quick', testUsers.quick);
  sleep(2);

  setupUsersForTest('Load', testUsers.load);
  sleep(2);

  setupUsersForTest('Spike', testUsers.spike);
  sleep(2);

  setupUsersForTest('Stress', testUsers.stress);
  sleep(2);

  // Create sample data
  createSampleData();

  // Final summary
  const totalUsers =
    testUsers.quick.length +
    testUsers.load.length +
    testUsers.spike.length +
    testUsers.stress.length;

  console.log('\n🎉 Setup Complete!');
  console.log('==================');
  console.log(`📊 Total users processed: ${totalUsers}`);
  console.log('✅ Your QA system is ready for performance testing!');
  console.log('\nNext steps:');
  console.log('  npm run perf:quick     # Run quick test');
  console.log('  npm run perf:load      # Run load test');
  console.log('  npm run analyze:latest # Analyze results');
}

// Main execution when run directly
export function main() {
  setup();
}
