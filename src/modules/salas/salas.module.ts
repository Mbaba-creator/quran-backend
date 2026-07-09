import { Module } from '@nestjs/common';
import { SalasService } from './services/salas.service';
import { SalasGateway } from './gateways/salas.gateway';

@Module({
  providers: [SalasService, SalasGateway],
  exports: [SalasService],
})
export class SalasModule {}
