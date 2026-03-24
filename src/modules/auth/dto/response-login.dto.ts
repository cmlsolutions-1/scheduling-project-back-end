
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class ResponseLoginDto {

    
    @ApiProperty()
    @IsString()
    accesToken: string;

    @ApiProperty()
    @IsString()
    refreshToken?: string;
}