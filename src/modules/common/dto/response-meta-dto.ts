import { ApiProperty } from "@nestjs/swagger";




export class ResponseMetaDto {
  @ApiProperty({ example: '/api/user/123' })
  path: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: '2026-01-19T12:34:56.000Z' })
  timestamp: string;

  @ApiProperty({ required: false })
  statusCode?: number;
}
