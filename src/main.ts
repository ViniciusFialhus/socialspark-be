import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process'
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const portNumber = process.env.PORT || 3000
  app.enableCors({
      origin: ['https://socialspark-fe.vercel.app', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  });
  await app.listen(portNumber);
}

bootstrap();
