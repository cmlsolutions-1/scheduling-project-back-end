import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class SearchPasswordResetUserDto {
    @IsEmail()
    @ApiProperty({ example: 'usuario@empresa.com' })
    email: string;
}
