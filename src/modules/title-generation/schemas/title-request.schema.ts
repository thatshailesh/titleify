import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import { TitleRequestStatus } from "../enums/title-request-status.enum";

@Schema({
    versionKey: false
})
export class TitleRequest {
    @Prop()
    text: string;

    @Prop()
    title: string;

    @Prop()
    requestId: string;

    @Prop({enum: TitleRequestStatus, default: TitleRequestStatus.QUEUED})
    status: TitleRequestStatus;
}

export type TitleRequestDocument = TitleRequest & Document
export const titleRequestSchema = SchemaFactory.createForClass(TitleRequest)
titleRequestSchema.index({text: 1})
titleRequestSchema.index({requestId: 1})
