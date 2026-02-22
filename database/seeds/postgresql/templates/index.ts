import { TemplateDef } from './types';
import { welcomeEmail } from './welcomeEmail';
import { passwordReset } from './passwordReset';
import { passwordChangeCode } from './passwordChangeCode';
import { questionAnswered } from './questionAnswered';
import { accountVerified } from './accountVerified';
import { adminNotification } from './adminNotification';

export { TemplateDef } from './types';

export const ALL_TEMPLATES: TemplateDef[] = [
  welcomeEmail,
  passwordReset,
  passwordChangeCode,
  questionAnswered,
  accountVerified,
  adminNotification,
];
