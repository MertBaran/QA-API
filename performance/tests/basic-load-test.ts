import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: "5m", target: 10 }, // Stay at 10 users for 5 minutes
    { duration: "2m", target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2s
    http_req_failed: ["rate<0.1"], // Error rate should be below 10%
    errors: ["rate<0.1"], // Custom error rate should be below 10%
  },
};

// Test data
const BASE_URL = "http://localhost:3000";
const testUsers = [
  { email: "test1@example.com", password: "password123" },
  { email: "test2@example.com", password: "password123" },
  { email: "test3@example.com", password: "password123" },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to login and get token
function login(user: { email: string; password: string }) {
  if (!user) throw new Error("user is required");
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(user),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (loginRes.status === 200) {
    return loginRes.json("access_token");
  }
  return null;
}

// Helper function to get a valid question ID
function getValidQuestionId() {
  const response = http.get(`${BASE_URL}/api/questions`);
  if (response.status === 200) {
    const questions = response.json("data");
    if (questions && questions.length > 0) {
      return questions[0]._id;
    }
  }
  return null;
}

// Main test function
export default function () {
  const user = getRandomUser();

  // 1. Test public endpoints (no authentication required)
  const questionsResponse = http.get(`${BASE_URL}/api/questions`);

  check(questionsResponse, {
    "GET /api/questions status is 200": (r) => r.status === 200,
    "GET /api/questions response time < 1000ms": (r) =>
      r.timings.duration < 1000,
  });

  if (questionsResponse.status !== 200) {
    errorRate.add(1);
  }

  // 2. Test authentication
  if (!user) throw new Error("user is required");
  const token = login(user);

  if (token) {
    // 3. Test protected endpoints with authentication
    const uniqueSuffix = `${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const questionData = {
      title: `Performance Test Question ${uniqueSuffix}`,
      content:
        "This is a performance test question with sufficient content length to meet validation requirements.",
    };

    const createQuestionRes = http.post(
      `${BASE_URL}/api/questions/ask`,
      JSON.stringify(questionData),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    check(createQuestionRes, {
      "POST /api/questions/ask status is 200": (r) => r.status === 200,
      "POST /api/questions/ask response time < 2000ms": (r) =>
        r.timings.duration < 2000,
    });

    if (createQuestionRes.status !== 200) {
      errorRate.add(1);
    }

    // 4. Test getting questions with authentication
    const authQuestionsRes = http.get(`${BASE_URL}/api/questions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    check(authQuestionsRes, {
      "GET /api/questions with auth status is 200": (r) => r.status === 200,
      "GET /api/questions with auth response time < 2000ms": (r) =>
        r.timings.duration < 2000,
    });

    if (authQuestionsRes.status !== 200) {
      errorRate.add(1);
    }

    // 5. Test getting a specific question (if we have a valid ID)
    const validQuestionId = getValidQuestionId();
    if (validQuestionId) {
      const singleQuestionRes = http.get(
        `${BASE_URL}/api/questions/${validQuestionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      check(singleQuestionRes, {
        "GET /api/questions/:id status is 200": (r) => r.status === 200,
        "GET /api/questions/:id response time < 1000ms": (r) =>
          r.timings.duration < 1000,
      });

      if (singleQuestionRes.status !== 200) {
        errorRate.add(1);
      }
    }
  } else {
    errorRate.add(1);
  }

  // Think time between requests
  sleep(1);
} 