# 🧪 Test Mocks & Fakes

**Isolated testing with fake providers for external dependencies**

## 📦 Available Mocks

| Provider                     | Purpose              | Features                    |
| ---------------------------- | -------------------- | --------------------------- |
| **FakeLoggerProvider**       | Logger isolation     | Silent log capture          |
| **FakeCacheProvider**        | In-memory cache      | Redis simulation            |
| **FakeAuditProvider**        | Audit tracking       | Memory-based logs           |
| **FakeEmailService**         | Email testing        | Email capture & validation  |
| **FakeNotificationProvider** | Notification testing | Message capture             |
| **FakeUserDataSource**       | User data            | Password hashing simulation |

## 🚀 Usage

### Test Setup

```typescript
// Automatic registration in tests/setup.ts
container.register("EmailService", { useClass: FakeEmailService });
container.register("CacheProvider", { useClass: FakeCacheProvider });
```

### Test Assertions

```typescript
// Check sent emails
const emailService = container.resolve<FakeEmailService>("EmailService");
expect(emailService.sent.length).toBeGreaterThan(0);

// Verify cache operations
const cache = container.resolve<FakeCacheProvider>("CacheProvider");
expect(cache.store.has("key")).toBe(true);
```

## ✨ Benefits

- **🔒 Isolation**: No external API calls during tests
- **⚡ Speed**: In-memory operations only
- **🎯 Reliability**: Deterministic test results
- **📊 Validation**: Assert on captured data

---

_All mocks implement the same interfaces as real providers for seamless testing_
