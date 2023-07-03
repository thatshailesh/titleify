import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TitleGenerationService as TitleGenerationService } from './title-generation.service';
import { TiteGenerationController as TitleGenerationController } from './title-generation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TitleRequest, titleRequestSchema } from './schemas/title-request.schema';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { KafkaService } from '../shared/kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OpenAIService } from '../shared/openai.service';
import { TitleRequestModel } from './models/title-request.model';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: 1, // Time-to-Live (in seconds) for rate limit counters
      limit: 5, // Maximum number of requests per TTL period
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URL')
      }),
      inject: [ConfigService]
    }),
    MongooseModule.forFeature([{
      name: TitleRequest.name,
      schema: titleRequestSchema
    }]),
    ClientsModule.registerAsync([
      {
        name: 'TITLE_SERVICE',
        useFactory: (configService: ConfigService) => {
          const KAFKA_BROKER = configService.get<string>('KAFKA_BROKER');
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'title-service',
                brokers: [KAFKA_BROKER],
              },
              producerOnlyMode: true,
              consumer: {
                groupId: 'title-service-consumer',
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ])
  ],
    providers: [
      TitleRequestModel,
      KafkaService,
      TitleGenerationService, {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }, OpenAIService],
  controllers: [TitleGenerationController]
})
export class TitleGenerationModule {}
