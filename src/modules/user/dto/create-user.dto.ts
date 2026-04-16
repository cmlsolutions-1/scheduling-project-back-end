import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { UserRole } from "../entity/user.entity";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty()
    name: string;

    @IsString()
    @MaxLength(200)

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    email?: string;

    @IsString()
    @IsNumberString()
    @MaxLength(20)
    @ApiProperty()
    phone?: string;

    @IsString()
    @MaxLength(200)
    @ApiProperty()
    password?: string;

    @IsEnum(UserRole)
    @ApiProperty()
    role: UserRole;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false })
    companyId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    imageId?: string | null;

}
