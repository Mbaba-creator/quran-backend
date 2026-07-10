import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Sala extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  language: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherId: Types.ObjectId;

  @Prop({ enum: ['inactive', 'scheduled', 'active'], default: 'inactive' })
  status: string;

  @Prop({ default: false })
  isLive: boolean;

  @Prop({ default: null })
  topic: string;

  @Prop({ type: Map, of: String, default: new Map() })
  members: Map<string, string>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SalaSchema = SchemaFactory.createForClass(Sala);
