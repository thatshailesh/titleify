import { Test, TestingModule } from '@nestjs/testing';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

describe('KafkaService', () => {
  let kafkaService: KafkaService;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: 'TITLE_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    kafkaService = module.get<KafkaService>(KafkaService);
    kafkaClient = module.get<ClientKafka>('TITLE_SERVICE');
  });

  describe('publishMessage', () => {
    it('should emit a message using the kafka client', async () => {
      const routingKey = 'create_title';
      const message = {
        title: 'Sample Title',
        text: 'Sample Text',
      };

      await kafkaService.publishMessage(routingKey, message);

      expect(kafkaClient.emit).toHaveBeenCalledWith(routingKey, message);
      expect(kafkaClient.emit).toHaveBeenCalledTimes(1);
    });
  });

});
