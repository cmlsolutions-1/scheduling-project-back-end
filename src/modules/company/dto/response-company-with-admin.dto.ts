import { ApiProperty } from "@nestjs/swagger";
import { CompanyStatus } from "../entity/company.entity";
import { ResponseCompanyAdminDto } from "./response-company-admin.dto";

export class ResponseCompanyWithAdminDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty()
    frontendDomain: string;

    @ApiProperty({ enum: CompanyStatus })
    status: CompanyStatus;

    @ApiProperty()
    hasAdmin: boolean;

    @ApiProperty({ nullable: true, type: ResponseCompanyAdminDto })
    admin: ResponseCompanyAdminDto | null;
}
