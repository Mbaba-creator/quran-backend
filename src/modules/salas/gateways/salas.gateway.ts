import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SalasService } from '../services/salas.service';

@WebSocketGateway({
  namespace: '/salas',
  cors: { origin: '*' },
})
export class SalasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private salasService: SalasService) {}

  handleConnection(client: Socket) {
    console.log('User connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('User disconnected:', client.id);
  }

  @SubscribeMessage('get-salas')
  async handleGetSalas() {
    return await this.salasService.getSalas();
  }

  @SubscribeMessage('create-sala')
  async handleCreateSala(
    @MessageBody() data: { name: string; type: string; language: string; teacherId: string },
  ) {
    const sala = await this.salasService.createSala(data.name, data.type, data.language, data.teacherId);
    this.server.emit('sala-created', sala);
    return sala;
  }

  @SubscribeMessage('start-live-class')
  async handleStartLiveClass(
    @MessageBody() data: { salaId: string; topic: string },
  ) {
    const sala = await this.salasService.startLiveClass(data.salaId, data.topic);
    this.server.to(data.salaId).emit('class-started', sala);
    return sala;
  }

  @SubscribeMessage('end-live-class')
  async handleEndLiveClass(@MessageBody() data: { salaId: string }) {
    const sala = await this.salasService.endLiveClass(data.salaId);
    this.server.to(data.salaId).emit('class-ended', sala);
    return sala;
  }

  @SubscribeMessage('join-class')
  async handleJoinClass(
    @MessageBody() data: { salaId: string; userId: string; displayName: string; role: 'teacher' | 'student' },
    @ConnectedSocket() client: Socket,
  ) {
    const sala = await this.salasService.joinClass(data.salaId, data.userId, data.displayName, data.role);
    client.join(data.salaId);
    this.server.to(data.salaId).emit('user-joined', {
      userId: data.userId,
      displayName: data.displayName,
      role: data.role,
      members: sala.members.size,
    });
    return sala;
  }

  @SubscribeMessage('leave-class')
  async handleLeaveClass(@MessageBody() data: { salaId: string; userId: string }) {
    const sala = await this.salasService.leaveClass(data.salaId, data.userId);
    this.server.to(data.salaId).emit('user-left', {
      userId: data.userId,
      members: sala.members.size,
    });
    return sala;
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: { salaId: string; userId: string; displayName: string; content: string },
  ) {
    const message = await this.salasService.addMessage(data.salaId, data.userId, data.displayName, data.content);
    this.server.to(data.salaId).emit('new-message', message);
    return message;
  }

  @SubscribeMessage('get-messages')
  async handleGetMessages(@MessageBody() data: { salaId: string }) {
    return await this.salasService.getMessages(data.salaId);
  }
}
