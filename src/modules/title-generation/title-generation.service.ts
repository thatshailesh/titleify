import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../shared/openai.service';
import { KafkaService } from '../shared/kafka.service';
import { ClsService } from 'nestjs-cls';
import { GetTitleDto } from './dto/get-title.dto';
import { GetTitleResponseDto } from './dto/get-title.response.dto';
import { TitleRequestModel } from './models/title-request.model';
import { TitleRequestStatus } from './enums/title-request-status.enum';

@Injectable()
export class TitleGenerationService {
    private readonly logger = new Logger(TitleGenerationService.name);
    constructor(
        private readonly titleRequestModel: TitleRequestModel,
        private readonly openAIService: OpenAIService,
        private readonly kafkaService: KafkaService,
        private readonly cls: ClsService
    ) {}
    async getTitle(titleData: GetTitleDto): Promise<GetTitleResponseDto> {
        const existingTitleRequest = await this.titleRequestModel.findByText(titleData.text)
        if (!existingTitleRequest) {
            const requestId = this.cls.getId()
            titleData.requestId = requestId
            this.kafkaService.publishMessage('create_title', JSON.stringify(titleData))
            this.logger.log(`New title request created. Request ID: ${requestId}`);
            return {
                requestId,
                status: TitleRequestStatus.QUEUED,
            }
        }
        const { requestId, title, status } = existingTitleRequest
        this.logger.log(`Existing title request found. Request ID: ${requestId}`);
        return { requestId, title, status }
    }

    async getTitleByRequestId(id: string): Promise<GetTitleResponseDto> {
        this.logger.log(`Getting title by request ID: ${id}`);
        const result = await this.titleRequestModel.findByRequestId(id)
        if (!result) {
            throw new HttpException('Record not found', HttpStatus.NOT_FOUND)
        }
        return result
    }

    async generateTitle({text, requestId}: GetTitleDto): Promise<void> {
        this.logger.log(`Generating title for request ID: ${requestId}`);
        const prompt = `Can you provide the title to following text :\n\n${text}\n\n`
        const completion = await this.openAIService.promptMe(prompt)
        const title =  completion?.choices?.[0]?.text
        const doc = {
            text,
            title,
            requestId,
            status: TitleRequestStatus.COMPLETED,
        }
        this.titleRequestModel.create(doc)
        this.logger.log(`Data consumed. Request ID: ${requestId}`);
    }

    updateTitleStatusOnError(requestId: string): void {
        this.titleRequestModel.updateTitleStatusOnError(requestId)
    }
}
