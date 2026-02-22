import { TemplateDef } from './types';

export const questionAnswered: TemplateDef = {
  name: 'question-answered',
  type: 'email',
  category: 'notification',
  subject: {
    en: 'Your Question Has Been Answered',
    tr: 'Sorunuz Yanıtlandı',
    de: 'Ihre Frage wurde beantwortet',
  },
  message: {
    en: 'Hello {{userName}}, your question "{{questionTitle}}" has been answered. Click to view the answer: {{answerLink}}',
    tr: 'Merhaba {{userName}}, "{{questionTitle}}" başlıklı sorunuz yanıtlandı. Yanıtı görmek için tıklayın: {{answerLink}}',
    de: 'Hallo {{userName}}, Ihre Frage "{{questionTitle}}" wurde beantwortet. Klicken Sie, um die Antwort zu sehen: {{answerLink}}',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Your Question Has Been Answered!</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>Your question "<strong>{{questionTitle}}</strong>" has been answered.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Question:</strong> {{questionTitle}}</p>
            <p><strong>Answered by:</strong> {{answerAuthor}}</p>
            <p><strong>Answer Date:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Answer</a>
          </div>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Sorunuz Yanıtlandı!</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>"<strong>{{questionTitle}}</strong>" başlıklı sorunuz yanıtlandı.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Soru:</strong> {{questionTitle}}</p>
            <p><strong>Yanıtlayan:</strong> {{answerAuthor}}</p>
            <p><strong>Yanıt Tarihi:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Yanıtı Görüntüle</a>
          </div>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Ihre Frage wurde beantwortet!</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Ihre Frage "<strong>{{questionTitle}}</strong>" wurde beantwortet.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Frage:</strong> {{questionTitle}}</p>
            <p><strong>Beantwortet von:</strong> {{answerAuthor}}</p>
            <p><strong>Antwortdatum:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Antwort anzeigen</a>
          </div>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['userName', 'questionTitle', 'answerAuthor', 'answerDate', 'answerLink'],
  isActive: true,
  priority: 'normal',
  description: {
    en: "Notification email sent when a user's question is answered",
    tr: 'Kullanıcının sorusu yanıtlandığında gönderilen bildirim e-postası',
    de: 'Benachrichtigungs-E-Mail, die gesendet wird, wenn die Frage eines Benutzers beantwortet wird',
  },
  tags: ['question', 'answer', 'notification', 'email'],
};
