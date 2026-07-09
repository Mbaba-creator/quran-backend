import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/quran_platform',
};
