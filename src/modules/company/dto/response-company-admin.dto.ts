import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserStatus } from "src/modules/user/entity/user.entity";

export class ResponseCompanyAdminDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false, nullable: true })
    phone?: string | null;

    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty({ enum: UserStatus })
    status: UserStatus;
}
