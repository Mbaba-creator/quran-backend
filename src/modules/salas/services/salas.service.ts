import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sala } from '../schemas/sala.schema';
import { Message } from '../schemas/message.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalasService {
  constructor(
    @InjectModel(Sala.name) private salaModel: Model<Sala>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createSala(name: string, type: string, language: string) {
    const sala = await this.salaModel.create({
      name,
      type,
      language,
      members: [],
    });
    return sala;
  }

  async getSalas() {
    return await this.salaModel.find();
  }

  async getSalaById(id: string) {
    return await this.salaModel.findById(id);
  }

  async joinSala(salaId: string, userId: string) {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');
    if (!sala.members.includes(userId)) {
      sala.members.push(userId);
      await sala.save();
    }
    return sala;
  }

  async leaveSala(salaId: string, userId: string) {
    const sala = await this.salaModel.findById(salaId);
    if (!sala) throw new Error('Sala not found');
    sala.members = sala.members.filter(m => m !== userId);
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
