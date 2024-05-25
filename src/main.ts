import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process'
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000
  app.enableCors({
    origin: 'https://socialspark-fe.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  });
  await app.listen(port);
}

bootstrap();
