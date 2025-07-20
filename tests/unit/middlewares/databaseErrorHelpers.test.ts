import * as dbHelpers from '../../../middlewares/database/databaseErrorHelpers';

describe('databaseErrorHelpers', () => {
  describe('isValidationError', () => {
    it('should return true for error with name ValidationError', () => {
      expect(dbHelpers.isValidationError({ name: 'ValidationError' })).toBe(
        true
      );
    });
    it('should return false for error with other name', () => {
      expect(dbHelpers.isValidationError({ name: 'OtherError' })).toBe(false);
    });
  });

  describe('isDuplicateKeyError', () => {
    it('should return true for error with code 11000', () => {
      expect(dbHelpers.isDuplicateKeyError({ code: 11000 })).toBe(true);
    });
    it('should return false for error with other code', () => {
      expect(dbHelpers.isDuplicateKeyError({ code: 12345 })).toBe(false);
    });
  });

  describe('getDuplicateKey', () => {
    it('should extract duplicate key from error message', () => {
      const err = {
        message:
          'E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@example.com" }',
      };
      expect(dbHelpers.getDuplicateKey(err)).toBe('email');
    });
    it('should return null if no key found', () => {
      expect(dbHelpers.getDuplicateKey({ message: 'no duplicate' })).toBeNull();
    });
  });
});
