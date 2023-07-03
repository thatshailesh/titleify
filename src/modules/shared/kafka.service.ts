import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(@Inject('TITLE_SERVICE') private readonly kafkaclient: ClientKafka) {}

  async publishMessage(routingKey: string, message: any): Promise<void> {
    await this.kafkaclient.emit(routingKey, message);
  }
}