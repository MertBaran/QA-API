import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration for spike testing
export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Normal load
    { duration: "30s", target: 100 }, // Spike to 100 users
    { duration: "1m", target: 100 }, // Stay at spike
    { duration: "30s", target: 10 }, // Drop back to normal
    { duration: "1m", target: 10 }, // Stay at normal
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% of requests should be below 5s
    http_req_failed: ["rate<0.2"], // Error rate should be below 20%
    errors: ["rate<0.2"], // Custom error rate should be below 20%
  },
};

// Test data
const BASE_URL = "http://localhost:3000";

// Pre-created test users for consistent testing
const testUsers = [
  { email: "spike1@example.com", password: "password123" },
  { email: "spike2@example.com", password: "password123" },
  { email: "spike3@example.com", password: "password123" },
  { email: "spike4@example.com", password: "password123" },
  { email: "spike5@example.com", password: "password123" },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to login
function login(user: { email: string; password: string }) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(user),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  if (response.status === 200) {
    return response.json("access_token");
  }
  return null;
}

// Main test function
export default function () {
  const user = getRandomUser();

  if (!user) throw new Error("user is required");
  // 1. Test public endpoints (no authentication)
  const publicEndpoints = ["/api/questions", "/api/questions/1"];

  publicEndpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`);

    check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 3000ms`]: (r) => r.timings.duration < 3000,
    });

    if (response.status !== 200) {
      errorRate.add(1);
    }
  });

  // 2. Test authentication
  const token = login(user);

  if (token) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. Test protected endpoints
    const protectedEndpoints = [
      {
        url: "/api/questions/ask",
        method: "POST",
        body: JSON.stringify({
          title: `Spike Test Question ${Date.now()} ${Math.random()
            .toString(36)
            .substring(7)}`,
          content:
            "This is a spike test question with sufficient content length to meet validation requirements.",
        }),
      },
      { url: "/api/questions", method: "GET" },
      { url: "/api/auth/me", method: "GET" },
    ];

    protectedEndpoints.forEach((endpoint) => {
      let response;
      if (endpoint.method === "POST") {
        response = http.post(`${BASE_URL}${endpoint.url}`, endpoint.body, {
          headers,
        });
      } else {
        response = http.get(`${BASE_URL}${endpoint.url}`, { headers });
      }

      check(response, {
        [`${endpoint.method} ${endpoint.url} status is 200`]: (r) =>
          r.status === 200,
        [`${endpoint.method} ${endpoint.url} response time < 4000ms`]: (r) =>
          r.timings.duration < 4000,
      });

      if (response.status !== 200) {
        errorRate.add(1);
      }
    });

    // 4. Test question operations (if we have a question ID)
    const questionsResponse = http.get(`${BASE_URL}/api/questions`, {
      headers,
    });
    if (questionsResponse.status === 200) {
      const questions = questionsResponse.json("data");
      if (questions && questions.length > 0) {
        const questionId = questions[0]._id;

        // Test getting single question
        const singleQuestionRes = http.get(
          `${BASE_URL}/api/questions/${questionId}`,
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

        // Test like/unlike operations
        const likeRes = http.get(
          `${BASE_URL}/api/questions/${questionId}/like`,
          { headers }
        );

        check(likeRes, {
          "like operation status is 200 or 400": (r) =>
            r.status === 200 || r.status === 400,
          "like operation response time < 2000ms": (r) =>
            r.timings.duration < 2000,
        });

        if (likeRes.status !== 200 && likeRes.status !== 400) {
          errorRate.add(1);
        }
      }
    }
  } else {
    errorRate.add(1);
  }

  // Think time between requests (very short for spike test)
  sleep(0.2);
} 