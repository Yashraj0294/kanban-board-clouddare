import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_COLUMNS } from '@kanban-board/shared-constants';
import { Board, BoardDocument } from './board.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { Column, ColumnDocument } from '../columns/column.schema';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(Column.name) private columnModel: Model<ColumnDocument>,
  ) {}

  async findAll(): Promise<BoardDocument[]> {
    return this.boardModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<BoardDocument | null> {
    return this.boardModel.findById(id).exec();
  }

  async create(dto: CreateBoardDto): Promise<BoardDocument> {
    const board = await this.boardModel.create({ title: dto.title });

    // Seed the three default columns
    const columnDocs = DEFAULT_COLUMNS.map((title, index) => ({
      title,
      boardId: board._id,
      position: index,
    }));
    await this.columnModel.insertMany(columnDocs);

    return board;
  }

  async remove(id: string): Promise<void> {
    await this.boardModel.findByIdAndDelete(id).exec();
  }
}
