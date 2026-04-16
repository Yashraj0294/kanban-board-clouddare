import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Card, CardSchema } from '../cards/card.schema';
import { Column, ColumnSchema } from './column.schema';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Column.name, schema: ColumnSchema },
      { name: Card.name, schema: CardSchema },
    ]),
    AuthModule,
  ],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [ColumnsService],
})
export class ColumnsModule {}
