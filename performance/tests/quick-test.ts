import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration - Quick test
export const options = {
  stages: [
    { duration: "10s", target: 2 }, // Ramp up to 2 users over 10 seconds
    { duration: "20s", target: 2 }, // Stay at 2 users for 20 seconds
    { duration: "10s", target: 0 }, // Ramp down to 0 users over 10 seconds
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
      title: `Quick Test Question ${uniqueSuffix}`,
      content:
        "This is a quick test question with sufficient content length to meet validation requirements.",
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
  } else {
    errorRate.add(1);
  }

  // Think time between requests
  sleep(0.5);
} 