import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? '*'
        : 'https://game-app-sable.vercel.app',
    methods: 'GET',
  });
  await app.listen(process.env.PORT ?? 3100);
}
bootstrap();
