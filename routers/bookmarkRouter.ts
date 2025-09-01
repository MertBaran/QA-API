import { Router } from 'express';
import { container } from 'tsyringe';
import { BookmarkController } from '../controllers/bookmarkController';
import { getAccessToRoute as authMiddleware } from '../middlewares/authorization/authMiddleware';
import { IValidationProvider } from '../infrastructure/validation/IValidationProvider';
import { AuditMiddleware } from '../middlewares/audit/auditMiddleware';
import {
  AddBookmarkSchema,
  UpdateBookmarkSchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
} from '../types/dto/bookmark/bookmark.dto';

const router = Router();

// Resolve validator via DI for consistency
const validator = container.resolve<IValidationProvider>('IValidationProvider');

// Resolve controller
const bookmarkController = container.resolve(BookmarkController);

// Audit middleware
const auditMiddleware = new AuditMiddleware(
  container.resolve('IAuditProvider')
);

// Apply auth middleware to all routes
router.use(authMiddleware);

// Bookmark CRUD routes
router.post(
  '/add',
  validator.validateBody(AddBookmarkSchema),
  auditMiddleware.createMiddleware('BOOKMARK_CREATE', {
    targetExtractor: req => ({
      targetType: (req.body as any)?.targetType,
      targetId: (req.body as any)?.targetId,
    }),
  }),
  bookmarkController.addBookmark
);
router.delete(
  '/remove/:id',
  auditMiddleware.createMiddleware('BOOKMARK_DELETE', {
    targetExtractor: req => ({ bookmarkId: req.params['id'] }),
  }),
  bookmarkController.removeBookmark
);
router.put(
  '/:id',
  validator.validateBody(UpdateBookmarkSchema),
  auditMiddleware.createMiddleware('BOOKMARK_UPDATE', {
    targetExtractor: req => ({ bookmarkId: req.params['id'] }),
  }),
  bookmarkController.updateBookmark
);
router.get('/user', bookmarkController.getUserBookmarks);
router.get(
  '/check/:targetType/:targetId',
  bookmarkController.checkBookmarkExists
);

// Search and filter routes
router.get('/search', bookmarkController.searchBookmarks);
router.get('/paginated', bookmarkController.getPaginatedBookmarks);

// Collection routes
router.post(
  '/collections',
  validator.validateBody(CreateCollectionSchema),
  auditMiddleware.createMiddleware('BOOKMARK_COLLECTION_CREATE', {
    targetExtractor: req => ({ name: (req.body as any)?.name }),
  }),
  bookmarkController.createCollection
);
router.get('/collections', bookmarkController.getUserCollections);
router.put(
  '/collections/:id',
  validator.validateBody(UpdateCollectionSchema),
  auditMiddleware.createMiddleware('BOOKMARK_COLLECTION_UPDATE', {
    targetExtractor: req => ({ collectionId: req.params['id'] }),
  }),
  bookmarkController.updateCollection
);
router.delete(
  '/collections/:id',
  auditMiddleware.createMiddleware('BOOKMARK_COLLECTION_DELETE', {
    targetExtractor: req => ({ collectionId: req.params['id'] }),
  }),
  bookmarkController.deleteCollection
);

// Collection items routes
router.post(
  '/collections/:collectionId/items/:bookmarkId',
  auditMiddleware.createMiddleware('BOOKMARK_ADD_TO_COLLECTION', {
    targetExtractor: req => ({
      collectionId: req.params['collectionId'],
      bookmarkId: req.params['bookmarkId'],
    }),
  }),
  bookmarkController.addToCollection
);
router.delete(
  '/collections/:collectionId/items/:bookmarkId',
  auditMiddleware.createMiddleware('BOOKMARK_REMOVE_FROM_COLLECTION', {
    targetExtractor: req => ({
      collectionId: req.params['collectionId'],
      bookmarkId: req.params['bookmarkId'],
    }),
  }),
  bookmarkController.removeFromCollection
);
router.get('/collections/:id/items', bookmarkController.getCollectionItems);

// Analytics routes
router.get('/stats', bookmarkController.getBookmarkStats);

export default router;
