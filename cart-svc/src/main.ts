import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter, LoggingInterceptor } from '@jrumandal/shared';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Cart Service')
    .setDescription('Cart domain API (carts, items).')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = parseInt(process.env.PORT || '4002', 10);
  await app.listen(port);
  Logger.log(`🚀 cart-svc is running on: http://localhost:${port}/graphql`);
  Logger.log(`📚 OpenAPI docs: http://localhost:${port}/api-docs`);
  Logger.log(`❤️  Health: http://localhost:${port}/health`);
}

bootstrap();
