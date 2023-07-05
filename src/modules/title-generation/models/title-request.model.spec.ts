import { Model } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TitleRequestModel } from './title-request.model';
import { TitleRequest, TitleRequestDocument } from '../schemas/title-request.schema';
import { TitleRequestStatus } from '../enums/title-request-status.enum';

describe('TitleRequestModel', () => {
  let titleRequestModel: TitleRequestModel;
  let titleRequestDocument: Model<TitleRequestDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitleRequestModel,
        {
          provide: getModelToken(TitleRequest.name),
          useValue: {
            findOne: jest.fn().mockReturnThis(),
            findOneAndUpdate: jest.fn().mockReturnThis(),
            save: jest.fn(),
            exec: jest.fn().mockResolvedValue(null)
          },
        },
      ],
    }).compile();

    titleRequestDocument = module.get<Model<TitleRequestDocument>>(getModelToken(TitleRequest.name))
    titleRequestModel = module.get<TitleRequestModel>(TitleRequestModel);
  });

  describe('findByText', () => {
    it('should call findOne method with the correct query', async () => {
      const text = 'sample text';
      const findOneSpy = jest.spyOn(titleRequestDocument, 'findOne');

      await titleRequestModel.findByText(text);

      expect(findOneSpy).toHaveBeenCalledWith({ text });
    });
  });

  describe('findByRequestId', () => {
    it('should call findOne method with the correct query', async () => {
      const requestId = 'sampleRequestId';
      const findOneSpy = jest.spyOn(titleRequestDocument, 'findOne');

      await titleRequestModel.findByRequestId(requestId);

      expect(findOneSpy).toHaveBeenCalledWith({ requestId });
    });
  });

  describe('updateRequestById', () => {
    it('should call findOneAndUpdate method with the correct query and update', async () => {
      const requestId = 'sampleRequestId';
      const status = TitleRequestStatus.COMPLETED;
      const findOneAndUpdateSpy = jest.spyOn(titleRequestDocument, 'findOneAndUpdate');

      await titleRequestModel.updateRequestById(requestId, status);

      expect(findOneAndUpdateSpy).toHaveBeenCalledWith({ requestId }, { status }, { new: true });
    });
  });

  describe('updateRequestById - No Document', () => {
    it('should return null if no document is found', async () => {
      const requestId = 'nonExistingRequestId';
      jest.spyOn(titleRequestDocument, 'findOneAndUpdate');
      const res = await titleRequestModel.updateRequestById(requestId, TitleRequestStatus.ERROR)
      expect(res).toBe(null);
    });

    it('should throw an error if an exception occurs during update', async () => {
      const requestId = 'sampleRequestId';
      const status = TitleRequestStatus.ERROR;
      jest.spyOn(titleRequestDocument, 'findOneAndUpdate').mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      await expect(titleRequestModel.updateRequestById(requestId, status)).rejects.toThrow();
    });
  });
});
