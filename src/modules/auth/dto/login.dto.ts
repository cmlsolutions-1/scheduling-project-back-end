
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";


export class LoginDto {
    
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(50)
    email: string;

    @ApiProperty()
    @IsString()
    @MaxLength(200)
    password?: string;

}