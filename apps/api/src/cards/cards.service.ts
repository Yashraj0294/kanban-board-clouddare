import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card, CardDocument } from './card.schema';
import { CreateCardDto, MoveCardDto, UpdateCardDto } from './dto/card.dto';

@Injectable()
export class CardsService {
  constructor(@InjectModel(Card.name) private cardModel: Model<CardDocument>) {}

  async findByBoard(boardId: string): Promise<CardDocument[]> {
    return this.cardModel
      .find({ boardId })
      .sort({ columnId: 1, position: 1 })
      .exec();
  }

  async findById(id: string): Promise<CardDocument | null> {
    return this.cardModel.findById(id).exec();
  }

  async create(dto: CreateCardDto): Promise<CardDocument> {
    const count = await this.cardModel.countDocuments({ columnId: dto.columnId });
    return this.cardModel.create({ ...dto, position: count });
  }

  async update(id: string, dto: UpdateCardDto): Promise<CardDocument> {
    const card = await this.cardModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async move(id: string, dto: MoveCardDto): Promise<CardDocument> {
    const card = await this.cardModel.findById(id).exec();
    if (!card) throw new NotFoundException('Card not found');

    const sourceColumnId = String(card.columnId);
    const isSameColumn = sourceColumnId === dto.destinationColumnId;

    if (!isSameColumn) {
      // Shift cards down in the source column to fill the gap
      await this.cardModel
        .updateMany(
          { columnId: sourceColumnId, position: { $gt: card.position } },
          { $inc: { position: -1 } },
        )
        .exec();

      // Shift cards up in the destination column to make room
      await this.cardModel
        .updateMany(
          { columnId: dto.destinationColumnId, position: { $gte: dto.newPosition } },
          { $inc: { position: 1 } },
        )
        .exec();
    } else {
      // Reordering within the same column
      if (dto.newPosition > card.position) {
        await this.cardModel
          .updateMany(
            {
              columnId: sourceColumnId,
              position: { $gt: card.position, $lte: dto.newPosition },
            },
            { $inc: { position: -1 } },
          )
          .exec();
      } else if (dto.newPosition < card.position) {
        await this.cardModel
          .updateMany(
            {
              columnId: sourceColumnId,
              position: { $gte: dto.newPosition, $lt: card.position },
            },
            { $inc: { position: 1 } },
          )
          .exec();
      }
    }

    const updated = await this.cardModel
      .findByIdAndUpdate(
        id,
        { columnId: dto.destinationColumnId, position: dto.newPosition },
        { new: true },
      )
      .exec();

    return updated as CardDocument;
  }

  async remove(id: string): Promise<void> {
    const card = await this.cardModel.findByIdAndDelete(id).exec();
    if (!card) throw new NotFoundException('Card not found');
  }
}
