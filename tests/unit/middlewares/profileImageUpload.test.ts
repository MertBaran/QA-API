import CustomError from '../../../infrastructure/error/CustomError';
import profileImageUpload from '../../../middlewares/libraries/profileImageUpload';

describe('profileImageUpload middleware', () => {
  const fileFilter = (profileImageUpload as any).fileFilter;

  it('should accept jpeg, jpg, png mimetypes', () => {
    const req: any = {};
    const cb = jest.fn();
    fileFilter(req, { mimetype: 'image/jpeg' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    fileFilter(req, { mimetype: 'image/png' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    fileFilter(req, { mimetype: 'image/jpg' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should reject other mimetypes', () => {
    const req: any = {};
    const cb = jest.fn();
    fileFilter(req, { mimetype: 'application/pdf' }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    expect((cb.mock.calls[0][0] as CustomError).message).toMatch(
      /only jpeg, jpg and png/i
    );
  });
});
