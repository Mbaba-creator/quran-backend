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

  @SubscribeMessage('create-sala')
  async handleCreateSala(
    @MessageBody() data: { name: string; type: string; language: string },
  ) {
    const sala = await this.salasService.createSala(data.name, data.type, data.language);
    this.server.emit('sala-created', sala);
    return sala;
  }

  @SubscribeMessage('get-salas')
  async handleGetSalas() {
    return await this.salasService.getSalas();
  }

  @SubscribeMessage('join-sala')
  async handleJoinSala(
    @MessageBody() data: { salaId: string; userId: string; displayName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sala = await this.salasService.joinSala(data.salaId, data.userId);
    client.join(data.salaId);
    this.server.to(data.salaId).emit('user-joined', {
      userId: data.userId,
      displayName: data.displayName,
      members: sala.members,
    });
    return sala;
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    data: { salaId: string; userId: string; displayName: string; content: string },
  ) {
    const message = await this.salasService.addMessage(
      data.salaId,
      data.userId,
      data.displayName,
      data.content,
    );
    this.server.to(data.salaId).emit('new-message', message);
    return message;
  }

  @SubscribeMessage('get-messages')
  async handleGetMessages(@MessageBody() data: { salaId: string }) {
    return await this.salasService.getMessages(data.salaId);
  }
}
