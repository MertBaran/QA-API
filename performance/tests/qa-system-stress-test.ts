import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// K6 global variables
declare const __VU: number;
declare const __ITER: number;

// Custom metrics
const errorRate = new Rate('errors');
const authSuccessRate = new Rate('auth_success');
const questionCreationRate = new Rate('question_creation_success');
const answerCreationRate = new Rate('answer_creation_success');
const systemStabilityRate = new Rate('system_stability');
const resourceExhaustionRate = new Rate('resource_exhaustion');

// Test configuration - QA System Stress Test
export const options = {
  stages: [
    { duration: '3m', target: 20 }, // Warm up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '3m', target: 50 }, // Ramp to 50 users
    { duration: '8m', target: 50 }, // Hold at 50 users
    { duration: '3m', target: 80 }, // Push to 80 users
    { duration: '8m', target: 80 }, // Hold at 80 users
    { duration: '2m', target: 100 }, // Push to breaking point
    { duration: '5m', target: 100 }, // Hold at maximum
    { duration: '5m', target: 0 }, // Gradual ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'], // Very relaxed - stress testing limits
    http_req_failed: ['rate<0.4'], // Allow high error rate under stress
    errors: ['rate<0.4'],
    auth_success: ['rate>0.4'], // Even authentication may suffer
    question_creation_success: ['rate>0.3'],
    answer_creation_success: ['rate>0.2'],
    system_stability: ['rate>0.6'], // System should remain somewhat stable
    resource_exhaustion: ['rate<0.8'], // Don't completely exhaust resources
  },
};

// Test data
const BASE_URL = 'http://localhost:3000';
const stressTestUsers = [
  {
    email: 'stress.test1@example.com',
    password: 'password123',
    name: 'Stress Test User 1',
  },
  {
    email: 'stress.test2@example.com',
    password: 'password123',
    name: 'Stress Test User 2',
  },
  {
    email: 'stress.test3@example.com',
    password: 'password123',
    name: 'Stress Test User 3',
  },
  {
    email: 'stress.test4@example.com',
    password: 'password123',
    name: 'Stress Test User 4',
  },
  {
    email: 'stress.test5@example.com',
    password: 'password123',
    name: 'Stress Test User 5',
  },
  {
    email: 'stress.test6@example.com',
    password: 'password123',
    name: 'Stress Test User 6',
  },
  {
    email: 'stress.test7@example.com',
    password: 'password123',
    name: 'Stress Test User 7',
  },
  {
    email: 'stress.test8@example.com',
    password: 'password123',
    name: 'Stress Test User 8',
  },
  {
    email: 'stress.test9@example.com',
    password: 'password123',
    name: 'Stress Test User 9',
  },
  {
    email: 'stress.test10@example.com',
    password: 'password123',
    name: 'Stress Test User 10',
  },
];

// Stress test questions - testing system limits
const stressQuestions = [
  {
    title: 'Stress Test: High Load Database Queries',
    content:
      'Under extreme load conditions, how should we optimize database queries and connection management? This question is designed to test system behavior under stress with complex database operations and concurrent user access patterns.',
  },
  {
    title: 'Stress Test: Memory Management Under Pressure',
    content:
      'How does Node.js handle memory management when dealing with hundreds of concurrent requests? What are the best practices for preventing memory leaks and optimizing garbage collection under high stress conditions?',
  },
  {
    title: 'Stress Test: API Rate Limiting Strategies',
    content:
      'What are the most effective API rate limiting strategies when the system is under extreme load? How do we balance user experience with system protection during peak traffic scenarios?',
  },
  {
    title: 'Stress Test: Error Handling at Scale',
    content:
      'How should we design error handling mechanisms that remain effective even when the system is operating at or beyond its capacity? What monitoring and alerting strategies work best under stress?',
  },
  {
    title: 'Stress Test: Concurrent User Session Management',
    content:
      'How do we manage user sessions efficiently when dealing with hundreds of concurrent users? What are the trade-offs between different session storage strategies under high load?',
  },
];

const stressAnswers = [
  'Under high load, implement connection pooling, query optimization, and consider read replicas. Monitor connection limits and use circuit breakers to prevent cascade failures.',
  'For memory management under stress, implement proper stream handling, avoid memory leaks in closures, tune garbage collection parameters, and monitor heap usage continuously.',
  'Effective rate limiting requires adaptive algorithms, user tiering, and graceful degradation. Implement distributed rate limiting and provide clear feedback to users.',
  'Error handling at scale requires proper logging levels, error aggregation, circuit breakers, and fallback mechanisms. Avoid error amplification and implement graceful degradation.',
  'Session management under load benefits from distributed caching, session affinity, and efficient serialization. Consider using Redis clusters and session compression.',
];

// Helper functions
function getRandomUser() {
  return stressTestUsers[Math.floor(Math.random() * stressTestUsers.length)];
}

function getRandomQuestion() {
  return stressQuestions[Math.floor(Math.random() * stressQuestions.length)];
}

function getRandomAnswer() {
  return stressAnswers[Math.floor(Math.random() * stressAnswers.length)];
}

// Helper function to register user
function registerUser(user: { email: string; password: string; name: string }) {
  try {
    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify(user),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '20s', // Extended timeout for stress conditions
      }
    );
    return registerRes.status === 200 || registerRes.status === 400;
  } catch (_error) {
    return false;
  }
}

// Helper function to login with retry logic
function login(user: { email: string; password: string }) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '15s',
        }
      );

      const isSuccess = loginRes.status === 200;
      authSuccessRate.add(isSuccess ? 1 : 0);

      if (isSuccess) {
        const responseData = loginRes.json();
        return responseData.access_token || responseData.data?.access_token;
      }
    } catch (error) {
      console.log(`Login attempt ${attempt} failed: ${error}`);
    }

    if (attempt < 2) {
      sleep(1); // Brief pause before retry
    }
  }
  return null;
}

// Helper function to get available questions with error handling
function getAvailableQuestions() {
  try {
    const response = http.get(`${BASE_URL}/api/questions`, { timeout: '10s' });
    if (response.status === 200) {
      const responseData = response.json();
      return responseData.data || responseData;
    }
  } catch (error) {
    console.log(`Error fetching questions: ${error}`);
  }
  return [];
}

// Main stress test function
export default function () {
  const user = getRandomUser();
  if (!user) {
    console.log('Failed to get test user');
    errorRate.add(1);
    return;
  }

  const userAgent = `K6-QA-StressTest-${Math.floor(Math.random() * 10000)}`;
  const sessionId = `stress_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 6)}`;

  // Determine stress level based on current VUs
  const stressLevel =
    __VU > 80 ? 'extreme' : __VU > 50 ? 'high' : __VU > 20 ? 'medium' : 'low';

  const isHighStress = stressLevel === 'extreme' || stressLevel === 'high';

  console.log(
    `[${sessionId}] Stress Level: ${stressLevel}, VU: ${__VU}, Iteration: ${__ITER}`
  );

  // 1. System health check with generous timeout
  let systemStable = true;

  try {
    const healthCheck = http.get(`${BASE_URL}/api/questions`, {
      headers: { 'User-Agent': userAgent },
      timeout: isHighStress ? '20s' : '10s',
    });

    const healthCheckPassed =
      healthCheck.status === 200 && healthCheck.timings.duration < 15000;
    systemStable = healthCheckPassed;

    check(healthCheck, {
      [`${stressLevel} stress health check status is 200`]: r =>
        r.status === 200,
      [`${stressLevel} stress health check time < 15s`]: r =>
        r.timings.duration < 15000,
    });

    if (!healthCheckPassed) {
      errorRate.add(1);
      resourceExhaustionRate.add(1);
    }
  } catch (error) {
    console.log(`Health check failed: ${error}`);
    systemStable = false;
    errorRate.add(1);
    resourceExhaustionRate.add(1);
  }

  systemStabilityRate.add(systemStable ? 1 : 0);

  // 2. Authentication under stress
  registerUser(user);
  const token = login(user);

  if (token) {
    console.log(`[${sessionId}] Auth successful under ${stressLevel} stress`);

    // 3. Core functionality testing based on stress level
    if (isHighStress) {
      // Under high stress, focus on essential operations only

      try {
        const questionData = getRandomQuestion();
        if (questionData) {
          const createQuestionRes = http.post(
            `${BASE_URL}/api/questions/ask`,
            JSON.stringify({
              title: `STRESS-${stressLevel.toUpperCase()}: ${
                questionData.title
              } (${sessionId})`,
              content: questionData.content,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': userAgent,
              },
              timeout: '25s', // Very generous timeout under stress
            }
          );

          const questionCreated = createQuestionRes.status === 200;
          questionCreationRate.add(questionCreated ? 1 : 0);

          check(createQuestionRes, {
            [`${stressLevel} stress question creation successful`]: r =>
              r.status === 200,
            [`${stressLevel} stress question creation time < 20s`]: r =>
              r.timings.duration < 20000,
          });

          if (!questionCreated) {
            errorRate.add(1);
            if (createQuestionRes.status >= 500) {
              resourceExhaustionRate.add(1);
            }
          }
        }

        // Single answer attempt under high stress
        const availableQuestions = getAvailableQuestions();
        if (availableQuestions && availableQuestions.length > 0) {
          const randomQuestion = availableQuestions[0]; // Take first to minimize complexity
          const questionId = randomQuestion._id || randomQuestion.id;

          if (questionId) {
            const answerRes = http.post(
              `${BASE_URL}/api/questions/${questionId}/answers`,
              JSON.stringify({
                content: `STRESS-${stressLevel.toUpperCase()} ANSWER: ${getRandomAnswer()} (${sessionId})`,
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  'User-Agent': userAgent,
                },
                timeout: '20s',
              }
            );

            const answerCreated = answerRes.status === 200;
            answerCreationRate.add(answerCreated ? 1 : 0);

            check(answerRes, {
              [`${stressLevel} stress answer creation successful`]: r =>
                r.status === 200,
              [`${stressLevel} stress answer creation time < 15s`]: r =>
                r.timings.duration < 15000,
            });

            if (!answerCreated) {
              errorRate.add(1);
              if (answerRes.status >= 500) {
                resourceExhaustionRate.add(1);
              }
            }
          }
        }
      } catch (error) {
        console.log(`High stress operation failed: ${error}`);
        errorRate.add(1);
        resourceExhaustionRate.add(1);
      }
    } else {
      // Under lower stress, perform more comprehensive testing

      // Multiple question creation
      const questionCount = stressLevel === 'medium' ? 2 : 3;

      for (let i = 0; i < questionCount; i++) {
        try {
          const questionData = getRandomQuestion();
          if (questionData) {
            const createQuestionRes = http.post(
              `${BASE_URL}/api/questions/ask`,
              JSON.stringify({
                title: `STRESS-${stressLevel.toUpperCase()}: ${
                  questionData.title
                } (${sessionId}_${i})`,
                content: questionData.content,
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  'User-Agent': userAgent,
                },
                timeout: '15s',
              }
            );

            const questionCreated = createQuestionRes.status === 200;
            questionCreationRate.add(questionCreated ? 1 : 0);

            check(createQuestionRes, {
              [`${stressLevel} stress question ${i + 1} creation successful`]:
                r => r.status === 200,
              [`${stressLevel} stress question ${i + 1} creation time < 10s`]:
                r => r.timings.duration < 10000,
            });

            if (!questionCreated) {
              errorRate.add(1);
            }
          }
        } catch (error) {
          console.log(`Question creation ${i + 1} failed: ${error}`);
          errorRate.add(1);
        }

        sleep(0.5); // Brief pause between operations
      }

      // Answer multiple questions
      const availableQuestions = getAvailableQuestions();
      if (availableQuestions && availableQuestions.length > 0) {
        const answersToCreate = Math.min(2, availableQuestions.length);

        for (let i = 0; i < answersToCreate; i++) {
          try {
            const randomQuestion =
              availableQuestions[
                Math.floor(Math.random() * availableQuestions.length)
              ];
            const questionId = randomQuestion._id || randomQuestion.id;

            if (questionId) {
              const answerRes = http.post(
                `${BASE_URL}/api/questions/${questionId}/answers`,
                JSON.stringify({
                  content: `STRESS-${stressLevel.toUpperCase()} ANSWER ${
                    i + 1
                  }: ${getRandomAnswer()} (${sessionId})`,
                }),
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'User-Agent': userAgent,
                  },
                  timeout: '12s',
                }
              );

              const answerCreated = answerRes.status === 200;
              answerCreationRate.add(answerCreated ? 1 : 0);

              check(answerRes, {
                [`${stressLevel} stress answer ${i + 1} creation successful`]:
                  r => r.status === 200,
                [`${stressLevel} stress answer ${i + 1} creation time < 8s`]:
                  r => r.timings.duration < 8000,
              });

              if (!answerCreated) {
                errorRate.add(1);
              }
            }
          } catch (error) {
            console.log(`Answer creation ${i + 1} failed: ${error}`);
            errorRate.add(1);
          }

          sleep(0.3);
        }
      }

      // Additional read operations to stress the system
      try {
        const usersRes = http.get(`${BASE_URL}/api/users`, {
          headers: { 'User-Agent': userAgent },
          timeout: '8s',
        });

        check(usersRes, {
          [`${stressLevel} stress users fetch successful`]: r =>
            r.status === 200,
          [`${stressLevel} stress users fetch time < 5s`]: r =>
            r.timings.duration < 5000,
        });

        if (usersRes.status !== 200) {
          errorRate.add(1);
        }
      } catch (error) {
        console.log(`Users fetch failed: ${error}`);
        errorRate.add(1);
      }
    }

    // Logout with error handling
    try {
      const logoutRes = http.get(`${BASE_URL}/api/auth/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': userAgent,
        },
        timeout: '10s',
      });

      check(logoutRes, {
        [`${stressLevel} stress logout successful`]: r => r.status === 200,
      });
    } catch (error) {
      console.log(`Logout failed: ${error}`);
      errorRate.add(1);
    }
  } else {
    console.log(`[${sessionId}] Auth failed under ${stressLevel} stress`);
    errorRate.add(1);
    resourceExhaustionRate.add(1);
  }

  // Adaptive think time based on stress level
  const thinkTime =
    stressLevel === 'extreme'
      ? Math.random() * 0.3 + 0.1 // 0.1-0.4s
      : stressLevel === 'high'
        ? Math.random() * 0.5 + 0.2 // 0.2-0.7s
        : stressLevel === 'medium'
          ? Math.random() * 1.0 + 0.5 // 0.5-1.5s
          : Math.random() * 2.0 + 1.0; // 1.0-3.0s

  sleep(thinkTime);
}
