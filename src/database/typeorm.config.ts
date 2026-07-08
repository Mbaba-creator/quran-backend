import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// NO cargar .env en producción
if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

let databaseUrl: string;

if (process.env.NODE_ENV === 'production') {
  // En Railway, construir URL manualmente desde vars
  databaseUrl = postgresql://:@:/quran_platform;
} else {
  // En desarrollo, usar .env
  databaseUrl = process.env.DATABASE_URL;
}

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [__dirname + '/../**/*.entity.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
