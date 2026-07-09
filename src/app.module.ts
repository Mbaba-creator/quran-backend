import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeormConfig } from './database/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { SalasModule } from './modules/salas/salas.module';
import { BibliotecaModule } from './modules/biblioteca/biblioteca.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...typeormConfig,
      retryAttempts: 0,
      synchronize: false,
    }),
    AuthModule,
    SalasModule,
    BibliotecaModule,
  ],
})
export class AppModule {}
