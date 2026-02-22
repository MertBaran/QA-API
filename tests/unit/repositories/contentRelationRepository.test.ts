import { ContentRelationRepository } from '../../../repositories/ContentRelationRepository';
import { IContentRelationDataSource } from '../../../repositories/interfaces/IContentRelationDataSource';
import { IContentRelationModel } from '../../../models/interfaces/IContentRelationModel';
import { ContentType, RelationType } from '../../../types/content/RelationType';

describe('ContentRelationRepository', () => {
  let repository: ContentRelationRepository;
  let mockDataSource: jest.Mocked<IContentRelationDataSource>;

  const sampleRelation: IContentRelationModel = {
    _id: 'rel-1',
    sourceContentType: ContentType.QUESTION,
    sourceContentId: 'q-1',
    targetContentType: ContentType.ANSWER,
    targetContentId: 'a-1',
    relationType: RelationType.RELATED,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockDataSource = {
      findBySourceIds: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findByField: jest.fn(),
      findByFields: jest.fn(),
      countAll: jest.fn(),
      deleteAll: jest.fn(),
    } as unknown as jest.Mocked<IContentRelationDataSource>;

    repository = new ContentRelationRepository(mockDataSource);
  });

  describe('findBySources', () => {
    it('should delegate to dataSource.findBySourceIds with correct args', async () => {
      mockDataSource.findBySourceIds.mockResolvedValue([sampleRelation]);

      const result = await repository.findBySources(
        ContentType.QUESTION,
        ['q-1', 'q-2']
      );

      expect(mockDataSource.findBySourceIds).toHaveBeenCalledTimes(1);
      expect(mockDataSource.findBySourceIds).toHaveBeenCalledWith(
        ContentType.QUESTION,
        ['q-1', 'q-2']
      );
      expect(result).toEqual([sampleRelation]);
    });

    it('should return empty array when contentIds is empty', async () => {
      mockDataSource.findBySourceIds.mockResolvedValue([]);

      const result = await repository.findBySources(ContentType.QUESTION, []);

      expect(mockDataSource.findBySourceIds).toHaveBeenCalledWith(
        ContentType.QUESTION,
        []
      );
      expect(result).toEqual([]);
    });

    it('should pass through result from dataSource', async () => {
      const relations = [sampleRelation, { ...sampleRelation, _id: 'rel-2' }];
      mockDataSource.findBySourceIds.mockResolvedValue(relations);

      const result = await repository.findBySources(ContentType.ANSWER, ['a-1']);

      expect(result).toHaveLength(2);
      expect(result).toEqual(relations);
    });
  });
});
