import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process'
require('dotenv').config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://socialspark-fe.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  });
  await app.listen(process.env.PORT, '0.0.0.0');
}

bootstrap();
