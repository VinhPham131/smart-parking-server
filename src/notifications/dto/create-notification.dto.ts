import { IsString } from "class-validator";

export class CreateNotificationDto {
    @IsString()
    message: string;

    metadata?: any;
}
