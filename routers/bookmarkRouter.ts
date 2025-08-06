import { Router } from 'express';
import { container } from 'tsyringe';
import { BookmarkController } from '../controllers/bookmarkController';
import { getAccessToRoute as authMiddleware } from '../middlewares/authorization/authMiddleware';
import { ZodValidationProvider } from '../infrastructure/validation/ZodValidationProvider';
import {
  AddBookmarkSchema,
  UpdateBookmarkSchema,
  CreateCollectionSchema,
  UpdateCollectionSchema,
} from '../types/dto/bookmark/bookmark.dto';

const router = Router();

// Create validator instance
const validator = new ZodValidationProvider();

// Resolve controller
const bookmarkController = container.resolve(BookmarkController);

// Apply auth middleware to all routes
router.use(authMiddleware);

// Bookmark CRUD routes
router.post(
  '/add',
  validator.validateBody(AddBookmarkSchema),
  bookmarkController.addBookmark
);
router.delete('/remove/:id', bookmarkController.removeBookmark);
router.put(
  '/:id',
  validator.validateBody(UpdateBookmarkSchema),
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
  bookmarkController.createCollection
);
router.get('/collections', bookmarkController.getUserCollections);
router.put(
  '/collections/:id',
  validator.validateBody(UpdateCollectionSchema),
  bookmarkController.updateCollection
);
router.delete('/collections/:id', bookmarkController.deleteCollection);

// Collection items routes
router.post(
  '/collections/:collectionId/items/:bookmarkId',
  bookmarkController.addToCollection
);
router.delete(
  '/collections/:collectionId/items/:bookmarkId',
  bookmarkController.removeFromCollection
);
router.get('/collections/:id/items', bookmarkController.getCollectionItems);

// Analytics routes
router.get('/stats', bookmarkController.getBookmarkStats);

export default router;
