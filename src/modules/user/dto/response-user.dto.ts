import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { UserRole, UserStatus } from "../entity/user.entity";


export class ResponseUserDto {

    @ApiProperty()
    id: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    name: string;

    @IsString()
    @MaxLength(200)
    @ApiProperty()
    description?: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    email?: string;

    @ApiProperty()
    phone?: string | null;

    @ApiProperty({ enum: UserStatus })
    status: UserStatus;

    @ApiProperty({ required: false })
    companyId?: string;

    @IsEnum(UserRole)
    @ApiProperty()
    role: UserRole;

}