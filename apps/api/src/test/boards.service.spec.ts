import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { DEFAULT_COLUMNS } from '@kanban-board/shared-constants';
import { Board, BoardSchema } from '../boards/board.schema';
import { BoardsService } from '../boards/boards.service';
import { Column, ColumnSchema } from '../columns/column.schema';
import { clearTestDb, setupTestDb, teardownTestDb } from './test-db.helper';

describe('BoardsService', () => {
  let module: TestingModule;
  let boardsService: BoardsService;
  let columnModel: Model<Column>;
  let uri: string;

  beforeAll(async () => {
    ({ uri } = await setupTestDb());

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Board.name, schema: BoardSchema },
          { name: Column.name, schema: ColumnSchema },
        ]),
      ],
      providers: [BoardsService],
    }).compile();

    boardsService = module.get<BoardsService>(BoardsService);
    columnModel = module.get<Model<Column>>(getModelToken(Column.name));
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await module.close();
    await teardownTestDb();
  });

  describe('create', () => {
    it('creates a board with the given title', async () => {
      const board = await boardsService.create({ title: 'Sprint 1' });
      expect(board.title).toBe('Sprint 1');
      expect(board._id).toBeDefined();
    });

    it(`seeds exactly ${DEFAULT_COLUMNS.length} default columns`, async () => {
      const board = await boardsService.create({ title: 'Board With Columns' });
      const columns = await columnModel.find({ boardId: board._id });
      expect(columns).toHaveLength(DEFAULT_COLUMNS.length);
    });

    it('seeds columns with correct titles in order', async () => {
      const board = await boardsService.create({ title: 'Ordered Board' });
      const columns = await columnModel
        .find({ boardId: board._id })
        .sort({ position: 1 });
      const titles = columns.map((c) => c.title);
      expect(titles).toEqual([...DEFAULT_COLUMNS]);
    });

    it('assigns correct positions (0, 1, 2) to seeded columns', async () => {
      const board = await boardsService.create({ title: 'Position Board' });
      const columns = await columnModel
        .find({ boardId: board._id })
        .sort({ position: 1 });
      expect(columns.map((c) => c.position)).toEqual([0, 1, 2]);
    });
  });

  describe('findAll', () => {
    it('returns all boards', async () => {
      await boardsService.create({ title: 'Board A' });
      await boardsService.create({ title: 'Board B' });
      const boards = await boardsService.findAll();
      expect(boards).toHaveLength(2);
    });

    it('returns empty array when no boards exist', async () => {
      const boards = await boardsService.findAll();
      expect(boards).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('returns the board for a valid id', async () => {
      const created = await boardsService.create({ title: 'Findable' });
      const found = await boardsService.findOne(String(created._id));
      expect(found?.title).toBe('Findable');
    });

    it('returns null for a non-existent id', async () => {
      const found = await boardsService.findOne('507f1f77bcf86cd799439011');
      expect(found).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes the board', async () => {
      const board = await boardsService.create({ title: 'To Delete' });
      await boardsService.remove(String(board._id));
      const found = await boardsService.findOne(String(board._id));
      expect(found).toBeNull();
    });
  });
});
