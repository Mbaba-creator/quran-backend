import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { SalasModule } from './modules/salas/salas.module';
import { BibliotecaModule } from './modules/biblioteca/biblioteca.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/quran_platform'),
    AuthModule,
    SalasModule,
    BibliotecaModule,
  ],
})
export class AppModule {}
