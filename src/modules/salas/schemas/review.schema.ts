import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Sala', required: true })
  salaId: Types.ObjectId;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  studentName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  teacherName: string;

  @Prop({ required: true })
  surahName: string;

  @Prop({ enum: ['approved', 'needs_practice'], required: true })
  result: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
