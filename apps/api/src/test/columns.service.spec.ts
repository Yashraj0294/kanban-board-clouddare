import { NotFoundException } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Card, CardSchema } from '../cards/card.schema';
import { Column, ColumnSchema } from '../columns/column.schema';
import { ColumnsService } from '../columns/columns.service';
import { clearTestDb, setupTestDb, teardownTestDb } from './test-db.helper';

const boardId = new Types.ObjectId().toHexString();

describe('ColumnsService', () => {
  let module: TestingModule;
  let columnsService: ColumnsService;
  let uri: string;

  beforeAll(async () => {
    ({ uri } = await setupTestDb());

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Column.name, schema: ColumnSchema },
          { name: Card.name, schema: CardSchema },
        ]),
      ],
      providers: [ColumnsService],
    }).compile();

    columnsService = module.get<ColumnsService>(ColumnsService);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await module.close();
    await teardownTestDb();
  });

  describe('create', () => {
    it('creates a column with auto-incremented position', async () => {
      await columnsService.create(boardId, { title: 'First' });
      const second = await columnsService.create(boardId, { title: 'Second' });
      expect(second.position).toBe(1);
    });
  });

  describe('update', () => {
    it('renames a column', async () => {
      const col = await columnsService.create(boardId, { title: 'Old' });
      const updated = await columnsService.update(String(col._id), {
        title: 'New',
      });
      expect(updated.title).toBe('New');
    });

    it('throws NotFoundException for unknown id', async () => {
      await expect(
        columnsService.update('507f1f77bcf86cd799439011', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the column', async () => {
      const col = await columnsService.create(boardId, { title: 'Delete Me' });
      await columnsService.remove(String(col._id));
      const cols = await columnsService.findByBoard(boardId);
      expect(cols).toHaveLength(0);
    });

    it('throws NotFoundException for unknown id', async () => {
      await expect(
        columnsService.remove('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBoard', () => {
    it('returns columns sorted by position', async () => {
      await columnsService.create(boardId, { title: 'A' });
      await columnsService.create(boardId, { title: 'B' });
      await columnsService.create(boardId, { title: 'C' });
      const cols = await columnsService.findByBoard(boardId);
      expect(cols.map((c) => c.title)).toEqual(['A', 'B', 'C']);
    });
  });
});
