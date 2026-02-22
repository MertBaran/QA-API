import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authSuccessRate = new Rate('auth_success');
const questionCreationRate = new Rate('question_creation_success');
const answerCreationRate = new Rate('answer_creation_success');
const questionUpdateRate = new Rate('question_update_success');
const _answerUpdateRate = 0.1; // 10% of questions get answers

// Test configuration - QA System Load Test
export const options = {
  stages: [
    { duration: '2m', target: 15 }, // Ramp up to 15 users over 2 minutes
    { duration: '8m', target: 15 }, // Stay at 15 users for 8 minutes
    { duration: '3m', target: 25 }, // Spike to 25 users over 3 minutes
    { duration: '2m', target: 25 }, // Stay at 25 users for 2 minutes
    { duration: '3m', target: 0 }, // Ramp down to 0 users over 3 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should be below 3s
    http_req_failed: ['rate<0.15'], // Error rate should be below 15%
    errors: ['rate<0.15'], // Custom error rate should be below 15%
    auth_success: ['rate>0.75'], // Auth success rate should be above 75%
    question_creation_success: ['rate>0.7'], // Question creation success rate should be above 70%
    answer_creation_success: ['rate>0.65'], // Answer creation success rate should be above 65%
    question_update_success: ['rate>0.7'], // Question update success rate should be above 70%
    answer_update_success: ['rate>0.65'], // Answer update success rate should be above 65%
  },
};

// Test data
const BASE_URL = 'http://localhost:3000';
const testUsers = [
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
];

// Extended sample questions and answers
const sampleQuestions = [
  {
    title: 'React Performance Optimizasyonu Teknikleri',
    content:
      "React uygulamalarında performans sorunları yaşıyorum. Büyük component tree'leri, re-render problemleri ve state yönetimi konularında en etkili optimizasyon teknikleri nelerdir? React.memo, useMemo, useCallback gibi hook'ların doğru kullanımı hakkında detaylı bilgi verebilir misiniz?",
  },
  {
    title: 'Node.js Mikroservis Mimarisi Best Practices',
    content:
      "Büyük ölçekli Node.js uygulamalarında mikroservis mimarisine geçiş düşünüyoruz. Service discovery, inter-service communication, error handling ve monitoring konularında hangi teknolojileri ve pattern'leri önerirsiniz? Docker, Kubernetes entegrasyonu için de tavsiyeler bekliyorum.",
  },
  {
    title: 'MongoDB Aggregation Pipeline Optimizasyonu',
    content:
      "MongoDB'de complex aggregation pipeline'ları yazıyorum ancak performans sorunları yaşıyorum. Index usage, memory limitations, $lookup optimizasyonu ve stage ordering konularında hangi stratejileri uygulamalıyım? Milyonlarca document ile çalışırken en etkili yaklaşım nedir?",
  },
  {
    title: 'JWT Token Security ve Management',
    content:
      "Web uygulamalarında JWT token güvenliği konusunda endişelerim var. Token expiration, refresh token implementation, XSS/CSRF protection ve secure storage konularında best practice'ler nelerdir? Access token ve refresh token için optimal süre değerleri nasıl belirlenmeli?",
  },
  {
    title: 'Docker Multi-Stage Build Optimizasyonu',
    content:
      'Docker image boyutlarını minimize etmek için multi-stage build kullanıyorum ancak build süreleri çok uzun. Layer caching, dependency optimization ve .dockerignore stratejileri hakkında tavsiyeleriniz var mı? Production ve development ortamları için farklı stratejiler uygulamalı mıyım?',
  },
  {
    title: 'Redis Caching Strategies',
    content:
      "Uygulamamda Redis ile caching implement ediyorum. Cache invalidation, TTL management, memory usage optimization ve cluster setup konularında guidance'a ihtiyacım var. Write-through, write-behind, cache-aside pattern'lerini hangi durumlarda kullanmalıyım?",
  },
  {
    title: 'TypeScript Generic Types ve Advanced Patterns',
    content:
      "TypeScript'te generic types, conditional types ve mapped types kullanarak type-safe bir library geliştiriyorum. Complex type relationships, inference optimization ve utility types creation konularında daha derinlemesine bilgi edinmek istiyorum.",
  },
  {
    title: 'Kubernetes Deployment ve Scaling Strategies',
    content:
      "Kubernetes cluster'ında auto-scaling, resource limits, health checks ve rolling updates konularında sorunlar yaşıyorum. HPA, VPA konfigürasyonları ve monitoring setup için en iyi yaklaşımlar nelerdir?",
  },
];

const sampleAnswers = [
  "Bu konuda extensive experience'ım var. React performance optimizasyonu için öncelikle React DevTools Profiler kullanarak bottleneck'leri identify etmenizi öneriyorum. useMemo ve useCallback'i sadece gerekli yerlerde kullanın, her şeyi memoize etmeye çalışmayın. Component composition pattern'lerini leverage edin ve child component'leri prop olarak pass etmeyi consider edin.",

  "Mikroservis mimarisi için öncelikle domain boundaries'i doğru çizmeniz kritik. Service discovery için Consul veya etcd, communication için gRPC veya message queue (RabbitMQ/Apache Kafka) recommend ediyorum. Circuit breaker pattern implement edin ve comprehensive logging/monitoring setup'ı yapın. OpenTelemetry kullanarak distributed tracing implement edin.",

  "MongoDB aggregation performance için pipeline stage order'ı çok önemli. Match ve sort stage'lerini mümkün olduğunca erken koyun. Index usage'ı explain() ile analyze edin. Compound index'leri query pattern'lerinize göre design edin. Large dataset'ler için allowDiskUse option'ını consider edin ama memory'de process etmeye çalışın.",

  "JWT security için short-lived access token (15-30 min) ve long-lived refresh token (7-30 days) strategy'si recommend ediyorum. HttpOnly cookies kullanarak XSS protection sağlayın. CSRF token implementation'ı yapın. Token'ları localStorage'a koymayın, secure httpOnly cookies kullanın. Proper key rotation implement edin.",

  "Multi-stage build optimization için dependency installation'ı separate stage'de yapın ve source code changes'den önce koyun. .dockerignore'da unnecessary files'ı exclude edin. Base image olarak alpine variants kullanın. Build cache'i maximize etmek için layer order'ını optimize edin. Production build'de development dependencies'leri exclude edin.",

  "Redis caching için cache-aside pattern'i most common use case'ler için recommend ediyorum. TTL values'lari data nature'ına göre set edin - frequently changing data için shorter TTL. Memory optimization için appropriate data structures kullanın (hash, sets, sorted sets). Redis Cluster for horizontal scaling ve Redis Sentinel for high availability setup edin.",

  "TypeScript advanced patterns için generic constraints kullanarak type safety'i improve edin. Conditional types ile runtime behavior'a based type inference implement edin. Mapped types ile existing types'ı transform edin. Template literal types kullanarak string manipulation'da type safety sağlayın. Utility types create ederken performance implications'ı consider edin.",

  "Kubernetes scaling için HPA configuration'da appropriate metrics (CPU, memory, custom metrics) define edin. Resource requests ve limits'i correctly set edin - requests for scheduling, limits for runtime constraints. Readiness ve liveness probes implement edin. Rolling update strategy'de maxSurge ve maxUnavailable values'lari optimize edin. Cluster autoscaler ile node-level scaling setup edin.",
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

// Helper function to get user's own questions
function _getUserQuestions(token: string) {
  const response = http.get(`${BASE_URL}/api/questions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 200) {
    const responseData = response.json();
    const questions = responseData.data || responseData;
    return questions.filter((q: any) => q.user && typeof q.user === 'object');
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

  const userAgent = `K6-QA-LoadTest-User-${Math.floor(Math.random() * 10000)}`;
  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // 1. Test public endpoints with higher load
  console.log(`[${sessionId}] Testing public endpoints...`);

  // Get all questions (public) - simulate browsing
  const questionsResponse = http.get(`${BASE_URL}/api/questions`, {
    headers: { 'User-Agent': userAgent },
  });

  check(questionsResponse, {
    'GET /api/questions status is 200': r => r.status === 200,
    'GET /api/questions response time < 2000ms': r => r.timings.duration < 2000,
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

  // Get all users (public) - simulate user discovery
  const usersResponse = http.get(`${BASE_URL}/api/users`, {
    headers: { 'User-Agent': userAgent },
  });

  check(usersResponse, {
    'GET /api/users status is 200': r => r.status === 200,
    'GET /api/users response time < 1500ms': r => r.timings.duration < 1500,
  });

  // Simulate reading specific questions
  const availableQuestions = getAvailableQuestions();
  if (availableQuestions && availableQuestions.length > 0) {
    const randomQuestion =
      availableQuestions[
        Math.floor(Math.random() * Math.min(3, availableQuestions.length))
      ];
    const questionId = randomQuestion._id || randomQuestion.id;

    if (questionId) {
      const singleQuestionRes = http.get(
        `${BASE_URL}/api/questions/${questionId}`,
        {
          headers: { 'User-Agent': userAgent },
        }
      );

      check(singleQuestionRes, {
        'GET /api/questions/:id status is 200': r => r.status === 200,
        'GET /api/questions/:id response time < 1500ms': r =>
          r.timings.duration < 1500,
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
        'GET /api/questions/:id/answers response time < 1500ms': r =>
          r.timings.duration < 1500,
      });
    }
  }

  sleep(0.3);

  // 2. Authentication flow
  console.log(`[${sessionId}] Testing authentication for ${user.email}...`);

  // Register user (might already exist, that's ok)
  registerUser(user);

  // Login
  const token = login(user);

  if (token) {
    console.log(
      `[${sessionId}] Authentication successful, testing protected endpoints...`
    );

    // 3. Test authenticated user actions

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

    sleep(0.2);

    // 4. Create multiple questions (simulate active user)
    const questionCount = Math.floor(Math.random() * 3) + 1; // 1-3 questions
    const createdQuestionIds: string[] = [];

    for (let i = 0; i < questionCount; i++) {
      const questionData = getRandomQuestion();
      if (!questionData) {
        console.log('Failed to get question data');
        errorRate.add(1);
        continue;
      }

      const uniqueSuffix = `_${sessionId}_${i}_${Date.now()}`;

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
        'POST /api/questions/ask response time < 3000ms': r =>
          r.timings.duration < 3000,
      });

      if (questionCreated) {
        try {
          const responseData = createQuestionRes.json();
          const questionId = responseData.data?._id || responseData._id;
          if (questionId) {
            createdQuestionIds.push(questionId);
          }
        } catch (_e) {
          console.log('Error parsing question creation response');
        }
      } else {
        errorRate.add(1);
      }

      sleep(0.2);
    }

    // 5. Answer other users' questions
    if (availableQuestions && availableQuestions.length > 0) {
      const questionsToAnswer = Math.min(2, availableQuestions.length);

      for (let i = 0; i < questionsToAnswer; i++) {
        const randomQuestion =
          availableQuestions[
            Math.floor(Math.random() * availableQuestions.length)
          ];
        const questionId = randomQuestion._id || randomQuestion.id;

        if (questionId) {
          const answerRes = http.post(
            `${BASE_URL}/api/questions/${questionId}/answers`,
            JSON.stringify({
              content: `${getRandomAnswer()} (Load Test Answer from K6 - ${sessionId} - ${Date.now()})`,
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
            'POST /api/questions/:id/answers response time < 3000ms': r =>
              r.timings.duration < 3000,
          });

          if (!answerCreated) {
            errorRate.add(1);
          }

          sleep(0.3);
        }
      }
    }

    // 6. Edit own questions (if any created)
    if (createdQuestionIds.length > 0) {
      const questionToEdit = createdQuestionIds[0];
      const editQuestionRes = http.put(
        `${BASE_URL}/api/questions/${questionToEdit}/edit`,
        JSON.stringify({
          title: `EDITED: ${getRandomQuestion()?.title} (${sessionId})`,
          content: `EDITED CONTENT: ${
            getRandomQuestion()?.content
          } - Updated at ${new Date().toISOString()}`,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': userAgent,
          },
        }
      );

      const questionUpdated = editQuestionRes.status === 200;
      questionUpdateRate.add(questionUpdated ? 1 : 0);

      check(editQuestionRes, {
        'PUT /api/questions/:id/edit status is 200': r => r.status === 200,
        'PUT /api/questions/:id/edit response time < 2000ms': r =>
          r.timings.duration < 2000,
      });

      if (!questionUpdated) {
        errorRate.add(1);
      }
    }

    // 7. Test logout
    const logoutRes = http.get(`${BASE_URL}/api/auth/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': userAgent,
      },
    });

    check(logoutRes, {
      'GET /api/auth/logout status is 200': r => r.status === 200,
      'GET /api/auth/logout response time < 1000ms': r =>
        r.timings.duration < 1000,
    });
  } else {
    console.log(`[${sessionId}] Authentication failed`);
    errorRate.add(1);
  }

  // Think time between iterations (simulate real user behavior)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}
