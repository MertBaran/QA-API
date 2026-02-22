/**
 * Preload script: --db flag'ını parse edip DATABASE_TYPE env'ini ayarlar.
 * Container yüklenmeden ÖNCE çalıştırılmalı (ts-node -r ile).
 *
 * Kullanım: npm run reindex:all -- --db=postgresql
 *           npm run reindex:all -- --db=mongodb
 */
const dbArg = process.argv.find(a => a.startsWith('--db='));
if (dbArg) {
  const db = dbArg.split('=')[1]?.toLowerCase();
  if (db === 'postgresql' || db === 'mongodb') {
    process.env['DATABASE_TYPE'] = db;
    // eslint-disable-next-line no-console
    console.log(`📌 Reindex source database: ${db}`);
  }
}
