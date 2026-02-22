import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authSuccessRate = new Rate('auth_success');
const questionCreationRate = new Rate('question_creation_success');
const answerCreationRate = new Rate('answer_creation_success');

// Test configuration - QA System Quick Test
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 users over 30 seconds
    { duration: '60s', target: 5 }, // Stay at 5 users for 60 seconds
    { duration: '30s', target: 0 }, // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    errors: ['rate<0.1'], // Custom error rate should be below 10%
    auth_success: ['rate>0.8'], // Auth success rate should be above 80%
    question_creation_success: ['rate>0.8'], // Question creation success rate should be above 80%
    answer_creation_success: ['rate>0.7'], // Answer creation success rate should be above 70%
  },
};

// Test data
const BASE_URL = 'http://localhost:3000';
const testUsers = [
  { email: 'test1@example.com', password: 'Password1!', name: 'Test User 1' },
  { email: 'test2@example.com', password: 'Password1!', name: 'Test User 2' },
  { email: 'test3@example.com', password: 'Password1!', name: 'Test User 3' },
  { email: 'test4@example.com', password: 'Password1!', name: 'Test User 4' },
  { email: 'test5@example.com', password: 'Password1!', name: 'Test User 5' },
];

// Sample questions and answers
const sampleQuestions = [
  {
    title: "React Hook'ları nasıl kullanılır?",
    content:
      "React Hook'ları ile state management konusunda yardıma ihtiyacım var. useState ve useEffect hook'larının doğru kullanımı hakkında bilgi verebilir misiniz?",
  },
  {
    title: 'Node.js Performance Optimizasyonu',
    content:
      "Node.js uygulamalarında performans optimizasyonu için hangi teknikleri önerirsiniz? Özellikle büyük veri işlemleri için best practice'ler nelerdir?",
  },
  {
    title: 'Database İndex Stratejileri',
    content:
      "MongoDB'de büyük koleksiyonlar için index stratejileri nasıl belirlenmeli? Compound index'ler ne zaman kullanılmalı?",
  },
  {
    title: 'API Security Best Practices',
    content:
      'REST API güvenliği için hangi önlemleri almalıyız? JWT token yönetimi ve rate limiting konularında tavsiyeleriniz nelerdir?',
  },
];

const sampleAnswers = [
  "Bu konuda deneyimim var. useState hook'u ile component state'ini yönetebilirsiniz. useEffect ise side effect'ler için kullanılır.",
  "Performance optimizasyonu için öncelikle profiling yapmanızı öneririm. Node.js cluster modülünü kullanarak CPU core'larını verimli kullanabilirsiniz.",
  "MongoDB'de index'leme stratejisi query pattern'lerinize bağlı. Sık kullandığınız field'lar için compound index oluşturun.",
  'API güvenliği için input validation, rate limiting, HTTPS kullanımı ve JWT token expiration süreleri kritik faktörlerdir.',
];

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomQuestion() {
  return sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
}

function getRandomAnswer() {
  return sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)];
}

// Helper function to register a user (if not exists)
function registerUser(user: { email: string; password: string; name: string }) {
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return registerRes.status === 200 || registerRes.status === 400; // 400 might mean user already exists
}

// Helper function to login and get token
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

// Main test function
export default function () {
  const user = getRandomUser();
  if (!user) {
    console.log('Failed to get test user');
    errorRate.add(1);
    return;
  }

  const userAgent = `K6-QA-Test-User-${Math.floor(Math.random() * 1000)}`;

  // 1. Test public endpoints
  console.log('Testing public endpoints...');

  // Get all questions (public)
  const questionsResponse = http.get(`${BASE_URL}/api/questions`, {
    headers: { 'User-Agent': userAgent },
  });

  check(questionsResponse, {
    'GET /api/questions status is 200': r => r.status === 200,
    'GET /api/questions response time < 1000ms': r => r.timings.duration < 1000,
    'GET /api/questions has data': r => {
      try {
        const data = r.json();
        return data !== null;
      } catch {
        return false;
      }
    },
  });

  if (questionsResponse.status !== 200) {
    errorRate.add(1);
  }

  // Get all users (public)
  const usersResponse = http.get(`${BASE_URL}/api/users`, {
    headers: { 'User-Agent': userAgent },
  });

  check(usersResponse, {
    'GET /api/users status is 200': r => r.status === 200,
    'GET /api/users response time < 1000ms': r => r.timings.duration < 1000,
  });

  sleep(0.5);

  // 2. Authentication flow
  console.log(`Testing authentication for ${user.email}...`);

  // Register user (might already exist, that's ok)
  registerUser(user);

  // Login
  const token = login(user);

  if (token) {
    console.log('Authentication successful, testing protected endpoints...');

    // 3. Test authenticated endpoints

    // Get user profile
    const profileResponse = http.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    check(profileResponse, {
      'GET /api/auth/profile status is 200': r => r.status === 200,
      'GET /api/auth/profile response time < 1000ms': r =>
        r.timings.duration < 1000,
    });

    sleep(0.3);

    // 4. Create a question
    const questionData = getRandomQuestion();
    if (!questionData) {
      console.log('Failed to get question data');
      errorRate.add(1);
      return;
    }

    const uniqueSuffix = `_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const createQuestionRes = http.post(
      `${BASE_URL}/api/questions/ask`,
      JSON.stringify({
        title: `${questionData.title}${uniqueSuffix}`,
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

    check(createQuestionRes, {
      'POST /api/questions/ask status is 200': r => r.status === 200,
      'POST /api/questions/ask response time < 2000ms': r =>
        r.timings.duration < 2000,
    });

    if (!questionCreated) {
      errorRate.add(1);
    }

    let _createdQuestionId = null;
    if (questionCreated) {
      try {
        const responseData = createQuestionRes.json();
        _createdQuestionId = responseData.data?._id || responseData._id;
      } catch (_e) {
        console.log('Error parsing question creation response');
      }
    }

    sleep(0.5);

    // 5. Get available questions and try to answer one
    const availableQuestions = getAvailableQuestions();

    if (availableQuestions && availableQuestions.length > 0) {
      const randomQuestion =
        availableQuestions[
          Math.floor(Math.random() * availableQuestions.length)
        ];
      const questionId = randomQuestion._id || randomQuestion.id;

      if (questionId) {
        // Get specific question
        const singleQuestionRes = http.get(
          `${BASE_URL}/api/questions/${questionId}`,
          {
            headers: { 'User-Agent': userAgent },
          }
        );

        check(singleQuestionRes, {
          'GET /api/questions/:id status is 200': r => r.status === 200,
          'GET /api/questions/:id response time < 1000ms': r =>
            r.timings.duration < 1000,
        });

        // Get answers for this question
        const answersRes = http.get(
          `${BASE_URL}/api/questions/${questionId}/answers`,
          {
            headers: { 'User-Agent': userAgent },
          }
        );

        check(answersRes, {
          'GET /api/questions/:id/answers status is 200': r => r.status === 200,
          'GET /api/questions/:id/answers response time < 1000ms': r =>
            r.timings.duration < 1000,
        });

        sleep(0.3);

        // Create an answer
        const answerRes = http.post(
          `${BASE_URL}/api/questions/${questionId}/answers`,
          JSON.stringify({
            content: `${getRandomAnswer()} (Test Answer from K6 - ${Date.now()})`,
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

        check(answerRes, {
          'POST /api/questions/:id/answers status is 200': r =>
            r.status === 200,
          'POST /api/questions/:id/answers response time < 2000ms': r =>
            r.timings.duration < 2000,
        });

        if (!answerCreated) {
          errorRate.add(1);
        }
      }
    }

    // 6. Test logout
    const logoutRes = http.get(`${BASE_URL}/api/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    check(logoutRes, {
      'GET /api/auth/logout status is 200': r => r.status === 200,
      'GET /api/auth/logout response time < 500ms': r =>
        r.timings.duration < 500,
    });
  } else {
    console.log('Authentication failed');
    errorRate.add(1);
  }

  // Think time between iterations
  sleep(1);
}
