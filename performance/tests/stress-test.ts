import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration for stress testing
export const options = {
  stages: [
    { duration: "1m", target: 20 }, // Ramp up to 20 users
    { duration: "2m", target: 20 }, // Stay at 20 users
    { duration: "1m", target: 50 }, // Ramp up to 50 users
    { duration: "3m", target: 50 }, // Stay at 50 users
    { duration: "1m", target: 100 }, // Ramp up to 100 users
    { duration: "3m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95% of requests should be below 3s
    http_req_failed: ["rate<0.15"], // Error rate should be below 15%
    errors: ["rate<0.15"], // Custom error rate should be below 15%
  },
};

// Test data
const BASE_URL = "http://localhost:3000";

// Generate random user data
function generateRandomUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    firstName: `User${timestamp}`,
    lastName: `Test${random}`,
    email: `user${timestamp}${random}@example.com`,
    password: "password123",
  };
}

// Helper function to register a new user
function registerUser(userData: { firstName: string; lastName: string; email: string; password: string }) {
  const response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(userData),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status === 200) {
    return response.json("access_token");
  }
  return null;
}

// Helper function to login
function login(userData: { email: string; password: string }) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status === 200) {
    return response.json("access_token");
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
  // Generate random user data
  const userData = generateRandomUser();

  // 1. Register new user (simulate new user signup)
  const registerToken = registerUser(userData);

  // 2. Login with the user
  const loginToken = login(userData);

  // 3. Test various endpoints with authentication
  if (loginToken) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginToken}`,
    };

    // Test question creation
    const uniqueSuffix = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const questionData = {
      title: `Stress Test Question ${uniqueSuffix}`,
      content:
        "This is a stress test question with sufficient content length to meet validation requirements. The content should be at least 20 characters long.",
    };

    const createQuestionRes = http.post(
      `${BASE_URL}/api/questions/ask`,
      JSON.stringify(questionData),
      { headers }
    );

    check(createQuestionRes, {
      "question creation status is 200": (r) => r.status === 200,
      "question creation response time < 3000ms": (r) =>
        r.timings.duration < 3000,
    });

    if (createQuestionRes.status === 200) {
      const questionId = createQuestionRes.json("data._id");

      // Test answer creation if question was created successfully
      if (questionId) {
        const answerData = {
          content:
            "This is a stress test answer with sufficient content length to meet validation requirements.",
        };

        const createAnswerRes = http.post(
          `${BASE_URL}/api/questions/${questionId}/answers`,
          JSON.stringify(answerData),
          { headers }
        );

        check(createAnswerRes, {
          "answer creation status is 200": (r) => r.status === 200,
          "answer creation response time < 3000ms": (r) =>
            r.timings.duration < 3000,
        });

        if (createAnswerRes.status !== 200) {
          errorRate.add(1);
        }
      }
    } else {
      errorRate.add(1);
    }

    // Test question listing
    const questionsRes = http.get(`${BASE_URL}/api/questions`, { headers });

    check(questionsRes, {
      "questions listing status is 200": (r) => r.status === 200,
      "questions listing response time < 2000ms": (r) =>
        r.timings.duration < 2000,
    });

    if (questionsRes.status !== 200) {
      errorRate.add(1);
    }

    // Test getting a specific question
    const validQuestionId = getValidQuestionId();
    if (validQuestionId) {
      const singleQuestionRes = http.get(
        `${BASE_URL}/api/questions/${validQuestionId}`,
        { headers }
      );

      check(singleQuestionRes, {
        "single question status is 200": (r) => r.status === 200,
        "single question response time < 2000ms": (r) =>
          r.timings.duration < 2000,
      });

      if (singleQuestionRes.status !== 200) {
        errorRate.add(1);
      }
    }
  } else {
    errorRate.add(1);
  }

  // Test public endpoints (no authentication)
  const publicEndpoints = ["/api/questions"];

  publicEndpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`);

    check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 2000ms`]: (r) =>
        r.timings.duration < 2000,
    });

    if (response.status !== 200) {
      errorRate.add(1);
    }
  });

  // Think time between requests
  sleep(0.5);
} 