import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { mongooseConfig } from './database/mongoose.config';
import { AuthModule } from './modules/auth/auth.module';
import { SalasModule } from './modules/salas/salas.module';
import { BibliotecaModule } from './modules/biblioteca/biblioteca.module';

@Module({
  imports: [
    MongooseModule.forRoot(mongooseConfig.uri),
    AuthModule,
    SalasModule,
    BibliotecaModule,
  ],
})
export class AppModule {}
