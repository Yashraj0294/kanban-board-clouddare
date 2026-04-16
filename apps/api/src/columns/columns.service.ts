import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Column, ColumnDocument } from './column.schema';
import { CreateColumnDto, UpdateColumnDto } from './dto/column.dto';
import { Card, CardDocument } from '../cards/card.schema';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectModel(Column.name) private columnModel: Model<ColumnDocument>,
    @InjectModel(Card.name) private cardModel: Model<CardDocument>,
  ) {}

  async findByBoard(boardId: string): Promise<ColumnDocument[]> {
    return this.columnModel
      .find({ boardId })
      .sort({ position: 1 })
      .exec();
  }

  async create(boardId: string, dto: CreateColumnDto): Promise<ColumnDocument> {
    const count = await this.columnModel.countDocuments({ boardId });
    return this.columnModel.create({ title: dto.title, boardId, position: count });
  }

  async update(id: string, dto: UpdateColumnDto): Promise<ColumnDocument> {
    const column = await this.columnModel
      .findByIdAndUpdate(id, { title: dto.title }, { new: true })
      .exec();
    if (!column) throw new NotFoundException('Column not found');
    return column;
  }

  async remove(id: string): Promise<void> {
    const column = await this.columnModel.findByIdAndDelete(id).exec();
    if (!column) throw new NotFoundException('Column not found');
    // Cascade delete cards in this column
    await this.cardModel.deleteMany({ columnId: id }).exec();
  }
}
