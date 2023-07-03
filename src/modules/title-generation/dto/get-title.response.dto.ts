import { TitleRequestStatus } from "../enums/title-request-status.enum";

export class GetTitleResponseDto {
    requestId: string;
    status: TitleRequestStatus
    title?: string;
}