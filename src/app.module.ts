import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { SalasModule } from './modules/salas/salas.module';
import { BibliotecaModule } from './modules/biblioteca/biblioteca.module';

@Module({
  imports: [
    // TypeOrmModule temporarily disabled - Socket.IO doesn't need it
    // TODO: Fix PostgreSQL connection issue and re-enable
    AuthModule,
    SalasModule,
    BibliotecaModule,
  ],
})
export class AppModule {}
