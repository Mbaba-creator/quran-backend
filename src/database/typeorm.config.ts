import { TypeOrmModuleOptions } from '@nestjs/typeorm';

if (process.env.NODE_ENV !== 'production') {
  const dotenv = require('dotenv');
  dotenv.config();
}

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: 'quran_platform',
  entities: [__dirname + '/../**/*.entity.ts'],
  synchronize: true,
  logging: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
