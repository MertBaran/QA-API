import {
  isTokenIncluded,
  getAccessTokenFromHeader,
} from '../../../helpers/authorization/tokenHelpers';

describe('tokenHelpers Unit Tests', () => {
  describe('isTokenIncluded', () => {
    it('should return true if Bearer token is present', () => {
      const req = { headers: { authorization: 'Bearer sometoken' } };
      expect(isTokenIncluded(req as any)).toBe(true);
    });
    it('should return false if authorization header is missing', () => {
      const req = { headers: {} };
      expect(isTokenIncluded(req as any)).toBe(false);
    });
    it('should return false if authorization does not start with Bearer', () => {
      const req = { headers: { authorization: 'Basic sometoken' } };
      expect(isTokenIncluded(req as any)).toBe(false);
    });
  });

  describe('getAccessTokenFromHeader', () => {
    it('should return token if Bearer token is present', () => {
      const req = { headers: { authorization: 'Bearer mytoken123' } };
      expect(getAccessTokenFromHeader(req as any)).toBe('mytoken123');
    });
    it('should return undefined if authorization header is missing', () => {
      const req = { headers: {} };
      expect(getAccessTokenFromHeader(req as any)).toBeUndefined();
    });
    it('should return undefined if Bearer token is not present', () => {
      const req = { headers: { authorization: 'Basic mytoken123' } };
      expect(getAccessTokenFromHeader(req as any)).toBeUndefined();
    });
  });
});
