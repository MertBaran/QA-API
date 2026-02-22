import { TemplateDef } from './types';

export const adminNotification: TemplateDef = {
  name: 'admin-notification',
  type: 'email',
  category: 'system',
  subject: {
    en: 'System Notification: {{title}}',
    tr: 'Sistem Bildirimi: {{title}}',
    de: 'Systembenachrichtigung: {{title}}',
  },
  message: {
    en: 'Hello {{adminName}}, a new event has occurred in the system: {{description}}',
    tr: 'Merhaba {{adminName}}, sistemde yeni bir olay gerçekleşti: {{description}}',
    de: 'Hallo {{adminName}}, ein neues Ereignis ist im System aufgetreten: {{description}}',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">System Notification</h2>
          <p>Hello <strong>{{adminName}}</strong>,</p>
          <p>A new event has occurred in the system:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Event Date:</strong> {{eventDate}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Panel</a>
          </div>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">Sistem Bildirimi</h2>
          <p>Merhaba <strong>{{adminName}}</strong>,</p>
          <p>Sistemde yeni bir olay gerçekleşti:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Olay Tarihi:</strong> {{eventDate}}</p>
            <p><strong>Öncelik:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Paneli</a>
          </div>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">Systembenachrichtigung</h2>
          <p>Hallo <strong>{{adminName}}</strong>,</p>
          <p>Ein neues Ereignis ist im System aufgetreten:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Ereignisdatum:</strong> {{eventDate}}</p>
            <p><strong>Priorität:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin-Panel</a>
          </div>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['adminName', 'title', 'description', 'eventDate', 'priority', 'adminPanelLink'],
  isActive: true,
  priority: 'high',
  description: {
    en: 'System notifications sent to admins',
    tr: "Admin'lere gönderilen sistem bildirimleri",
    de: 'Systembenachrichtigungen, die an Administratoren gesendet werden',
  },
  tags: ['admin', 'system', 'notification', 'email'],
};
