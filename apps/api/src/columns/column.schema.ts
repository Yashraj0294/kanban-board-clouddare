import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ColumnDocument = Column & Document;

@Schema({ timestamps: true })
export class Column {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  position: number;
}

export const ColumnSchema = SchemaFactory.createForClass(Column);
