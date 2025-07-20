import {
  validateUserInput,
  comparePassword,
} from '../../../helpers/input/inputHelpers';
import bcrypt from 'bcryptjs';

describe('inputHelpers Unit Tests', () => {
  describe('validateUserInput', () => {
    it('should return true for valid email and password', () => {
      expect(validateUserInput('test@example.com', 'password')).toBe(true);
    });
    it('should return false for missing email', () => {
      expect(validateUserInput('', 'password')).toBe(false);
    });
    it('should return false for missing password', () => {
      expect(validateUserInput('test@example.com', '')).toBe(false);
    });
    it('should return false for both missing', () => {
      expect(validateUserInput('', '')).toBe(false);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const hash = await bcrypt.hash('mypassword', 10);
      const result = await comparePassword('mypassword', hash);
      expect(result).toBe(true);
    });
    it('should return false for non-matching password and hash', async () => {
      const hash = await bcrypt.hash('mypassword', 10);
      const result = await comparePassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });
});
