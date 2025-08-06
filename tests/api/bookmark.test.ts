import request from 'supertest';
import app from '../../APP';
import { container } from 'tsyringe';
import { IBookmarkService } from '../../services/contracts/IBookmarkService';

describe('Bookmark API Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'test-token'
      });

    if (loginResponse.body.success) {
      authToken = loginResponse.body.access_token;
      testUserId = loginResponse.body.data._id;
    }
  });

  describe('POST /api/bookmarks/add', () => {
    it('should add a bookmark successfully', async () => {
      const bookmarkData = {
        targetType: 'question' as const,
        targetId: '507f1f77bcf86cd799439011',
        targetData: {
          title: 'Test Question',
          content: 'This is a test question content',
          author: 'Test User',
          created_at: new Date().toISOString()
        },
        tags: ['test', 'question'],
        notes: 'This is a test bookmark',
        isPublic: false
      };

      const response = await request(app)
        .post('/api/bookmarks/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookmarkData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.target_type).toBe('question');
      expect(response.body.target_data.title).toBe('Test Question');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/bookmarks/add')
        .send({
          targetType: 'question',
          targetId: '507f1f77bcf86cd799439011',
          targetData: {
            title: 'Test Question',
            content: 'This is a test question content',
            created_at: new Date().toISOString()
          }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bookmarks/user', () => {
    it('should get user bookmarks', async () => {
      const response = await request(app)
        .get('/api/bookmarks/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/bookmarks/user');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bookmarks/check/:targetType/:targetId', () => {
    it('should check if bookmark exists', async () => {
      const response = await request(app)
        .get('/api/bookmarks/check/question/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exists');
      expect(typeof response.body.exists).toBe('boolean');
    });
  });

  describe('DELETE /api/bookmarks/remove/:id', () => {
    it('should remove a bookmark', async () => {
      // First add a bookmark
      const addResponse = await request(app)
        .post('/api/bookmarks/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetType: 'question',
          targetId: '507f1f77bcf86cd799439012',
          targetData: {
            title: 'Test Question for Deletion',
            content: 'This is a test question content',
            created_at: new Date().toISOString()
          }
        });

      const bookmarkId = addResponse.body._id;

      // Then delete it
      const response = await request(app)
        .delete(`/api/bookmarks/remove/${bookmarkId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });
  });

  describe('POST /api/bookmarks/collections', () => {
    it('should create a collection', async () => {
      const collectionData = {
        name: 'Test Collection',
        description: 'This is a test collection',
        color: '#FF0000',
        isPublic: false
      };

      const response = await request(app)
        .post('/api/bookmarks/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(collectionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe('Test Collection');
    });
  });

  describe('GET /api/bookmarks/collections', () => {
    it('should get user collections', async () => {
      const response = await request(app)
        .get('/api/bookmarks/collections')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/bookmarks/stats', () => {
    it('should get bookmark stats', async () => {
      const response = await request(app)
        .get('/api/bookmarks/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('recent');
    });
  });
}); 