import { ApiProperty } from "@nestjs/swagger";
import { ErrorItemDto } from "./error-item.dto";
import { ResponseMetaDto } from "./response-meta-dto";




export class ErrorResponseDto {
    @ApiProperty({ example: false })
    ok: boolean;

    @ApiProperty({ example: 'Validación fallida' })
    message: string;

    @ApiProperty({ type: 'null', nullable: true, example: null })
    data: null;

    @ApiProperty({ type: () => [ErrorItemDto] })
    errors: ErrorItemDto[];

    @ApiProperty({ type: () => ResponseMetaDto })
    meta: ResponseMetaDto;
}