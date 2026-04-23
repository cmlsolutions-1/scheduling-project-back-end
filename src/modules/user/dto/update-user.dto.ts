import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
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

    @IsString()
    @IsOptional()
    @MinLength(8)
    @MaxLength(200)
    @ApiProperty({ required: false })
    password?: string;

    @IsOptional()
    @IsEnum(UserRole)
    @ApiProperty()
    @IsOptional()
    role?: UserRole;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false })
    companyId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({ required: false, nullable: true })
    imageId?: string | null;
}
