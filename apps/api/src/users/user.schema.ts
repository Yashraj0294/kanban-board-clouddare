import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '@kanban-board/shared-types';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: Role, default: Role.VIEWER })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
