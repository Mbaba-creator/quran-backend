import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sala, SalaSchema } from './schemas/sala.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { SalasService } from './services/salas.service';
import { SalasGateway } from './gateways/salas.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sala.name, schema: SalaSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [SalasService, SalasGateway],
  exports: [SalasService],
})
export class SalasModule {}
