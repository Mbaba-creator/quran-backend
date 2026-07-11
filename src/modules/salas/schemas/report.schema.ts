import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Report extends Document {
  @Prop({ required: true })
  reporterId: string;

  @Prop({ required: true })
  reporterName: string;

  @Prop({ required: true })
  reportedUserId: string;

  @Prop({ required: true })
  reportedUserName: string;

  @Prop({ type: Types.ObjectId, ref: 'Sala' })
  salaId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
