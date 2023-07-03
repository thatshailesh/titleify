import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi, CreateCompletionResponse, ListModelsResponse } from 'openai'

@Injectable()
export class OpenAIService {
    private readonly client: OpenAIApi
    private readonly MAX_TOKENS = 20
    private readonly DEFAULT_COMPLETION_MODEL = 'text-davinci-003'
    constructor(private readonly configService: ConfigService) {
        const configuration = new Configuration({
            apiKey: configService.get('OPENAI_API_KEY')
        })
        this.client = new OpenAIApi(configuration)
    }

    promptMe(query: string): Promise<CreateCompletionResponse> {
        return this.client.createCompletion({
            prompt: query,
            model: this.DEFAULT_COMPLETION_MODEL,
            max_tokens: this.MAX_TOKENS
        }).then(response => response.data)
    }

    listModels(): Promise<ListModelsResponse> {
        return this.client.listModels().then(response => response.data)
    }
}
