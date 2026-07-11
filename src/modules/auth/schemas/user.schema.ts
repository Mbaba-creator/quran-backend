import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop()
  display_name: string;

  @Prop({ default: 'student' })
  role: string;

  @Prop({ enum: ['men', 'women'], required: true })
  gender: string;

  @Prop({ default: 'es' })
  language: string;

  @Prop()
  avatar_url: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: null })
  banReason: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;

  @Prop()
  deleted_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
