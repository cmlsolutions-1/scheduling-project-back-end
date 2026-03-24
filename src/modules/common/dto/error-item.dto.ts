import { ApiProperty } from "@nestjs/swagger";



export class ErrorItemDto {

  @ApiProperty({ example: 'VALIDATION_ERROR', required: false })
  code?: string;

  @ApiProperty({ example: 'error' })
  message: string;
}