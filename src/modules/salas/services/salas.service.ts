import { Injectable } from '@nestjs/common';
import { SalaDto, MessageDto, CreateSalaDto, JoinSalaDto } from '../dto/sala.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalasService {
  private salas = new Map<string, SalaDto>();
  private messages = new Map<string, MessageDto[]>();

  createSala(dto: CreateSalaDto): SalaDto {
    const sala: SalaDto = {
      id: uuidv4(),
      name: dto.name,
      type: dto.type,
      language: dto.language,
      createdAt: new Date(),
      members: [],
    };
    this.salas.set(sala.id, sala);
    this.messages.set(sala.id, []);
    return sala;
  }

  getSalas(): SalaDto[] {
    return Array.from(this.salas.values());
  }

  getSalaById(id: string): SalaDto {
  const sala = this.salas.get(id);
  if (!sala) throw new Error('Sala not found');
  return sala;
}

  joinSala(salaId: string, dto: JoinSalaDto): SalaDto {
    const sala = this.salas.get(salaId);
    if (!sala) throw new Error('Sala not found');
    if (!sala.members.includes(dto.userId)) {
      sala.members.push(dto.userId);
    }
    return sala;
  }

  leaveSala(salaId: string, userId: string): SalaDto {
    const sala = this.salas.get(salaId);
    if (!sala) throw new Error('Sala not found');
    sala.members = sala.members.filter(m => m !== userId);
    return sala;
  }

  addMessage(salaId: string, message: MessageDto): MessageDto {
    const messages = this.messages.get(salaId) || [];
    messages.push(message);
    this.messages.set(salaId, messages);
    return message;
  }

  getMessages(salaId: string): MessageDto[] {
    return this.messages.get(salaId) || [];
  }
}
