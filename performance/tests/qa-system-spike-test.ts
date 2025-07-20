import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// K6 global variables
declare const __VU: number;

// Custom metrics
const errorRate = new Rate('errors');
const authSuccessRate = new Rate('auth_success');
const questionCreationRate = new Rate('question_creation_success');
const answerCreationRate = new Rate('answer_creation_success');
const spikeRecoveryRate = new Rate('spike_recovery_success');

// Test configuration - QA System Spike Test
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Normal baseline - 10 users
    { duration: '30s', target: 50 }, // Quick spike to 50 users
    { duration: '1m', target: 50 }, // Hold spike load
    { duration: '30s', target: 10 }, // Drop back to normal
    { duration: '2m', target: 10 }, // Recovery period
    { duration: '30s', target: 0 }, // Complete ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Allow higher response times during spike
    http_req_failed: ['rate<0.25'], // Allow higher error rate during spike
    errors: ['rate<0.25'],
    auth_success: ['rate>0.6'], // Lower success rate acceptable during spike
    question_creation_success: ['rate>0.5'],
    answer_creation_success: ['rate>0.4'],
    spike_recovery_success: ['rate>0.8'], // Recovery should be good
  },
};

// Test data
const BASE_URL = 'http://localhost:3000';
const spikeTestUsers = [
  {
    email: 'spike.test1@example.com',
    password: 'password123',
    name: 'Spike Test User 1',
  },
  {
    email: 'spike.test2@example.com',
    password: 'password123',
    name: 'Spike Test User 2',
  },
  {
    email: 'spike.test3@example.com',
    password: 'password123',
    name: 'Spike Test User 3',
  },
  {
    email: 'spike.test4@example.com',
    password: 'password123',
    name: 'Spike Test User 4',
  },
  {
    email: 'spike.test5@example.com',
    password: 'password123',
    name: 'Spike Test User 5',
  },
  {
    email: 'spike.test6@example.com',
    password: 'password123',
    name: 'Spike Test User 6',
  },
  {
    email: 'spike.test7@example.com',
    password: 'password123',
    name: 'Spike Test User 7',
  },
  {
    email: 'spike.test8@example.com',
    password: 'password123',
    name: 'Spike Test User 8',
  },
];

// Spike test specific questions - shorter for faster execution
const spikeQuestions = [
  {
    title: 'Spike Test: API Performance Question',
    content:
      'Testing API response under sudden load spike. How does the system handle rapid user increase?',
  },
  {
    title: 'Spike Test: Database Connection Question',
    content:
      'During traffic spikes, how should we manage database connections and query performance?',
  },
  {
    title: 'Spike Test: Memory Usage Question',
    content:
      'What happens to memory usage during sudden traffic increases in Node.js applications?',
  },
  {
    title: 'Spike Test: Load Balancing Question',
    content:
      'How effective is load balancing during unexpected traffic spikes?',
  },
];

const spikeAnswers = [
  'During spikes, API response times may increase. Consider implementing circuit breakers and rate limiting.',
  'Database connection pooling becomes critical during spikes. Monitor connection limits and query performance.',
  'Memory usage can spike rapidly. Implement proper garbage collection and memory monitoring.',
  'Load balancers should distribute spike traffic evenly. Monitor for hot spots and adjust accordingly.',
];

// Helper functions
function getRandomUser() {
  return spikeTestUsers[Math.floor(Math.random() * spikeTestUsers.length)];
}

function getRandomQuestion() {
  return spikeQuestions[Math.floor(Math.random() * spikeQuestions.length)];
}

function getRandomAnswer() {
  return spikeAnswers[Math.floor(Math.random() * spikeAnswers.length)];
}

// Helper function to register user
function registerUser(user: { email: string; password: string; name: string }) {
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return registerRes.status === 200 || registerRes.status === 400; // 400 might mean user exists
}

// Helper function to login
function login(user: { email: string; password: string }) {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const isSuccess = loginRes.status === 200;
  authSuccessRate.add(isSuccess ? 1 : 0);

  if (isSuccess) {
    const responseData = loginRes.json();
    return responseData.access_token || responseData.data?.access_token;
  }
  return null;
}

// Helper function to get available questions
function getAvailableQuestions() {
  const response = http.get(`${BASE_URL}/api/questions`);
  if (response.status === 200) {
    const responseData = response.json();
    return responseData.data || responseData;
  }
  return [];
}

// Main spike test function
export default function () {
  const user = getRandomUser();
  if (!user) {
    console.log('Failed to get test user');
    errorRate.add(1);
    return;
  }

  const userAgent = `K6-QA-SpikeTest-${Math.floor(Math.random() * 10000)}`;
  const sessionId = `spike_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 6)}`;

  // Detect if we're in spike phase based on current VUs
  const currentPhase = __VU > 30 ? 'spike' : __VU > 15 ? 'ramp' : 'normal';

  console.log(`[${sessionId}] Phase: ${currentPhase}, VU: ${__VU}`);

  // 1. Quick health check
  const healthCheck = http.get(`${BASE_URL}/api/questions`, {
    headers: { 'User-Agent': userAgent },
    timeout: currentPhase === 'spike' ? '10s' : '5s', // Higher timeout during spike
  });

  check(healthCheck, {
    'Health check status is 200': r => r.status === 200,
    [`Health check response time < ${
      currentPhase === 'spike' ? '8000' : '3000'
    }ms`]: r => r.timings.duration < (currentPhase === 'spike' ? 8000 : 3000),
  });

  if (healthCheck.status !== 200) {
    errorRate.add(1);
  }

  // 2. Authentication with adaptive timeout
  registerUser(user);
  const token = login(user);

  if (token) {
    console.log(`[${sessionId}] Auth successful in ${currentPhase} phase`);

    // 3. Simplified actions during spike
    if (currentPhase === 'spike') {
      // During spike, do minimal actions to test system resilience

      // Quick question creation
      const questionData = getRandomQuestion();
      if (questionData) {
        const createQuestionRes = http.post(
          `${BASE_URL}/api/questions/ask`,
          JSON.stringify({
            title: `SPIKE: ${questionData.title} (${sessionId})`,
            content: questionData.content,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'User-Agent': userAgent,
            },
            timeout: '15s', // Extended timeout during spike
          }
        );

        const questionCreated = createQuestionRes.status === 200;
        questionCreationRate.add(questionCreated ? 1 : 0);

        check(createQuestionRes, {
          'Spike question creation successful': r => r.status === 200,
          'Spike question creation time < 10s': r => r.timings.duration < 10000,
        });

        if (!questionCreated) {
          errorRate.add(1);
        }
      }

      // Quick answer if possible
      const availableQuestions = getAvailableQuestions();
      if (availableQuestions && availableQuestions.length > 0) {
        const randomQuestion = availableQuestions[0]; // Take first available
        const questionId = randomQuestion._id || randomQuestion.id;

        if (questionId) {
          const answerRes = http.post(
            `${BASE_URL}/api/questions/${questionId}/answers`,
            JSON.stringify({
              content: `SPIKE ANSWER: ${getRandomAnswer()} (${sessionId})`,
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
            'Spike answer creation successful': r => r.status === 200,
            'Spike answer creation time < 8s': r => r.timings.duration < 8000,
          });

          if (!answerCreated) {
            errorRate.add(1);
          }
        }
      }
    } else {
      // Normal or recovery phase - full functionality test

      const questionData = getRandomQuestion();
      if (questionData) {
        const createQuestionRes = http.post(
          `${BASE_URL}/api/questions/ask`,
          JSON.stringify({
            title: `${currentPhase.toUpperCase()}: ${
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
          }
        );

        const questionCreated = createQuestionRes.status === 200;
        questionCreationRate.add(questionCreated ? 1 : 0);

        // Track recovery success
        if (currentPhase === 'normal' && __VU <= 15) {
          spikeRecoveryRate.add(questionCreated ? 1 : 0);
        }

        check(createQuestionRes, {
          'Normal question creation successful': r => r.status === 200,
          'Normal question creation time < 3s': r => r.timings.duration < 3000,
        });

        if (!questionCreated) {
          errorRate.add(1);
        }
      }

      // Full answer workflow
      const availableQuestions = getAvailableQuestions();
      if (availableQuestions && availableQuestions.length > 0) {
        const randomQuestion =
          availableQuestions[
            Math.floor(Math.random() * Math.min(2, availableQuestions.length))
          ];
        const questionId = randomQuestion._id || randomQuestion.id;

        if (questionId) {
          // Get question details
          const questionRes = http.get(
            `${BASE_URL}/api/questions/${questionId}`,
            {
              headers: { 'User-Agent': userAgent },
            }
          );

          check(questionRes, {
            'Question details fetch successful': r => r.status === 200,
            'Question details response time < 2s': r =>
              r.timings.duration < 2000,
          });

          // Add answer
          const answerRes = http.post(
            `${BASE_URL}/api/questions/${questionId}/answers`,
            JSON.stringify({
              content: `${currentPhase.toUpperCase()} ANSWER: ${getRandomAnswer()} (${sessionId})`,
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'User-Agent': userAgent,
              },
            }
          );

          const answerCreated = answerRes.status === 200;
          answerCreationRate.add(answerCreated ? 1 : 0);

          // Track recovery success
          if (currentPhase === 'normal' && __VU <= 15) {
            spikeRecoveryRate.add(answerCreated ? 1 : 0);
          }

          check(answerRes, {
            'Normal answer creation successful': r => r.status === 200,
            'Normal answer creation time < 3s': r => r.timings.duration < 3000,
          });

          if (!answerCreated) {
            errorRate.add(1);
          }
        }
      }
    }

    // Logout
    const logoutRes = http.get(`${BASE_URL}/api/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    check(logoutRes, {
      'Logout successful': r => r.status === 200,
    });
  } else {
    console.log(`[${sessionId}] Auth failed in ${currentPhase} phase`);
    errorRate.add(1);
  }

  // Adaptive think time based on phase
  const thinkTime =
    currentPhase === 'spike'
      ? Math.random() * 0.5 + 0.2 // 0.2-0.7s during spike
      : Math.random() * 1.5 + 0.5; // 0.5-2s during normal

  sleep(thinkTime);
}
