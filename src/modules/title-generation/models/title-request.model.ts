import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { TitleRequest, TitleRequestDocument } from "../schemas/title-request.schema";
import { TitleRequestStatus } from '../enums/title-request-status.enum';

@Injectable()
export class TitleRequestModel {
    constructor(
        @InjectModel(TitleRequest.name) private titleRequestModel: Model<TitleRequestDocument>
    ) {}

    async findByText(text: string): Promise<TitleRequestDocument | null> {
        return this.titleRequestModel.findOne({text}).exec()
    }

    async create(titleRequest: TitleRequest): Promise<TitleRequestDocument> {
        const createdTitleRequest = new this.titleRequestModel(titleRequest)
        return createdTitleRequest.save()
    }

    async findByRequestId(requestId: string): Promise<TitleRequestDocument | null> {
        return this.titleRequestModel.findOne({requestId}).exec()
    }

    async updateRequestById(requestId: string, status: TitleRequestStatus) {
        return this.titleRequestModel.findOneAndUpdate({requestId}, {status}, {new: true}).exec()
    }

    async updateTitleStatusOnError(requestId: string) {
        return this.titleRequestModel.findOneAndUpdate({requestId}, {status: TitleRequestStatus.ERROR}, {new: true}).exec()
    }
}
