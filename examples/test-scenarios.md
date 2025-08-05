# Error Handling Test Senaryoları

## Senaryo 1: Kullanıcı Hatası (Pino'ya gidecek)

### Test: Yanlış Şifre ile Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "yanlis-sifre"
  }'
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 401
- ✅ **Pino Log:** "User error occurred" - Kullanıcı hatası
- ❌ **Sentry:** Gönderilmez (kullanıcı hatası)

### Test: Olmayan Kullanıcı ile Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "olmayan@example.com",
    "password": "password123"
  }'
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 404
- ✅ **Pino Log:** "User error occurred" - Kullanıcı hatası
- ❌ **Sentry:** Gönderilmez (kullanıcı hatası)

## Senaryo 2: Sistem Hatası (Sentry'ye gidecek)

### Test: Database Bağlantı Hatası

```bash
# MongoDB'yi durdur
sudo systemctl stop mongod

# Sonra login isteği gönder
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 500
- ✅ **Sentry:** "Database connection failed" - Sistem hatası
- ✅ **Pino Log:** "User login failed - system error"

### Test: JWT Oluşturma Hatası

```bash
# JWT_SECRET_KEY'i geçersiz yap
export JWT_SECRET_KEY=""

# Login isteği gönder
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 500
- ✅ **Sentry:** "JWT creation failed" - Sistem hatası

## Senaryo 3: Validation Hatası (Pino'ya gidecek)

### Test: Geçersiz Email Formatı

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gecersiz-email",
    "password": "password123"
  }'
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 422
- ✅ **Pino Log:** "User error occurred" - Validation hatası
- ❌ **Sentry:** Gönderilmez (validation hatası)

## Senaryo 4: Authorization Hatası (Pino'ya gidecek)

### Test: Yetkisiz Erişim

```bash
# Token olmadan protected route'a erişim
curl -X GET http://localhost:3000/api/auth/profile
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 401
- ✅ **Pino Log:** "User error occurred" - Authorization hatası
- ❌ **Sentry:** Gönderilmez (authorization hatası)

## Senaryo 5: Kritik Business Hatası (Sentry'ye gidecek)

### Test: Rate Limiting Aşımı

```bash
# Çok fazla istek gönder (rate limit aşımı için)
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }'
done
```

**Beklenen Sonuç:**

- ✅ **Status Code:** 429
- ✅ **Sentry:** "Rate limit exceeded" - Kritik business hatası

## Log Kontrolü

### Pino Loglarını Kontrol Et:

```bash
# Development'ta console'da görünür
# Production'ta log dosyalarını kontrol et
tail -f logs/app.log
```

### Sentry Dashboard'ını Kontrol Et:

- Sentry projesine git
- Issues bölümünde yeni hataları kontrol et
- Sadece sistem hataları görünmeli
- Kullanıcı hataları görünmemeli
