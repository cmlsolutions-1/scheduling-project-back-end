import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class UploadImageDto {
    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false, description: 'Solo para SUPER_ADMIN si no usa tenant' })
    companyId?: string;
}
