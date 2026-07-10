import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sala } from '../schemas/sala.schema';
import { Message } from '../schemas/message.schema';

@Injectable()
export class SalasService {
  constructor(
    @InjectModel(Sala.name) private salaModel: Model<Sala>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createSala(name: string, type: string, language: string, teacherId: string) {
    const sala = await this.salaModel.create({
      name,
      type,
      language,
      teacherId: new Types.ObjectId(teacherId),
      status: 'scheduled',
      isLive: false,
      members: new Map(),
    });
    return sala;
  }

  async getSalas() {
    return await this.salaModel.find();
  }

  async getSalaById(id: string) {
    return await this.salaModel.findById(id);
  }

  async startLiveClass(salaId: string, topic: string) {
    return await this.salaModel.findByIdAndUpdate(
      salaId,
      { isLive: true, status: 'active', topic },
      { new: true }
    );
  }

  async endLiveClass(salaId: string) {
    return await this.salaModel.findByIdAndUpdate(
      salaId,
      { isLive: false, status: 'inactive' },
      { new: true }
    );
  }

  async joinClass(salaId: string, userId: string, displayName: string, role: 'teacher' | 'student') {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');
    
    sala.members.set(userId, JSON.stringify({ displayName, role }));
    await sala.save();
    return sala;
  }

  async leaveClass(salaId: string, userId: string) {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');
    
    sala.members.delete(userId);
    await sala.save();
    return sala;
  }

  async addMessage(salaId: string, userId: string, displayName: string, content: string) {
    const message = await this.messageModel.create({
      salaId: new Types.ObjectId(salaId),
      userId,
      displayName,
      content,
    });
    return message;
  }

  async getMessages(salaId: string) {
    return await this.messageModel.find({ salaId: new Types.ObjectId(salaId) });
  }
}
