import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { Model } from 'mongoose';
import { TitleRequestDocument, TitleRequest } from '../src/modules/title-generation/schemas/title-request.schema';
import { getModelToken } from '@nestjs/mongoose';

describe('TitleGenerationController (e2e)', () => {
  let app: INestApplication;
  let titleRequestModel: Model<TitleRequestDocument>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    titleRequestModel = moduleFixture.get<Model<TitleRequestDocument>>(
      getModelToken(TitleRequest.name),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await titleRequestModel.deleteMany({}).exec();
  });

  describe('POST /title-generation', () => {
    it('should create a new title successfully', async () => {
      const titleData = {
        text: 'Sample text',
      };

      const response = await request(app.getHttpServer())
        .post('/title-generation')
        .send(titleData)
        .expect(HttpStatus.CREATED);
      const { requestId, status } = response.body;

      expect(requestId).toBeDefined();
      expect(status).toEqual('QUEUED');
    });
    it('should return 429 Too Many Requests when rate limit is exceeded', async () => {
      const requests = Array(6).fill(0); // Send 6 requests to exceed the rate limit of 5
      const titleData = {
        text: 'Sample text',
      };
      const responses = await Promise.all(
        requests.map(() =>
          request(app.getHttpServer()).post('/title-generation').send(titleData),
        ),
      );
  
      const lastResponse = responses[responses.length - 1];
  
      expect(lastResponse.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(lastResponse.body.message).toBe('ThrottlerException: Too Many Requests');
    });

    it('should allow requests within the rate limit', async () => {
      const requests = Array(3).fill(0); // Send 3 requests within the rate limit of 5
      const requestId = '$ampleid';
      const titleRequest = new titleRequestModel({
        text: 'Sample text',
        requestId: requestId,
        title: 'sample title',
        status: 'COMPLETED'
      });
      await titleRequest.save();
      const responses = await Promise.all(
        requests.map(() =>
          request(app.getHttpServer()).get(`/title-generation/${requestId}`),
        ),
      );
  
      const lastResponse = responses[responses.length - 1];
  
      expect(lastResponse.status).toBe(HttpStatus.OK);
      expect(lastResponse.body).toBeDefined();
    });
  });

  describe('GET /title-generation/:id', () => {
    it('should retrieve a title by request ID successfully', async () => {
      const titleRequest = new titleRequestModel({
        text: 'Sample text',
        requestId: '$ampleid',
        title: 'sample title',
        status: 'COMPLETED'
      });
      await titleRequest.save();

      const response = await request(app.getHttpServer())
        .get(`/title-generation/${titleRequest.requestId}`)
        .expect(HttpStatus.OK);

      const { title, requestId, status } = response.body;

      expect(title).toBeDefined();
      expect(requestId).toEqual(titleRequest.requestId);
      expect(status).toBeDefined();
    });

    it('should return 404 if title request ID not found', async () => {
      const nonExistingRequestId = 'non-existing-request-id';

      const response = await request(app.getHttpServer())
        .get(`/title-generation/${nonExistingRequestId}`)
        .expect(HttpStatus.NOT_FOUND);
      const { status, path } = response.error as any;

      expect(status).toEqual(HttpStatus.NOT_FOUND);
      expect(path).toEqual(`/title-generation/${nonExistingRequestId}`);
    });
  });
});
