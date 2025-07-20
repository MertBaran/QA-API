# QA System Performance Testing

Bu klasör QA API'si için kapsamlı performans test sistemi içermektedir.

## 🚀 Hızlı Başlangıç

### Önkoşullar

1. **K6 yüklü olmalı**: https://k6.io/docs/getting-started/installation/
2. **QA API çalışıyor olmalı**: `http://localhost:3000`

### 🛡️ GÜVENLİ Test Workflow

```bash
# 1. TEST ENVIRONMENT BAŞLAT (ÖNEMLİ!)
npm run perf:env
# Bu komut API'yi TEST database ile başlatır
# PRODUCTION database'i KESİNLİKLE etkilemez

# 2. Yeni Terminal'de testleri çalıştır:
npm run perf:setup     # Test kullanıcıları oluştur
npm run perf:quick     # Hızlı test (2 dk)
npm run perf:load      # Yük testi (18 dk)
npm run perf:spike     # Spike test (6 dk)
npm run perf:stress    # Stress test (42 dk)
npm run perf:all       # Tüm testler

# 3. Ctrl+C ile test environment'ı durdur
```

### ⚠️ GÜVENLİK UYARISI

**MUTLAKA** `npm run perf:env` ile başlatın!

- ✅ TEST database: `question-answer-test`
- ❌ Production database: `question-answer`

Bu olmadan testler production'ı etkileyebilir!

### Sonuçları Analiz Et

```bash
# Son test sonuçlarını analiz et
npm run analyze:latest

# Tüm sonuçları listele
npm run analyze:list

# Detaylı analiz seçenekleri
npm run analyze
```

## 📊 Test Türleri

### 1. Quick Test (`qa-system-quick-test.ts`)

- **Süre**: 2 dakika
- **Kullanıcı**: 5 kullanıcıya kadar
- **Amaç**: Temel fonksiyonellik ve hızlı performans kontrolü
- **Test Edilen Özellikler**:
  - Kimlik doğrulama
  - Soru oluşturma
  - Cevap ekleme
  - Public endpoint'ler

### 2. Load Test (`qa-system-load-test.ts`)

- **Süre**: 18 dakika
- **Kullanıcı**: 25 kullanıcıya kadar (aşamalı artış)
- **Amaç**: Gerçek kullanım senaryolarında performans testi
- **Test Edilen Özellikler**:
  - Çoklu soru oluşturma
  - Soru düzenleme
  - Kapsamlı CRUD işlemleri
  - Endpoint performans analizi

## 📈 Metrikler

### Performans Metrikleri

- **Response Time**: Ortalama, P50, P95, Min, Max
- **Success Rate**: Genel başarı oranı
- **Request Rate**: Saniye başına istek sayısı
- **Error Rate**: Hata oranı

### Fonksiyonel Metrikler

- **Authentication Success Rate**: Kimlik doğrulama başarı oranı
- **Question Creation Rate**: Soru oluşturma başarı oranı
- **Answer Creation Rate**: Cevap ekleme başarı oranı

### Endpoint Analizi

- Endpoint bazında performans
- Status code dağılımı
- En çok kullanılan endpoint'ler

## 🎯 Performans Hedefleri

### Quick Test Hedefleri

- P95 response time < 2000ms
- Success rate > 90%
- Auth success rate > 80%

### Load Test Hedefleri

- P95 response time < 3000ms
- Success rate > 85%
- Auth success rate > 75%

## 📁 Dosya Yapısı

```
performance/
├── tests/
│   ├── qa-system-quick-test.ts    # Hızlı test
│   ├── qa-system-load-test.ts     # Yük testi
│   ├── spike-test.ts              # Ani yük testi
│   ├── stress-test.ts             # Stres testi
│   └── i18n-cache-test.ts         # Cache testi
├── results/                       # Test sonuçları (JSON)
├── scripts/
│   └── maintenance/               # Bakım scriptleri
├── run-tests.ts                   # Test çalıştırıcı
├── analyze-results.ts             # Sonuç analizi
└── README.md                      # Bu dosya
```

## 🔧 Test Konfigürasyonu

### Kullanıcı Verisi

Testler önceden tanımlanmış test kullanıcıları kullanır:

- `test1@example.com` - `test5@example.com` (Quick Test)
- `load.test1@example.com` - `load.test8@example.com` (Load Test)

### Sample Data

Testler gerçekçi soru/cevap verisi kullanır:

- React, Node.js, MongoDB, API Security konularında sorular
- Teknik detaylar içeren kapsamlı cevaplar

## 📊 Sonuç Analizi

### Analiz Komutları

```bash
# Son 3 test sonucunu analiz et
npm run analyze:latest

# Son 5 test sonucunu analiz et
npm run analyze latest 5

# Tüm test dosyalarını listele
npm run analyze list
```

### Analiz Çıktısı Örnegi

```
📊 Test: qa-system-quick-test-1752456437996
📅 Date: 14.07.2025 04:27:18
🕒 Type: QUICK

🚀 Overall Performance:
   Total Requests: 1,234
   Failed Requests: 12 (0.97%)
   Success Rate: 99.03%

⏱️  Response Times:
   Average: 245.67ms
   P50 (Median): 198.45ms
   P95: 456.78ms
   Max: 1234.56ms
   Min: 23.45ms

🔐 Authentication:
   Success Rate: 95.45% (42/44)

❓ Question Creation:
   Success Rate: 91.67% (22/24)

🌐 Top Endpoints:
   GET /api/questions:
     Requests: 456
     Success Rate: 100.00%
     Avg Response: 145.23ms
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

1. **"K6 not found"**

   ```bash
   # macOS
   brew install k6

   # Linux
   sudo apt-get install k6

   # Windows
   choco install k6
   ```

2. **"API not running"**

   ```bash
   # QA API'yi başlat
   cd QA-API
   npm run dev
   ```

3. **"No results found"**

   ```bash
   # Önce bir test çalıştır
   npm run perf:quick

   # Sonra analiz et
   npm run analyze:latest
   ```

### Test Performansını İyileştirme

1. **Database Optimization**

   - Index'leri kontrol et
   - Query performance'ını optimize et

2. **API Response Time**

   - Caching implement et
   - Database connection pooling

3. **Error Rate Reduction**
   - Input validation iyileştir
   - Error handling güçlendir

## 📋 En İyi Practices

### Test Çalıştırma

1. Testleri production benzeri ortamda çalıştır
2. Testler arası temizlik yap
3. Consistent test data kullan
4. Monitoring ile birlikte test et

### Sonuç Değerlendirme

1. Trend analizi yap (zaman içinde performans)
2. Baseline oluştur ve karşılaştır
3. Bottleneck'leri identify et
4. Business impact'i değerlendir

### Sürekli İyileştirme

1. Regular performance testing
2. Performance budget belirleme
3. Automated regression testing
4. Performance monitoring integration

---

## 🤝 Katkıda Bulunma

Performance test'leri geliştirmek için:

1. Yeni test senaryoları ekle
2. Metrics'leri iyileştir
3. Analiz araçlarını geliştir
4. Documentation'ı güncelle
