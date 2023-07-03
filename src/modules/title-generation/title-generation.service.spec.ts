import { Test, TestingModule } from '@nestjs/testing';
import { TitleGenerationService } from './title-generation.service';
import { TitleRequestModel } from './models/title-request.model';
import { OpenAIService } from '../shared/openai.service';
import { KafkaService } from '../shared/kafka.service';
import { ClsService } from 'nestjs-cls';
import { GetTitleDto } from './dto/get-title.dto';
import { TitleRequestStatus } from './enums/title-request-status.enum';
import { TitleRequestDocument } from './schemas/title-request.schema';
import { CreateCompletionResponse } from 'openai';
import { ErrorFilter } from './common/filters/error.filter';

describe('TitleGenerationService', () => {
  let service: TitleGenerationService;
  let titleRequestModel: TitleRequestModel;
  let openAIService: OpenAIService;
  let kafkaService: KafkaService;
  let cls: ClsService;
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TitleGenerationService,
        ErrorFilter,
        {
          provide: TitleRequestModel,
          useValue: {
            findByText: jest.fn(),
            findByRequestId: jest.fn(),
            create: jest.fn(),
            updateRequestById: jest.fn()
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            promptMe: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            publishMessage: jest.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            getId: jest.fn(),
          },
        },
      ],
    })
    .compile();

    service = module.get<TitleGenerationService>(TitleGenerationService);
    titleRequestModel = module.get<TitleRequestModel>(TitleRequestModel);
    openAIService = module.get<OpenAIService>(OpenAIService);
    kafkaService = module.get<KafkaService>(KafkaService);
    cls = module.get<ClsService>(ClsService);
  });

  describe('getTitle', () => {
    it('should return existing title if found', async () => {
      const text = 'sample text';
      const existingTitleRequest = {
        requestId: 'sampleRequestId',
        title: 'sample title',
        status: TitleRequestStatus.COMPLETED,
      } as TitleRequestDocument;
      jest.spyOn(titleRequestModel, 'findByText').mockResolvedValue(existingTitleRequest);

      const result = await service.getTitle({ text });
      expect(titleRequestModel.findByText).toHaveBeenCalledWith(text);
      expect(result).toEqual(existingTitleRequest);
    });

    it('should create a new title request if not found', async () => {
      const text = 'sample text';
      const requestId = 'sampleRequestId';
      const getTitleDto: GetTitleDto = { text };
      const getTitleResponse = {
        requestId,
        status: TitleRequestStatus.QUEUED,
      } as TitleRequestDocument;

      jest.spyOn(titleRequestModel, 'findByText').mockResolvedValue(null);
      jest.spyOn(cls, 'getId').mockReturnValue(requestId);
      jest.spyOn(kafkaService, 'publishMessage');
      jest.spyOn(titleRequestModel, 'create').mockResolvedValue(getTitleResponse);

      const result = await service.getTitle(getTitleDto);

      expect(titleRequestModel.findByText).toHaveBeenCalledWith(text);
      expect(cls.getId).toHaveBeenCalled();
      expect(kafkaService.publishMessage).toHaveBeenCalledWith(
        'create_title',
        JSON.stringify({ ...getTitleDto, requestId })
      );
      expect(result).toEqual(getTitleResponse);
    });

  });

  describe('getTitleByRequestId', () => {
    it('should call titleRequestModel.findByRequestId with the correct id', async () => {
      const id = 'sampleRequestId';
      const getTitleResponseDto = {
        requestId: id,
        title: 'sample title',
        status: TitleRequestStatus.COMPLETED,
        text: 'sample text',
      } as TitleRequestDocument;
      jest.spyOn(titleRequestModel, 'findByRequestId').mockResolvedValue(getTitleResponseDto);

      const result = await service.getTitleByRequestId(id);

      expect(titleRequestModel.findByRequestId).toHaveBeenCalledWith(id);
      expect(result).toEqual(getTitleResponseDto);
    });
  });

  describe('consumeData', () => {
    it('should call openAIService.promptMe and titleRequestModel.create with the correct data', async () => {
      const text = 'sample text';
      const requestId = 'sampleRequestId';
      const prompt = `Can you provide the title to following text :\n\n${text}\n\n`
      const getTitleDto: GetTitleDto = { text, requestId };
      const completion = {
        choices: [{ text: 'sample title' }],
      } as CreateCompletionResponse;
      const createResult = {
        requestId,
        status: TitleRequestStatus.COMPLETED,
        text,
        title: completion.choices[0].text,
      } as TitleRequestDocument;

      jest.spyOn(openAIService, 'promptMe').mockResolvedValue(completion);
      jest.spyOn(titleRequestModel, 'create').mockResolvedValue(createResult);

      const result = await service.generateTitle(getTitleDto);

      expect(openAIService.promptMe).toHaveBeenCalledWith(prompt);
      expect(titleRequestModel.create).toHaveBeenCalledWith({
        text,
        title: completion.choices[0].text,
        requestId,
        status: TitleRequestStatus.COMPLETED,
      });
    });
  });
});
