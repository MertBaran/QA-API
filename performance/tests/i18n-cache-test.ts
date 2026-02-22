import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics for i18n testing
const errorRate = new Rate('errors');

// Test configuration for i18n cache performance
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Warm up cache
    { duration: '2m', target: 15 }, // Normal load with mixed languages
    { duration: '1m', target: 30 }, // Higher load to test cache efficiency
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    errors: ['rate<0.1'], // Custom error rate should be below 10%
  },
};

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test users with different language preferences
const testUsers = [
  {
    email: 'testuser1@example.com',
    password: 'Password1!',
    preferredLang: 'en',
  },
  {
    email: 'testuser2@example.com',
    password: 'Password1!',
    preferredLang: 'tr',
  },
  {
    email: 'testuser3@example.com',
    password: 'Password1!',
    preferredLang: 'de',
  },
];

// Language configurations for testing
const languageConfigs = [
  { lang: 'en', header: 'en-US,en;q=0.9' },
  { lang: 'tr', header: 'tr-TR,tr;q=0.9,en;q=0.8' },
  { lang: 'de', header: 'de-DE,de;q=0.9,en;q=0.8' },
];

// Expected messages for validation
const expectedMessages = {
  en: 'Logout success',
  tr: 'Çıkış başarılı',
  de: 'Abmeldung erfolgreich',
};

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomLanguageConfig() {
  return languageConfigs[Math.floor(Math.random() * languageConfigs.length)];
}

function login(user: any): string | null {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': user.preferredLang || 'en',
      },
    }
  );

  if (response.status === 200) {
    const body = response.json() as any;
    return body.access_token;
  }

  errorRate.add(1);
  return null;
}

// Main test function
export default function () {
  const user = getRandomUser();
  const langConfig = getRandomLanguageConfig();

  if (!user || !langConfig) {
    errorRate.add(1);
    return;
  }

  // 1. Test login with language preference
  const token = login(user);

  if (!token) {
    errorRate.add(1);
    return;
  }

  // 2. Test multilingual logout (this tests i18n cache)
  const logoutResponse = http.get(`${BASE_URL}/api/auth/logout`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': langConfig.header,
    },
  });

  check(logoutResponse, {
    [`logout status is 200 (${langConfig.lang})`]: r => r.status === 200,
    [`logout response time < 1000ms (${langConfig.lang})`]: r =>
      r.timings.duration < 1000,
  });

  if (logoutResponse.status === 200) {
    const body = logoutResponse.json() as any;
    const expectedMessage =
      expectedMessages[langConfig.lang as keyof typeof expectedMessages];

    check(logoutResponse, {
      [`logout message correct for ${langConfig.lang}`]: () =>
        body.message === expectedMessage,
    });
  } else {
    errorRate.add(1);
  }

  // 3. Test forgot password with different languages
  const forgotPasswordResponse = http.post(
    `${BASE_URL}/api/auth/forgotpassword`,
    JSON.stringify({ email: user.email }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': langConfig.header,
      },
    }
  );

  check(forgotPasswordResponse, {
    [`forgot password status is 200 (${langConfig.lang})`]: r =>
      r.status === 200,
    [`forgot password response time < 1500ms (${langConfig.lang})`]: r =>
      r.timings.duration < 1500,
  });

  if (forgotPasswordResponse.status !== 200) {
    errorRate.add(1);
  }

  // 4. Test question operations with language headers
  const newToken = login(user); // Get new token since logout invalidated the old one
  if (newToken) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newToken}`,
      'Accept-Language': langConfig.header,
    };

    // Create a question
    const uniqueSuffix = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const questionData = {
      title: `i18n Test Question ${langConfig.lang} ${uniqueSuffix}`,
      content: `This is an i18n test question in ${langConfig.lang} with sufficient content length to meet validation requirements.`,
    };

    const createResponse = http.post(
      `${BASE_URL}/api/questions/ask`,
      JSON.stringify(questionData),
      { headers }
    );

    check(createResponse, {
      [`question creation status is 200 (${langConfig.lang})`]: r =>
        r.status === 200,
      [`question creation response time < 2000ms (${langConfig.lang})`]: r =>
        r.timings.duration < 2000,
    });

    if (createResponse.status === 200) {
      const _questionId = (createResponse.json() as any).data._id;

      // Test getting all questions
      const getResponse = http.get(`${BASE_URL}/api/questions`, { headers });

      check(getResponse, {
        [`get questions status is 200 (${langConfig.lang})`]: r =>
          r.status === 200,
        [`get questions response time < 1000ms (${langConfig.lang})`]: r =>
          r.timings.duration < 1000,
      });

      if (getResponse.status !== 200) {
        errorRate.add(1);
      }
    } else {
      errorRate.add(1);
    }
  }

  // 5. Test rapid language switching to stress cache
  if (Math.random() < 0.3) {
    // 30% chance to do rapid switching
    const rapidSwitchConfigs = [
      { lang: 'en', header: 'en' },
      { lang: 'tr', header: 'tr' },
      { lang: 'de', header: 'de' },
    ];

    const switchToken = login(user);
    if (switchToken) {
      rapidSwitchConfigs.forEach((config, index) => {
        const response = http.get(`${BASE_URL}/api/questions`, {
          headers: {
            Authorization: `Bearer ${switchToken}`,
            'Accept-Language': config.header,
          },
        });

        check(response, {
          [`rapid switch ${index} status is 200 (${config.lang})`]: r =>
            r.status === 200,
          [`rapid switch ${index} response time < 500ms (${config.lang})`]: r =>
            r.timings.duration < 500,
        });

        if (response.status !== 200) {
          errorRate.add(1);
        }

        sleep(0.1); // Small delay between rapid switches
      });
    }
  }

  // Think time between main operations
  sleep(0.5);
}
