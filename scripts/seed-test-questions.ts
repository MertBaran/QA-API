// import mongoose from 'mongoose';
// import QuestionMongo from '../models/mongodb/QuestionMongoModel';
// import UserMongo from '../models/mongodb/UserMongoModel';
// import AnswerMongo from '../models/mongodb/AnswerMongoModel';

// // Test questions data
// const testQuestions = [
//   {
//     title: 'React Hooks kullanımı hakkında yardım',
//     content:
//       "useState ve useEffect hook'larını ne zaman kullanmalıyım? Aralarındaki farklar nelerdir?",
//     tags: ['react', 'hooks', 'javascript'],
//   },
//   {
//     title: 'TypeScript interface vs type farkı',
//     content:
//       "TypeScript'te interface ve type arasındaki farklar nelerdir? Hangi durumlarda hangisini kullanmalıyım?",
//     tags: ['typescript', 'interface', 'type'],
//   },
//   {
//     title: 'Node.js async/await kullanımı',
//     content:
//       "Node.js'te async/await kullanırken hata yönetimi nasıl yapılır? Try-catch bloklarını nasıl kullanmalıyım?",
//     tags: ['nodejs', 'async', 'await', 'javascript'],
//   },
//   {
//     title: 'MongoDB aggregation pipeline',
//     content:
//       "MongoDB'de aggregation pipeline kullanarak veri analizi nasıl yapılır? Örneklerle açıklayabilir misiniz?",
//     tags: ['mongodb', 'aggregation', 'database'],
//   },
//   {
//     title: 'Docker container yönetimi',
//     content:
//       "Docker container'ları nasıl yönetirim? Image ve container arasındaki farklar nelerdir?",
//     tags: ['docker', 'container', 'devops'],
//   },
//   {
//     title: 'Git branch stratejileri',
//     content:
//       'Git flow ve GitHub flow arasındaki farklar nelerdir? Hangi projelerde hangisini kullanmalıyım?',
//     tags: ['git', 'branch', 'workflow'],
//   },
//   {
//     title: 'REST API tasarım prensipleri',
//     content:
//       'REST API tasarlarken hangi prensiplere dikkat etmeliyim? HTTP status kodları nasıl kullanılır?',
//     tags: ['api', 'rest', 'http'],
//   },
//   {
//     title: 'JavaScript closure kavramı',
//     content:
//       "JavaScript'te closure nedir? Ne zaman ve nasıl kullanılır? Pratik örneklerle açıklayabilir misiniz?",
//     tags: ['javascript', 'closure', 'scope'],
//   },
//   {
//     title: 'CSS Grid vs Flexbox',
//     content:
//       'CSS Grid ve Flexbox arasındaki farklar nelerdir? Hangi durumlarda hangisini kullanmalıyım?',
//     tags: ['css', 'grid', 'flexbox'],
//   },
//   {
//     title: 'JWT token güvenliği',
//     content:
//       "JWT token'ları nasıl güvenli bir şekilde kullanılır? Refresh token stratejileri nelerdir?",
//     tags: ['jwt', 'security', 'authentication'],
//   },
//   {
//     title: 'React performance optimization',
//     content:
//       'React uygulamalarında performance optimizasyonu nasıl yapılır? useMemo ve useCallback ne zaman kullanılır?',
//     tags: ['react', 'performance', 'optimization'],
//   },
//   {
//     title: 'SQL injection koruması',
//     content:
//       "SQL injection saldırılarından nasıl korunulur? Prepared statement'lar nasıl kullanılır?",
//     tags: ['sql', 'security', 'injection'],
//   },
//   {
//     title: 'Microservices mimarisi',
//     content:
//       'Microservices mimarisinin avantajları ve dezavantajları nelerdir? Ne zaman kullanılmalıdır?',
//     tags: ['microservices', 'architecture', 'distributed-systems'],
//   },
//   {
//     title: 'Redis cache stratejileri',
//     content:
//       'Redis cache kullanırken hangi stratejileri uygulamalıyım? Cache invalidation nasıl yapılır?',
//     tags: ['redis', 'cache', 'performance'],
//   },
//   {
//     title: 'Linux komut satırı',
//     content:
//       "Linux'te temel komutlar nelerdir? Dosya yönetimi ve process yönetimi nasıl yapılır?",
//     tags: ['linux', 'command-line', 'terminal'],
//   },
//   {
//     title: 'AWS Lambda fonksiyonları',
//     content:
//       "AWS Lambda'da serverless fonksiyonlar nasıl yazılır? Cold start problemi nasıl çözülür?",
//     tags: ['aws', 'lambda', 'serverless'],
//   },
//   {
//     title: 'GraphQL vs REST',
//     content:
//       'GraphQL ve REST API arasındaki farklar nelerdir? Hangi durumlarda hangisini tercih etmeliyim?',
//     tags: ['graphql', 'rest', 'api'],
//   },
//   {
//     title: 'Docker Compose kullanımı',
//     content:
//       'Docker Compose ile multi-container uygulamalar nasıl yönetilir? docker-compose.yml dosyası nasıl yazılır?',
//     tags: ['docker', 'compose', 'containerization'],
//   },
//   {
//     title: 'JavaScript Promise kullanımı',
//     content:
//       "JavaScript Promise'ler nasıl kullanılır? Promise.all ve Promise.race arasındaki farklar nelerdir?",
//     tags: ['javascript', 'promise', 'async'],
//   },
//   {
//     title: 'CSS preprocessor kullanımı',
//     content:
//       "Sass ve Less arasındaki farklar nelerdir? CSS preprocessor'lar ne zaman kullanılmalıdır?",
//     tags: ['css', 'sass', 'less', 'preprocessor'],
//   },
//   {
//     title: 'MongoDB indexing stratejileri',
//     content:
//       "MongoDB'de index'ler nasıl oluşturulur? Hangi alanlara index eklenmelidir?",
//     tags: ['mongodb', 'indexing', 'performance'],
//   },
//   {
//     title: 'React testing kütüphaneleri',
//     content:
//       'Jest ve React Testing Library nasıl kullanılır? Unit test ve integration test arasındaki farklar nelerdir?',
//     tags: ['react', 'testing', 'jest'],
//   },
//   {
//     title: 'Nginx reverse proxy',
//     content:
//       'Nginx reverse proxy nasıl yapılandırılır? Load balancing nasıl yapılır?',
//     tags: ['nginx', 'reverse-proxy', 'load-balancing'],
//   },
//   {
//     title: 'JavaScript ES6+ özellikleri',
//     content:
//       'ES6+ ile gelen yeni özellikler nelerdir? Destructuring ve spread operator nasıl kullanılır?',
//     tags: ['javascript', 'es6', 'es2015'],
//   },
//   {
//     title: 'Git merge conflict çözümü',
//     content:
//       "Git merge conflict'leri nasıl çözülür? Rebase ve merge arasındaki farklar nelerdir?",
//     tags: ['git', 'merge', 'conflict'],
//   },
//   {
//     title: 'REST API authentication',
//     content:
//       "REST API'lerde authentication nasıl yapılır? OAuth 2.0 ve JWT nasıl kullanılır?",
//     tags: ['api', 'authentication', 'oauth'],
//   },
//   {
//     title: 'React state management',
//     content:
//       'Redux ve Context API arasındaki farklar nelerdir? Hangi durumlarda hangisini kullanmalıyım?',
//     tags: ['react', 'redux', 'context-api'],
//   },
//   {
//     title: 'Docker image optimization',
//     content:
//       "Docker image'ları nasıl optimize edilir? Multi-stage build nasıl kullanılır?",
//     tags: ['docker', 'optimization', 'image'],
//   },
//   {
//     title: 'JavaScript event loop',
//     content:
//       'JavaScript event loop nasıl çalışır? Callback, Promise ve async/await arasındaki farklar nelerdir?',
//     tags: ['javascript', 'event-loop', 'async'],
//   },
//   {
//     title: 'CSS responsive design',
//     content:
//       "Responsive web tasarımı nasıl yapılır? Media query'ler nasıl kullanılır?",
//     tags: ['css', 'responsive', 'design'],
//   },
//   {
//     title: 'MongoDB backup stratejileri',
//     content:
//       'MongoDB veritabanı nasıl yedeklenir? Backup ve restore işlemleri nasıl yapılır?',
//     tags: ['mongodb', 'backup', 'restore'],
//   },
//   {
//     title: 'React component lifecycle',
//     content:
//       'React component lifecycle metodları nelerdir? useEffect ile nasıl yönetilir?',
//     tags: ['react', 'lifecycle', 'useEffect'],
//   },
//   {
//     title: 'Linux process yönetimi',
//     content:
//       "Linux'te process'ler nasıl yönetilir? ps, top ve htop komutları nasıl kullanılır?",
//     tags: ['linux', 'process', 'system'],
//   },
//   {
//     title: 'AWS S3 bucket yönetimi',
//     content:
//       "AWS S3 bucket'ları nasıl yönetilir? CORS yapılandırması nasıl yapılır?",
//     tags: ['aws', 's3', 'storage'],
//   },
//   {
//     title: 'JavaScript module system',
//     content:
//       'ES6 modules ve CommonJS arasındaki farklar nelerdir? Import/export nasıl kullanılır?',
//     tags: ['javascript', 'modules', 'es6'],
//   },
//   {
//     title: 'CSS animation ve transition',
//     content:
//       "CSS animation ve transition arasındaki farklar nelerdir? Keyframe'ler nasıl kullanılır?",
//     tags: ['css', 'animation', 'transition'],
//   },
//   {
//     title: 'MongoDB sharding',
//     content:
//       'MongoDB sharding nasıl yapılandırılır? Horizontal scaling nasıl sağlanır?',
//     tags: ['mongodb', 'sharding', 'scaling'],
//   },
//   {
//     title: 'React error boundary',
//     content: 'React Error Boundary nedir? Hata yönetimi nasıl yapılır?',
//     tags: ['react', 'error-boundary', 'error-handling'],
//   },
//   {
//     title: 'Docker networking',
//     content:
//       "Docker container'ları arasında network nasıl kurulur? Bridge ve host network arasındaki farklar nelerdir?",
//     tags: ['docker', 'networking', 'container'],
//   },
//   {
//     title: 'JavaScript debugging teknikleri',
//     content:
//       'JavaScript kodunda debugging nasıl yapılır? Console metodları ve debugger nasıl kullanılır?',
//     tags: ['javascript', 'debugging', 'console'],
//   },
//   {
//     title: "CSS preprocessor mixin'leri",
//     content:
//       "Sass mixin'leri nasıl yazılır ve kullanılır? Parametreli mixin'ler nasıl oluşturulur?",
//     tags: ['css', 'sass', 'mixin'],
//   },
//   {
//     title: 'MongoDB aggregation operators',
//     content:
//       "MongoDB aggregation pipeline'da hangi operator'lar kullanılır? $match, $group ve $project nasıl kullanılır?",
//     tags: ['mongodb', 'aggregation', 'operators'],
//   },
//   {
//     title: 'React custom hooks',
//     content:
//       "React custom hook'lar nasıl yazılır? Hangi durumlarda kullanılmalıdır?",
//     tags: ['react', 'custom-hooks', 'hooks'],
//   },
//   {
//     title: 'Linux log yönetimi',
//     content:
//       "Linux sistem log'ları nasıl yönetilir? journalctl ve logrotate nasıl kullanılır?",
//     tags: ['linux', 'logs', 'system'],
//   },
//   {
//     title: 'AWS Lambda environment variables',
//     content:
//       "AWS Lambda fonksiyonlarında environment variable'lar nasıl kullanılır? Güvenli bir şekilde nasıl yönetilir?",
//     tags: ['aws', 'lambda', 'environment'],
//   },
//   {
//     title: 'JavaScript array metodları',
//     content:
//       'JavaScript array metodları nelerdir? map, filter, reduce nasıl kullanılır?',
//     tags: ['javascript', 'array', 'methods'],
//   },
//   {
//     title: 'CSS Grid layout',
//     content:
//       'CSS Grid layout nasıl kullanılır? Grid template areas nasıl tanımlanır?',
//     tags: ['css', 'grid', 'layout'],
//   },
//   {
//     title: 'MongoDB replication',
//     content:
//       "MongoDB replication nasıl yapılandırılır? Primary ve secondary node'lar nasıl çalışır?",
//     tags: ['mongodb', 'replication', 'high-availability'],
//   },
//   {
//     title: 'React context API',
//     content:
//       'React Context API nasıl kullanılır? Provider ve Consumer pattern nasıl uygulanır?',
//     tags: ['react', 'context', 'provider'],
//   },
//   {
//     title: 'Docker volume yönetimi',
//     content:
//       "Docker volume'ları nasıl yönetilir? Named volume ve bind mount arasındaki farklar nelerdir?",
//     tags: ['docker', 'volume', 'storage'],
//   },
//   {
//     title: 'JavaScript async programming',
//     content:
//       "JavaScript'te async programming nasıl yapılır? Callback hell nasıl önlenir?",
//     tags: ['javascript', 'async', 'callback'],
//   },
//   {
//     title: 'CSS Flexbox layout',
//     content:
//       'CSS Flexbox layout nasıl kullanılır? Flex direction ve justify content nasıl ayarlanır?',
//     tags: ['css', 'flexbox', 'layout'],
//   },
//   {
//     title: 'MongoDB data modeling',
//     content:
//       "MongoDB'de veri modelleme nasıl yapılır? Embedding vs referencing ne zaman kullanılır?",
//     tags: ['mongodb', 'data-modeling', 'schema'],
//   },
//   {
//     title: 'React performance monitoring',
//     content:
//       'React uygulamalarında performance nasıl izlenir? React DevTools nasıl kullanılır?',
//     tags: ['react', 'performance', 'monitoring'],
//   },
//   {
//     title: 'Linux user yönetimi',
//     content:
//       "Linux'te user ve group yönetimi nasıl yapılır? sudo ve su komutları nasıl kullanılır?",
//     tags: ['linux', 'user-management', 'permissions'],
//   },
//   {
//     title: 'AWS CloudFormation',
//     content:
//       'AWS CloudFormation ile infrastructure as code nasıl yazılır? Template yapısı nasıl oluşturulur?',
//     tags: ['aws', 'cloudformation', 'iac'],
//   },
//   {
//     title: 'JavaScript object destructuring',
//     content:
//       "JavaScript object destructuring nasıl kullanılır? Default value'lar nasıl atanır?",
//     tags: ['javascript', 'destructuring', 'es6'],
//   },
//   {
//     title: 'CSS media queries',
//     content:
//       "CSS media query'ler nasıl yazılır? Responsive breakpoint'ler nasıl belirlenir?",
//     tags: ['css', 'media-queries', 'responsive'],
//   },
//   {
//     title: 'MongoDB connection pooling',
//     content:
//       "MongoDB connection pooling nasıl yapılandırılır? Connection limit'leri nasıl ayarlanır?",
//     tags: ['mongodb', 'connection-pooling', 'performance'],
//   },
//   {
//     title: 'React router kullanımı',
//     content:
//       'React Router nasıl kullanılır? Dynamic routing ve nested routes nasıl yapılır?',
//     tags: ['react', 'router', 'routing'],
//   },
//   {
//     title: 'Docker security best practices',
//     content:
//       "Docker container'larında güvenlik nasıl sağlanır? Non-root user nasıl kullanılır?",
//     tags: ['docker', 'security', 'best-practices'],
//   },
//   {
//     title: 'JavaScript error handling',
//     content:
//       "JavaScript'te hata yönetimi nasıl yapılır? Try-catch blokları nasıl kullanılır?",
//     tags: ['javascript', 'error-handling', 'try-catch'],
//   },
//   {
//     title: 'CSS custom properties',
//     content:
//       'CSS custom properties (CSS variables) nasıl kullanılır? Theme switching nasıl yapılır?',
//     tags: ['css', 'custom-properties', 'variables'],
//   },
//   {
//     title: 'MongoDB change streams',
//     content:
//       'MongoDB change streams nasıl kullanılır? Real-time data monitoring nasıl yapılır?',
//     tags: ['mongodb', 'change-streams', 'real-time'],
//   },
//   {
//     title: 'React memo optimization',
//     content:
//       'React.memo nasıl kullanılır? Component re-render optimizasyonu nasıl yapılır?',
//     tags: ['react', 'memo', 'optimization'],
//   },
// ];

// async function seedTestData() {
//   try {
//     // MongoDB bağlantısı
//     const mongoUri =
//       process.env['MONGO_URI'] || 'mongodb://localhost:27017/qa-platform';
//     await mongoose.connect(mongoUri);
//     console.log('✅ MongoDB bağlantısı başarılı');

//     // Mevcut kullanıcıları kontrol et
//     const existingUsers = await UserMongo.find({});
//     console.log(`📊 Mevcut kullanıcı sayısı: ${existingUsers.length}`);

//     if (existingUsers.length === 0) {
//       console.log(
//         '❌ Hiç kullanıcı bulunamadı! Önce test kullanıcıları oluşturun.'
//       );
//       console.log('💡 Önerilen komut: npm run perf:setup');
//       return;
//     }

//     // Mevcut verileri temizle
//     await QuestionMongo.deleteMany({});
//     await AnswerMongo.deleteMany({});
//     console.log('🧹 Mevcut test soruları ve cevapları temizlendi');

//     // Test sorularını oluştur
//     const questions = [];
//     for (let i = 0; i < testQuestions.length; i++) {
//       const questionData = testQuestions[i];
//       const randomUser =
//         existingUsers[Math.floor(Math.random() * existingUsers.length)];

//       if (questionData && randomUser) {
//         const question = new QuestionMongo({
//           title: questionData.title,
//           content: questionData.content,
//           user: randomUser._id,
//           likes: [],
//           answers: [],
//           createdAt: new Date(
//             Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
//           ), // Son 30 gün içinde
//         });

//         questions.push(question);
//       }
//     }

//     const savedQuestions = await QuestionMongo.insertMany(questions);
//     console.log(`✅ ${savedQuestions.length} test sorusu oluşturuldu`);

//     // Bazı sorulara cevaplar ekle
//     const answers = [];
//     for (let i = 0; i < 20; i++) {
//       const randomQuestion =
//         savedQuestions[Math.floor(Math.random() * savedQuestions.length)];
//       const randomUser =
//         existingUsers[Math.floor(Math.random() * existingUsers.length)];

//       if (randomQuestion && randomUser) {
//         const answer = new AnswerMongo({
//           content: `Bu soruya verilen ${i + 1}. test cevabı. Detaylı açıklama ve örnekler içeriyor.`,
//           user: randomUser._id,
//           question: randomQuestion._id,
//           likes: [],
//           createdAt: new Date(
//             Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
//           ), // Son 7 gün içinde
//         });

//         answers.push(answer);
//       }
//     }

//     const savedAnswers = await AnswerMongo.insertMany(answers);
//     console.log(`✅ ${savedAnswers.length} test cevabı oluşturuldu`);

//     // Sorulara cevapları ekle
//     for (const answer of savedAnswers) {
//       await QuestionMongo.findByIdAndUpdate(answer.question, {
//         $push: { answers: answer._id },
//       });
//     }

//     console.log('🎉 Test verileri başarıyla oluşturuldu!');
//     console.log(`📊 Özet:`);
//     console.log(`   - ${existingUsers.length} mevcut kullanıcı`);
//     console.log(`   - ${savedQuestions.length} soru`);
//     console.log(`   - ${savedAnswers.length} cevap`);
//   } catch (error) {
//     console.error('❌ Test verileri oluşturulurken hata:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('🔌 MongoDB bağlantısı kapatıldı');
//   }
// }

// // Script'i çalıştır
// if (require.main === module) {
//   seedTestData();
// }

// export { seedTestData };
