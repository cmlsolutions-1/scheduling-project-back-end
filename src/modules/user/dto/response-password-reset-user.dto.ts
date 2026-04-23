import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserStatus } from "../entity/user.entity";

export class ResponsePasswordResetUserDto {
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

    @ApiProperty({ required: false })
    companyId?: string;

    @ApiProperty({ required: false })
    companyName?: string;
}
