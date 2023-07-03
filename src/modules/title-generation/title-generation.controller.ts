import { Body, Controller, Get, Logger, Param, Post, UseFilters } from '@nestjs/common';
import { TitleGenerationService } from './title-generation.service';
import { SkipThrottle } from '@nestjs/throttler';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GetTitleDto } from './dto/get-title.dto';
import { GetTitleResponseDto } from './dto/get-title.response.dto';

@Controller('title-generation')
export class TiteGenerationController {
    private readonly logger = new Logger('TitleGenerationController');
    constructor(private readonly titleGenerationService: TitleGenerationService) {}

    @SkipThrottle(false)
    @Post()
    async getTitle(
        @Body() data: GetTitleDto
    ): Promise<GetTitleResponseDto> {
        this.logger.log(`Received getTitle request: ${JSON.stringify(data)}`);
        const response = await this.titleGenerationService.getTitle(data)
        this.logger.log(`Response sent for getTitle request: ${JSON.stringify(response)}`);
        return response;
    }

    @Get(':id')
    async getTitleByRequestId(@Param('id') id: string): Promise<GetTitleResponseDto> {
        this.logger.log(`Received getTitleByRequestId request. ID: ${id}`);
        const response = await this.titleGenerationService.getTitleByRequestId(id)
        this.logger.log(`Response sent for getTitleByRequestId request: ${JSON.stringify(response)}`);
        return response
    }

    @EventPattern('create_title')
    async handleCreateTitleEvent(@Payload() data) {
        this.logger.log(`Received create_title event: ${JSON.stringify(data)}`);
        await this.titleGenerationService.generateTitle(data)
        this.logger.log(`create_title event processed`);
    }

    @EventPattern('error')
    async handleErrorEvent(@Payload() data) {
        const {exception, requestId} = data
        this.logger.log(`Received error event: ${JSON.stringify(exception)}`);
        this.titleGenerationService.updateTitleStatusOnError(requestId)
    }
}
