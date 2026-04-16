import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Column, ColumnSchema } from '../columns/column.schema';
import { Board, BoardSchema } from './board.schema';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: Column.name, schema: ColumnSchema },
    ]),
    AuthModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
