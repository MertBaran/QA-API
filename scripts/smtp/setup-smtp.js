#!/usr/bin/env node

/**
 * SMTP Konfigürasyon Setup Script'i
 *
 * Kullanım:
 * node scripts/smtp/setup-smtp.js [environment] [smtp-provider]
 *
 * Örnekler:
 * node scripts/smtp/setup-smtp.js dev gmail
 * node scripts/smtp/setup-smtp.js prod sendgrid
 * node scripts/smtp/setup-smtp.js test fake
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SMTP_PROVIDERS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    description: 'Gmail SMTP',
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    description: 'Outlook/Hotmail SMTP',
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    description: 'Yahoo SMTP',
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    description: 'SendGrid SMTP',
  },
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    description: 'Mailgun SMTP',
  },
  fake: {
    host: 'localhost',
    port: 1025,
    secure: false,
    description: 'Fake SMTP (Test için)',
  },
  custom: {
    host: '',
    port: 587,
    secure: false,
    description: 'Custom SMTP Server',
  },
};

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function updateConfigFile(environment, provider, config) {
  const configPath = path.join(
    __dirname,
    '../../config/env',
    `config.env.${environment}`
  );

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config dosyası bulunamadı: ${configPath}`);
    return false;
  }

  let content = fs.readFileSync(configPath, 'utf8');

  // SMTP konfigürasyonunu güncelle
  const smtpRegex = /#NodeMailer.*?(?=\n\n|\n#|\n$)/s;
  const smtpConfig = `#NodeMailer (${environment.toUpperCase()} - ${provider.toUpperCase()})
SMTP_HOST=${config.host}
SMTP_PORT=${config.port}
SMTP_USER=${config.user}
SMTP_APP_PASS=${config.pass}`;

  if (smtpRegex.test(content)) {
    content = content.replace(smtpRegex, smtpConfig);
  } else {
    // Eğer NodeMailer bölümü yoksa, Reset Password'dan sonra ekle
    const resetPasswordRegex = /#Reset Password\nRESET_PASSWORD_EXPIRE=\d+/;
    content = content.replace(resetPasswordRegex, `$&\n\n${smtpConfig}`);
  }

  fs.writeFileSync(configPath, content);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  let environment = args[0];
  let provider = args[1];

  console.log('🚀 SMTP Konfigürasyon Setup\n');

  // Environment seçimi
  if (!environment) {
    console.log("Mevcut environment'lar:");
    console.log('1. dev (Development)');
    console.log('2. test (Test)');
    console.log('3. prod (Production)');
    console.log('4. docker (Docker)');

    const envChoice = await question('Environment seçin (1-4): ');
    const envMap = { 1: 'dev', 2: 'test', 3: 'prod', 4: 'docker' };
    environment = envMap[envChoice] || 'dev';
  }

  // Provider seçimi
  if (!provider) {
    console.log("\nMevcut SMTP provider'ları:");
    Object.entries(SMTP_PROVIDERS).forEach(([key, value], index) => {
      console.log(`${index + 1}. ${key} - ${value.description}`);
    });

    const providerChoice = await question('SMTP provider seçin (1-6): ');
    const providerKeys = Object.keys(SMTP_PROVIDERS);
    provider = providerKeys[parseInt(providerChoice) - 1] || 'gmail';
  }

  const selectedProvider = SMTP_PROVIDERS[provider];
  if (!selectedProvider) {
    console.error('❌ Geçersiz provider!');
    rl.close();
    return;
  }

  console.log(`\n📧 ${selectedProvider.description} konfigürasyonu`);
  console.log(`Environment: ${environment}`);
  console.log(`Host: ${selectedProvider.host}`);
  console.log(`Port: ${selectedProvider.port}`);
  console.log(`Secure: ${selectedProvider.secure}\n`);

  // Kullanıcı bilgilerini al
  let user, pass;

  if (provider === 'custom') {
    user = await question('SMTP Username: ');
    pass = await question('SMTP Password: ');
  } else if (provider === 'sendgrid') {
    user = 'apikey';
    pass = await question('SendGrid API Key: ');
  } else if (provider === 'fake') {
    user = 'test@example.com';
    pass = 'test-password';
  } else {
    user = await question('Email Address: ');
    pass = await question('Password/App Password: ');
  }

  const config = {
    host: selectedProvider.host,
    port: selectedProvider.port,
    user,
    pass,
  };

  // Config dosyasını güncelle
  const success = updateConfigFile(environment, provider, config);

  if (success) {
    console.log(
      `✅ ${environment} environment için ${provider} SMTP konfigürasyonu güncellendi!`
    );
    console.log(`📁 Dosya: config/env/config.env.${environment}`);
  } else {
    console.log('❌ Konfigürasyon güncellenemedi!');
  }

  rl.close();
}

main().catch(console.error);
