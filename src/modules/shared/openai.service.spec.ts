import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIApi, CreateCompletionResponse, ListModelsResponse } from 'openai';
import { OpenAIService } from './openai.service';
import { AxiosResponse } from 'axios';

describe('OpenAIService', () => {
  let service: OpenAIService;
  let client: OpenAIApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
    client = service['client'];
  });

  describe('promptMe', () => {
    it('should call createCompletion with the correct parameters and return the response data', async () => {
      const mockPrompt = 'Can you provide the title?';
      const mockResponse: CreateCompletionResponse = {
        id: 'completion-id',
        object: 'completion',
        created: 1234567890,
        model: 'text-davinci-003',
        choices: [
          {
            text: 'Sample title',
            finish_reason: 'stop',
            index: 0,
            logprobs: null,
          },
        ],
      };
      const createCompletionSpy = jest
        .spyOn(client, 'createCompletion')
        .mockResolvedValueOnce({ data: mockResponse } as AxiosResponse<CreateCompletionResponse>);

      const result = await service.promptMe(mockPrompt);

      expect(createCompletionSpy).toHaveBeenCalledWith({
        prompt: mockPrompt,
        model: 'text-davinci-003',
        max_tokens: 20,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listModels', () => {
    it('should call listModels and return the response data', async () => {
      const mockResponse: ListModelsResponse = {
        object: 'list',
        data: [
          {
            id: 'text-davinci-003',
            object: 'model',
            created: 1234567890,
            owned_by: 'OpenAI'
          },
        ],
      };
      const listModelsSpy = jest
        .spyOn(client, 'listModels')
        .mockResolvedValueOnce({ data: mockResponse } as AxiosResponse<ListModelsResponse>);

      const result = await service.listModels();

      expect(listModelsSpy).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});
