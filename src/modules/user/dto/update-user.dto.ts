import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { UserRole } from "../entity/user.entity";



export class UpdateUserDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @IsOptional()
    @ApiProperty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsEmail()
    @MaxLength(200)
    @ApiProperty()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    @ApiProperty()
    @IsOptional()
    phone?: string;

    @IsOptional()
    @IsEnum(UserRole)
    @ApiProperty()
    @IsOptional()
    role?: UserRole;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false })
    companyId?: string;
}
