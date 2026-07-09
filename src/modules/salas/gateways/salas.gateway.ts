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
import { MessageDto } from '../dto/sala.dto';
import { v4 as uuidv4 } from 'uuid';

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
  handleCreateSala(
    @MessageBody() data: { name: string; type: string; language: string },
  ) {
    const sala = this.salasService.createSala(data);
    this.server.emit('sala-created', sala);
    return sala;
  }

  @SubscribeMessage('get-salas')
  handleGetSalas() {
    return this.salasService.getSalas();
  }

  @SubscribeMessage('join-sala')
  handleJoinSala(
    @MessageBody() data: { salaId: string; userId: string; displayName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sala = this.salasService.joinSala(data.salaId, {
      userId: data.userId,
      displayName: data.displayName,
    });
    client.join(data.salaId);
    this.server.to(data.salaId).emit('user-joined', {
      userId: data.userId,
      displayName: data.displayName,
      members: sala.members,
    });
    return sala;
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody()
    data: { salaId: string; userId: string; displayName: string; content: string },
  ) {
    const message: MessageDto = {
      id: uuidv4(),
      salaId: data.salaId,
      userId: data.userId,
      displayName: data.displayName,
      content: data.content,
      createdAt: new Date(),
    };
    this.salasService.addMessage(data.salaId, message);
    this.server.to(data.salaId).emit('new-message', message);
    return message;
  }

  @SubscribeMessage('get-messages')
  handleGetMessages(@MessageBody() data: { salaId: string }) {
    return this.salasService.getMessages(data.salaId);
  }
}
