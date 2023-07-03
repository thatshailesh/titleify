import { NestFactory } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFilter } from './modules/title-generation/common/filters/error.filter';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './modules/shared/kafka.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const clsService = app.get(ClsService)
  const configService = app.get(ConfigService);
  const kafkaBroker = configService.get('KAFKA_BROKER')
  const kafkaService = app.get(KafkaService)
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ErrorFilter(clsService, kafkaService));
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [kafkaBroker],
        },
        consumer: {
          groupId: 'title-service-consumer',
        },
      },
    }
  );
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
