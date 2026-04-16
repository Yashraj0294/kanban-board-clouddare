import { NotFoundException } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Card, CardSchema } from '../cards/card.schema';
import { CardsService } from '../cards/cards.service';
import { clearTestDb, setupTestDb, teardownTestDb } from './test-db.helper';

const boardId = new Types.ObjectId().toHexString();
const col1 = new Types.ObjectId().toHexString();
const col2 = new Types.ObjectId().toHexString();

describe('CardsService', () => {
  let module: TestingModule;
  let cardsService: CardsService;
  let cardModel: Model<Card>;
  let uri: string;

  beforeAll(async () => {
    ({ uri } = await setupTestDb());

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
      ],
      providers: [CardsService],
    }).compile();

    cardsService = module.get<CardsService>(CardsService);
    cardModel = module.get<Model<Card>>(getModelToken(Card.name));
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await module.close();
    await teardownTestDb();
  });

  const makeCard = (title: string, columnId: string, position: number) =>
    cardModel.create({ title, columnId, boardId, position });

  describe('create', () => {
    it('creates a card and auto-assigns position based on column count', async () => {
      await makeCard('Existing', col1, 0);
      const card = await cardsService.create({
        title: 'New',
        columnId: col1,
        boardId,
      });
      expect(card.position).toBe(1);
    });

    it('starts position at 0 for the first card in a column', async () => {
      const card = await cardsService.create({
        title: 'First',
        columnId: col1,
        boardId,
      });
      expect(card.position).toBe(0);
    });
  });

  describe('update', () => {
    it('updates card title', async () => {
      const card = await makeCard('Original', col1, 0);
      const updated = await cardsService.update(String(card._id), {
        title: 'Updated',
      });
      expect(updated.title).toBe('Updated');
    });

    it('throws NotFoundException for unknown id', async () => {
      await expect(
        cardsService.update('507f1f77bcf86cd799439011', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a card', async () => {
      const card = await makeCard('Delete Me', col1, 0);
      await cardsService.remove(String(card._id));
      const found = await cardModel.findById(card._id);
      expect(found).toBeNull();
    });

    it('throws NotFoundException for unknown id', async () => {
      await expect(
        cardsService.remove('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('move — cross-column', () => {
    it('moves a card to a different column', async () => {
      const card = await makeCard('Card', col1, 0);
      const moved = await cardsService.move(String(card._id), {
        destinationColumnId: col2,
        newPosition: 0,
      });
      expect(String(moved.columnId)).toBe(col2);
      expect(moved.position).toBe(0);
    });

    it('shifts source column cards up after removal', async () => {
      const c0 = await makeCard('C0', col1, 0);
      const c1 = await makeCard('C1', col1, 1);
      const c2 = await makeCard('C2', col1, 2);

      // Move c0 out
      await cardsService.move(String(c0._id), {
        destinationColumnId: col2,
        newPosition: 0,
      });

      const updated1 = await cardModel.findById(c1._id);
      const updated2 = await cardModel.findById(c2._id);
      expect(updated1?.position).toBe(0);
      expect(updated2?.position).toBe(1);
    });

    it('shifts destination column cards down to make room', async () => {
      const dest0 = await makeCard('D0', col2, 0);
      const dest1 = await makeCard('D1', col2, 1);
      const src = await makeCard('Src', col1, 0);

      await cardsService.move(String(src._id), {
        destinationColumnId: col2,
        newPosition: 0,
      });

      const updatedD0 = await cardModel.findById(dest0._id);
      const updatedD1 = await cardModel.findById(dest1._id);
      expect(updatedD0?.position).toBe(1);
      expect(updatedD1?.position).toBe(2);
    });
  });

  describe('move — same-column reorder', () => {
    it('moves a card down within the same column', async () => {
      const c0 = await makeCard('C0', col1, 0);
      const c1 = await makeCard('C1', col1, 1);
      const c2 = await makeCard('C2', col1, 2);

      await cardsService.move(String(c0._id), {
        destinationColumnId: col1,
        newPosition: 2,
      });

      const updated0 = await cardModel.findById(c0._id);
      const updated1 = await cardModel.findById(c1._id);
      const updated2 = await cardModel.findById(c2._id);
      expect(updated0?.position).toBe(2);
      expect(updated1?.position).toBe(0);
      expect(updated2?.position).toBe(1);
    });

    it('moves a card up within the same column', async () => {
      const c0 = await makeCard('C0', col1, 0);
      const c1 = await makeCard('C1', col1, 1);
      const c2 = await makeCard('C2', col1, 2);

      await cardsService.move(String(c2._id), {
        destinationColumnId: col1,
        newPosition: 0,
      });

      const updated0 = await cardModel.findById(c0._id);
      const updated1 = await cardModel.findById(c1._id);
      const updated2 = await cardModel.findById(c2._id);
      expect(updated2?.position).toBe(0);
      expect(updated0?.position).toBe(1);
      expect(updated1?.position).toBe(2);
    });

    it('no-ops when dropped at the same position', async () => {
      const card = await makeCard('Solo', col1, 0);
      const result = await cardsService.move(String(card._id), {
        destinationColumnId: col1,
        newPosition: 0,
      });
      expect(result.position).toBe(0);
    });
  });
});
