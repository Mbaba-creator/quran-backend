import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sala, SalaSchema } from './schemas/sala.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { SalasService } from './services/salas.service';
import { SalasGateway } from './gateways/salas.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Sala.name, schema: SalaSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  providers: [SalasService, SalasGateway],
  exports: [SalasService],
})
export class SalasModule {}
