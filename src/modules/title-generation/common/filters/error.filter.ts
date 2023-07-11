import { ClsService } from 'nestjs-cls';
import { Request, Response } from 'express';
import { ExceptionFilter, Catch, HttpException, ArgumentsHost, Injectable } from "@nestjs/common";
import { KafkaService } from '../../../shared/kafka.service';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class ErrorFilter implements ExceptionFilter {
    constructor(
        private readonly cls: ClsService,
        private readonly kafkaService: KafkaService
    ) {}
    async catch(exception: HttpException | RpcException, host: ArgumentsHost) {
        const requestId = this.cls.getId()
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        let message: string;

        if (!(exception instanceof HttpException)) {
          await this.kafkaService.publishMessage('error', JSON.stringify({exception, requestId}))
        }else {
          const status = exception.getStatus();
          message = exception.message || 'Internal Server Error'
          response
          .status(status)
          .json({
            message,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
          });
        }
    }
}