import { ApiProperty } from "@nestjs/swagger";
import { CompanyStatus } from "../entity/company.entity";

export class ResponseCompanyDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    frontendDomain: string;

    @ApiProperty({ required: false })
    whatsappPhoneNumber?: string;

    @ApiProperty({ enum: CompanyStatus })
    status: CompanyStatus;
}
