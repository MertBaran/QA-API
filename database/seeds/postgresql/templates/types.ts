export interface TemplateDef {
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  category: 'system' | 'marketing' | 'security' | 'notification';
  subject: Record<string, string>;
  message: Record<string, string>;
  html?: Record<string, string>;
  variables: string[];
  isActive: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  description?: Record<string, string>;
  tags: string[];
}
