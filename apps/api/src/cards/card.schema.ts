import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CardDocument = Card & Document;

@Schema({ timestamps: true })
export class Card {
  @Prop({ required: true, trim: true, maxlength: 100 })
  title: string;

  @Prop({ trim: true, maxlength: 1000 })
  description: string;

  @Prop({ trim: true })
  assignee: string;

  @Prop()
  dueDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Column', required: true })
  columnId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  position: number;
}

export const CardSchema = SchemaFactory.createForClass(Card);
