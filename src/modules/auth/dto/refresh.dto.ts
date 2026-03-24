import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";




export class RefreshDto {
    
    @ApiProperty({ example: 'a1baaec6417e623bec08f22eefba55844cb35c5b8061af65959cda366e1a23498673cd91a7c7d621e600edb1671d9b83d6662e0ab596a022d72f6c9c97df4267' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}