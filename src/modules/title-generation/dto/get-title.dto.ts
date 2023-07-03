import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetTitleDto {
    @IsNotEmpty()
    @IsString()
    text: string;

    @IsOptional()
    @IsString()
    requestId?: string;
}
